// Pure functions over a Ledger: add, edit, summarize. No React, no storage.

import { CATEGORIES, resolveCategory } from './categorize';
import { newId } from './normalize';
import type { Budget, Ledger, Transaction } from './types';

/** Transactions oldest first; same-day rows keep the order they were added. */
export function sorted(ledger: Ledger): Transaction[] {
  return ledger.transactions
    .map((t, i) => [t, i] as const)
    .sort((a, b) => (a[0].date < b[0].date ? -1 : a[0].date > b[0].date ? 1 : a[1] - b[1]))
    .map(([t]) => t);
}

export interface Row extends Transaction {
  /** Balance after this transaction (the CLI's money_left). */
  balance: number;
}

/** Every transaction with its running balance. Balance is always derived, never stored. */
export function withBalances(ledger: Ledger): Row[] {
  let bal = ledger.startBalance;
  return sorted(ledger).map((t) => {
    bal = round(bal - t.amount);
    return { ...t, balance: bal };
  });
}

export const currentBalance = (ledger: Ledger) =>
  round(ledger.transactions.reduce((b, t) => b - t.amount, ledger.startBalance));

export const round = (n: number) => Math.round(n * 100) / 100;

export interface NewEntry {
  date: string;
  description: string;
  amount: number;
  category?: string;
  paymentMethod?: string;
}

export function addExpense(ledger: Ledger, e: NewEntry): Ledger {
  const amount = Math.abs(e.amount);
  return add(ledger, { ...e, amount });
}

export function addIncome(ledger: Ledger, e: NewEntry): Ledger {
  const amount = -Math.abs(e.amount);
  return add(ledger, { ...e, amount, category: e.category || 'Income' });
}

function add(ledger: Ledger, e: NewEntry): Ledger {
  const t: Transaction = {
    id: newId(),
    date: e.date,
    description: e.description.trim() || 'Untitled',
    amount: round(e.amount),
    category: resolveCategory(e.category, e.description, e.amount),
    paymentMethod: e.paymentMethod?.trim() || 'UPI',
  };
  return { ...ledger, transactions: [...ledger.transactions, t] };
}

export function importTransactions(ledger: Ledger, incoming: Transaction[], inferredStart: number | null): Ledger {
  const startBalance =
    ledger.transactions.length === 0 && inferredStart != null ? round(inferredStart) : ledger.startBalance;
  return { ...ledger, startBalance, transactions: [...ledger.transactions, ...incoming] };
}

export const updateTransaction = (ledger: Ledger, id: string, patch: Partial<Transaction>): Ledger => ({
  ...ledger,
  transactions: ledger.transactions.map((t) => (t.id === id ? { ...t, ...patch, id } : t)),
});

export const deleteTransaction = (ledger: Ledger, id: string): Ledger => ({
  ...ledger,
  transactions: ledger.transactions.filter((t) => t.id !== id),
});

export const upsertBudget = (ledger: Ledger, b: Omit<Budget, 'id'> & { id?: string }): Ledger => {
  const budget: Budget = { ...b, id: b.id ?? newId() };
  const exists = ledger.budgets.some((x) => x.id === budget.id);
  return {
    ...ledger,
    budgets: exists ? ledger.budgets.map((x) => (x.id === budget.id ? budget : x)) : [...ledger.budgets, budget],
  };
};

export const deleteBudget = (ledger: Ledger, id: string): Ledger => ({
  ...ledger,
  budgets: ledger.budgets.filter((b) => b.id !== id),
});

// ---------- Summaries ----------

/** "YYYY-MM" for every month that has data, newest first. */
export function months(ledger: Ledger): string[] {
  return [...new Set(ledger.transactions.map((t) => t.date.slice(0, 7)))].sort().reverse();
}

export const inMonth = (rows: Transaction[], month: string | null) =>
  month ? rows.filter((t) => t.date.startsWith(month)) : rows;

export interface Summary {
  income: number;
  expense: number;
  net: number;
  byCategory: { category: string; expense: number; income: number }[];
}

export function summarize(rows: Transaction[]): Summary {
  const map = new Map<string, { expense: number; income: number }>();
  let income = 0;
  let expense = 0;
  for (const t of rows) {
    const e = map.get(t.category) ?? { expense: 0, income: 0 };
    if (t.amount > 0) { e.expense += t.amount; expense += t.amount; }
    else { e.income -= t.amount; income -= t.amount; }
    map.set(t.category, e);
  }
  const byCategory = [...map.entries()]
    .map(([category, v]) => ({ category, expense: round(v.expense), income: round(v.income) }))
    .sort((a, b) => b.expense - a.expense || b.income - a.income);
  return { income: round(income), expense: round(expense), net: round(income - expense), byCategory };
}

/** Spending per day of a month: index 0 is the 1st. */
export function dailySpend(rows: Transaction[], month: string): number[] {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out = new Array<number>(days).fill(0);
  for (const t of rows) {
    if (t.amount > 0 && t.date.startsWith(month)) out[Number(t.date.slice(8, 10)) - 1] += t.amount;
  }
  return out.map(round);
}

/** Balance at the end of each day of the month (carrying earlier history in). */
export function dailyBalance(ledger: Ledger, month: string): number[] {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const rows = withBalances(ledger);
  const out: number[] = [];
  let bal = ledger.startBalance;
  let i = 0;
  for (let d = 1; d <= days; d++) {
    const day = `${month}-${String(d).padStart(2, '0')}`;
    while (i < rows.length && rows[i].date <= day) bal = rows[i++].balance;
    out.push(bal);
  }
  return out;
}

export function budgetSpent(ledger: Ledger, b: Budget): number {
  return round(
    ledger.transactions
      .filter((t) => t.amount > 0 && t.date >= b.start && t.date <= b.end)
      .filter((t) => b.categories.length === 0 || b.categories.includes(t.category))
      .reduce((s, t) => s + t.amount, 0),
  );
}

/** Built-in categories plus any custom ones already in the ledger. */
export function allCategories(ledger: Ledger): string[] {
  const extra = ledger.transactions.map((t) => t.category).filter((c) => !(CATEGORIES as readonly string[]).includes(c));
  return [...CATEGORIES, ...new Set(extra)];
}
