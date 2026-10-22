// The ledger lives in this browser's localStorage and nowhere else.

import { emptyLedger, type Ledger } from './types';

const KEY = 'kharcha:ledger:v1';

export function loadLedger(): Ledger {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyLedger();
    const parsed = JSON.parse(raw) as Partial<Ledger>;
    return {
      ...emptyLedger(),
      ...parsed,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      version: 1,
    };
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
