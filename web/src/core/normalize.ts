// Turn rows from any bank / UPI / spreadsheet export into Transactions.
// Port of normalize_columns() in tracker.py, extended for common Indian
// bank statement layouts (separate Debit/Credit columns, DD/MM/YYYY dates).

import { resolveCategory } from './categorize';
import type { Transaction } from './types';

export type RawRow = Record<string, unknown>;

const ALIASES = {
  date: ['date', 'txn_date', 'transaction_date', 'value_date', 'tran_date', 'posting_date', 'value_dt', 'txn_dt', 'tran_dt', 'date_time'],
  description: ['description', 'narration', 'details', 'particulars', 'remarks', 'transaction_details', 'merchant', 'note', 'paid_to'],
  category: ['category', 'type_of_expense', 'tag'],
  // CLI convention: positive = spent, negative = money in.
  spent: ['money_spent', 'spent', 'expense'],
  // Generic amount columns: CLI convention unless the file marks money in with a leading "+".
  amount: ['amount', 'amt', 'transaction_amount', 'txn_amount'],
  debit: ['debit', 'withdrawal', 'withdrawal_amt', 'withdrawal_amount', 'debit_amount', 'dr'],
  credit: ['credit', 'deposit', 'deposit_amt', 'deposit_amount', 'credit_amount', 'cr'],
  // A separate column saying whether the amount is a debit or a credit.
  kind: ['dr_cr', 'drcr', 'cr_dr', 'debit_credit', 'transaction_type', 'txn_type', 'type'],
  left: ['money_left', 'balance', 'closing_balance', 'running_balance', 'available_balance'],
  method: ['payment_method', 'mode', 'payment_mode', 'method'],
} as const;

const AMOUNT_KEYS = [...ALIASES.spent, ...ALIASES.amount, ...ALIASES.debit, ...ALIASES.credit] as readonly string[];
const DATE_KEYS = ALIASES.date as readonly string[];

/** "Withdrawal Amt. (INR)" -> "withdrawal_amt" */
export const keyOf = (header: string) =>
  header.toLowerCase().replace(/\(.*?\)/g, '').trim().replace(/[.]/g, '').replace(/[\s/-]+/g, '_').replace(/^_+|_+$/g, '');

/** Text of a spreadsheet cell, whatever type the parser gave us. */
export function cellText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  return '';
}

/** Does this sheet row look like the header of a transactions table? */
export function isHeaderRow(cells: unknown[]): boolean {
  const keys = cells.map((c) => keyOf(cellText(c)));
  return keys.some((k) => DATE_KEYS.includes(k)) && keys.some((k) => AMOUNT_KEYS.includes(k));
}

function pick(row: Record<string, unknown>, names: readonly string[]): unknown {
  for (const n of names) if (n in row && row[n] !== '' && row[n] != null) return row[n];
  return undefined;
}

/** Parse "₹1,200.50", "1200 Dr", "500 Cr", "(500)", "−240" and friends. Returns NaN when empty. */
export function parseAmount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  let s = cellText(value).trim().replace(/[−–]/g, '-');
  if (!s) return NaN;
  let sign = 1;
  if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }
  if (/cr\.?$/i.test(s)) sign = -1;
  s = s.replace(/(dr|cr)\.?$/i, '').replace(/[₹,\s]|rs\.?|inr/gi, '');
  const n = Number(s);
  return s && Number.isFinite(n) ? sign * n : NaN;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const monthOf = (word: string) => MONTHS[word.slice(0, 3).toLowerCase()];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number | undefined, d: number) => {
  if (!m) return null;
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
};

/**
 * Parse a date into YYYY-MM-DD. Slash/dash dates are read day-first
 * (DD/MM/YYYY), which is how Indian banks write them; a date that only
 * makes sense month-first (08/31/2025) is read that way.
 */
export function parseDate(value: unknown): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return iso(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    // Excel serial date
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000);
    return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  const s = cellText(value).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) return iso(+m[3], +m[2], +m[1]) ?? iso(+m[3], +m[1], +m[2]);
  m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3,9})[\s,-]+(\d{2,4})/);
  if (m) return iso(+m[3], monthOf(m[2]), +m[1]);
  m = s.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (m) return iso(+m[3], monthOf(m[1]), +m[2]);
  return null;
}

let counter = 0;
export const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `t${Date.now().toString(36)}${(counter++).toString(36)}`);

export interface NormalizeResult {
  transactions: Transaction[];
  skipped: number;
  /** Balance before the first imported row, when the file has a balance column. */
  inferredStartBalance: number | null;
}

/** Map arbitrary rows to Transactions. Rows without a date or a non-zero amount are skipped. */
export function normalizeRows(rawRows: RawRow[]): NormalizeResult {
  const rows = rawRows.map((raw) => {
    const row: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) row[keyOf(k)] = v;
    return row;
  });
  // UPI app exports often write money in as "+₹500" and money out as "-₹240".
  const plusMeansIn = rows.some((r) => /^\s*\+/.test(cellText(pick(r, ALIASES.amount))));

  const out: Transaction[] = [];
  const lefts: number[] = [];
  let skipped = 0;

  for (const row of rows) {
    const date = parseDate(pick(row, ALIASES.date));
    let amount = parseAmount(pick(row, ALIASES.spent));
    if (Number.isNaN(amount)) {
      amount = parseAmount(pick(row, ALIASES.amount));
      if (!Number.isNaN(amount)) {
        const kind = cellText(pick(row, ALIASES.kind)).trim().toLowerCase();
        if (/^(cr|credit|c|received|deposit)\.?$/.test(kind)) amount = -Math.abs(amount);
        else if (/^(dr|debit|d|paid|sent|withdrawal)\.?$/.test(kind)) amount = Math.abs(amount);
        else if (plusMeansIn) amount = -amount;
      }
    }
    if (Number.isNaN(amount)) {
      const debit = parseAmount(pick(row, ALIASES.debit));
      const credit = parseAmount(pick(row, ALIASES.credit));
      if (!Number.isNaN(debit) && debit !== 0) amount = Math.abs(debit);
      else if (!Number.isNaN(credit) && credit !== 0) amount = -Math.abs(credit);
    }
    if (!date || Number.isNaN(amount) || amount === 0) { skipped++; continue; }

    const description = cellText(pick(row, ALIASES.description)).trim() || 'Untitled';
    const category = resolveCategory(cellText(pick(row, ALIASES.category)), description, amount);
    const method = cellText(pick(row, ALIASES.method)).trim() || 'UPI';

    lefts.push(parseAmount(pick(row, ALIASES.left)));
    out.push({ id: newId(), date, description, category, amount, paymentMethod: method });
  }

  // Many banks list newest first; store everything oldest first.
  if (out.length > 1 && out[0].date > out[out.length - 1].date) {
    out.reverse();
    lefts.reverse();
  }
  const inferredStartBalance = out.length && !Number.isNaN(lefts[0]) ? lefts[0] + out[0].amount : null;
  return { transactions: out, skipped, inferredStartBalance };
}
