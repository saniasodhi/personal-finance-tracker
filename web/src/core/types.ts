/** One row in the ledger. `amount` > 0 is money spent, `amount` < 0 is money in. */
export interface Transaction {
  id: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
}

export interface Budget {
  id: string;
  name: string;
  limit: number;
  /** ISO dates, inclusive */
  start: string;
  end: string;
  /** Empty means every spending category counts. */
  categories: string[];
}

export interface Ledger {
  version: 1;
  /** Balance before the first transaction. */
  startBalance: number;
  transactions: Transaction[];
  budgets: Budget[];
}

export const emptyLedger = (): Ledger => ({
  version: 1,
  startBalance: 0,
  transactions: [],
  budgets: [],
});
