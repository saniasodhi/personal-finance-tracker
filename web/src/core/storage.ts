// The ledger lives in this browser's localStorage and nowhere else.

import { newId } from './normalize';
import { emptyLedger, type Budget, type Ledger, type Transaction } from './types';

const KEY = 'kharcha:ledger:v1';
const ISO = /^\d{4}-\d{2}-\d{2}$/;

type Loose = Record<string, unknown>;
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);

/** Keep only well-formed rows, so a hand-edited or corrupted save can't crash the app. */
export function sanitizeLedger(value: unknown): Ledger {
  if (!value || typeof value !== 'object') return emptyLedger();
  const v = value as Loose;
  const transactions: Transaction[] = (Array.isArray(v.transactions) ? (v.transactions as Loose[]) : [])
    .filter((t) => t && ISO.test(str(t.date)) && !Number.isNaN(num(t.amount)))
    .map((t) => ({
      id: str(t.id) || newId(),
      date: str(t.date),
      description: str(t.description, 'Untitled'),
      category: str(t.category, 'Other') || 'Other',
      amount: num(t.amount),
      paymentMethod: str(t.paymentMethod, 'UPI'),
    }));
  const budgets: Budget[] = (Array.isArray(v.budgets) ? (v.budgets as Loose[]) : [])
    .filter((b) => b && ISO.test(str(b.start)) && ISO.test(str(b.end)) && num(b.limit) > 0)
    .map((b) => ({
      id: str(b.id) || newId(),
      name: str(b.name, 'Budget'),
      limit: num(b.limit),
      start: str(b.start),
      end: str(b.end),
      categories: Array.isArray(b.categories) ? b.categories.filter((c): c is string => typeof c === 'string') : [],
    }));
  const start = num(v.startBalance);
  return { version: 1, startBalance: Number.isNaN(start) ? 0 : start, transactions, budgets };
}

export function loadLedger(): Ledger {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitizeLedger(JSON.parse(raw)) : emptyLedger();
  } catch {
    return emptyLedger();
  }
}

/** Returns false when the browser refused to save (private mode, storage full). */
export function saveLedger(ledger: Ledger): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(ledger));
    return true;
  } catch {
    return false;
  }
}

export function clearLedger() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
