// Turn rows from any bank / UPI / spreadsheet export into Transactions.
// Port of normalize_columns() in tracker.py, extended for common Indian
// bank statement layouts (separate Debit/Credit columns, DD/MM/YYYY dates).

import { resolveCategory } from './categorize';
import type { Transaction } from './types';

export type RawRow = Record<string, unknown>;

const ALIASES = {
  date: ['date', 'txn_date', 'transaction_date', 'value_date', 'tran_date', 'posting_date'],
  description: ['description', 'narration', 'details', 'particulars', 'remarks', 'transaction_details', 'merchant', 'note'],
  category: ['category', 'type_of_expense', 'tag'],
  spent: ['money_spent', 'amount', 'amt', 'spent', 'expense'],
  debit: ['debit', 'withdrawal', 'withdrawal_amt', 'withdrawal_amount', 'debit_amount', 'dr'],
  credit: ['credit', 'deposit', 'deposit_amt', 'deposit_amount', 'credit_amount', 'cr'],
  left: ['money_left', 'balance', 'closing_balance', 'running_balance'],
  method: ['payment_method', 'mode', 'payment_mode', 'method'],
} as const;

const keyOf = (header: string) =>
  header.toLowerCase().trim().replace(/[.()]/g, '').replace(/[\s/-]+/g, '_');

function pick(row: Record<string, unknown>, names: readonly string[]): unknown {
  for (const n of names) if (n in row && row[n] !== '' && row[n] != null) return row[n];
  return undefined;
}

/** Parse "₹1,200.50", "1200 Dr", "(500)" and friends. Returns NaN when empty. */
export function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value == null) return NaN;
  let s = String(value).trim();
  if (!s) return NaN;
  let sign = 1;
  if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }
  if (/\bcr\.?$/i.test(s)) { sign = -1; }
  s = s.replace(/(dr|cr)\.?$/i, '').replace(/[₹,\s]|rs\.?|inr/gi, '');
  const n = Number(s);
  return Number.isFinite(n) ? sign * n : NaN;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => {
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
};

/**
 * Parse a date into YYYY-MM-DD. Slash/dash dates are read day-first
 * (DD/MM/YYYY), which is how Indian banks write them.
 */
export function parseDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return iso(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    // Excel serial date
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  const s = String(value ?? '').trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3,4})[A-Za-z]*[\s-,]+(\d{2,4})/);
  if (m && MONTHS[m[2].toLowerCase()]) return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  m = s.match(/^([A-Za-z]{3,4})[A-Za-z]*\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS[m[1].toLowerCase()]) return iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
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

/** Map arbitrary rows to Transactions. Rows without a date or amount are skipped. */
export function normalizeRows(rows: RawRow[]): NormalizeResult {
  const out: Transaction[] = [];
  let skipped = 0;
  const lefts: number[] = [];

  for (const raw of rows) {
    const row: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) row[keyOf(k)] = v;

    const date = parseDate(pick(row, ALIASES.date));
    let amount = parseAmount(pick(row, ALIASES.spent));
    if (Number.isNaN(amount)) {
      const debit = parseAmount(pick(row, ALIASES.debit));
      const credit = parseAmount(pick(row, ALIASES.credit));
      if (!Number.isNaN(debit) && debit !== 0) amount = Math.abs(debit);
      else if (!Number.isNaN(credit) && credit !== 0) amount = -Math.abs(credit);
    }
    if (!date || Number.isNaN(amount)) { skipped++; continue; }

    const description = String(pick(row, ALIASES.description) ?? '').trim() || 'Untitled';
    const category = resolveCategory(pick(row, ALIASES.category) as string | undefined, description, amount);
    const method = String(pick(row, ALIASES.method) ?? '').trim() || 'UPI';

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
