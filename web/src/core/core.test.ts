import { describe, expect, it } from 'vitest';
import { guessCategory, resolveCategory } from './categorize';
import { parseCsvText, sheetToRows, toCsv } from './files';
import {
  addExpense, addIncome, budgetSpent, currentBalance, dailySpend, importTransactions, summarize, withBalances,
} from './ledger';
import { normalizeRows, parseAmount, parseDate } from './normalize';
import { emptyLedger } from './types';

// Same shape as data/sample_transactions.csv, with balances that add up.
const SAMPLE_CSV = `date,category,description,money_spent,money_left,payment_method
2025-08-01,Food,Starbucks Coffee,200,4800,UPI
2025-08-02,Transport,Uber Ride,150,4650,UPI
2025-08-03,Shopping,Amazon Earphones,1200,3450,UPI
2025-08-04,Housing,PG Rent,1450,2000,UPI
2025-08-05,Food,Dominos Pizza,500,1500,UPI`;

describe('categorize', () => {
  it('matches keywords as whole words only', () => {
    expect(guessCategory('Chips and Business lunch', 100)).toBe('Other');
    expect(guessCategory('Bus ticket', 20)).toBe('Transport');
    expect(guessCategory('Uber Ride', 150)).toBe('Transport');
    expect(guessCategory('PG Rent', 8000)).toBe('Housing');
  });

  it('treats "-" and blanks as "pick for me", keeps real choices', () => {
    expect(resolveCategory('-', 'Swiggy order', 240)).toBe('Food');
    expect(resolveCategory('', 'Swiggy order', 240)).toBe('Food');
    expect(resolveCategory('Treats', 'Swiggy order', 240)).toBe('Treats');
  });

  it('defaults money in to Income', () => {
    expect(guessCategory('Pocket money', -3000)).toBe('Income');
    expect(guessCategory('Transfer from Mum', -500)).toBe('Income');
    expect(guessCategory('Salary', 100)).not.toBe('Income');
  });
});

describe('normalize', () => {
  it('parses Indian amounts and dates', () => {
    expect(parseAmount('₹1,20,000.50')).toBe(120000.5);
    expect(parseAmount('500 Cr')).toBe(-500);
    expect(parseDate('05/08/2025')).toBe('2025-08-05');
    expect(parseDate('2025-08-05')).toBe('2025-08-05');
    expect(parseDate('5 Aug 2025')).toBe('2025-08-05');
    expect(parseDate('31/02/2025')).toBeNull();
  });

  it('reads the CLI sample file and infers the starting balance', () => {
    const r = parseCsvText(SAMPLE_CSV);
    expect(r.transactions).toHaveLength(5);
    expect(r.inferredStartBalance).toBe(5000);
    expect(r.transactions[0]).toMatchObject({ description: 'Starbucks Coffee', category: 'Food', amount: 200 });
  });

  it('handles debit/credit bank layouts, newest-first order and preamble rows', () => {
    const rows = sheetToRows([
      ['Account statement for XXXX1234'],
      [],
      ['Txn Date', 'Narration', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance'],
      ['03/08/2025', 'UPI-SWIGGY', '240', '', '9760'],
      ['01/08/2025', 'SALARY AUG', '', '10000', '10000'],
    ]);
    const r = normalizeRows(rows);
    expect(r.transactions.map((t) => t.date)).toEqual(['2025-08-01', '2025-08-03']);
    expect(r.transactions[0]).toMatchObject({ amount: -10000, category: 'Income' });
    expect(r.transactions[1]).toMatchObject({ amount: 240, category: 'Food' });
    expect(r.inferredStartBalance).toBe(0);
  });
});

describe('ledger', () => {
  it('keeps the balance right whatever order things are added in', () => {
    let l = importTransactions(emptyLedger(), parseCsvText(SAMPLE_CSV).transactions, 5000);
    l = addIncome(l, { date: '2025-08-07', description: 'Pocket money', amount: 3000 });
    l = addExpense(l, { date: '2025-08-06', description: 'Chai', amount: 100, category: '-' });
    expect(currentBalance(l)).toBe(4400);
    const rows = withBalances(l);
    expect(rows.map((r) => r.balance)).toEqual([4800, 4650, 3450, 2000, 1500, 1400, 4400]);
    expect(rows[5].category).toBe('Food');
  });

  it('summarizes income, spending and categories', () => {
    let l = importTransactions(emptyLedger(), parseCsvText(SAMPLE_CSV).transactions, 5000);
    l = addIncome(l, { date: '2025-08-07', description: 'Pocket money', amount: 3000 });
    const s = summarize(l.transactions);
    expect(s).toMatchObject({ income: 3000, expense: 3500, net: -500 });
    expect(s.byCategory[0]).toEqual({ category: 'Housing', expense: 1450, income: 0 });
    expect(dailySpend(l.transactions, '2025-08').slice(0, 5)).toEqual([200, 150, 1200, 1450, 500]);
  });

  it('counts budget spending by date range and category', () => {
    const l = importTransactions(emptyLedger(), parseCsvText(SAMPLE_CSV).transactions, 5000);
    const b = { id: 'b', name: 'Food', limit: 1000, start: '2025-08-01', end: '2025-08-31', categories: ['Food'] };
    expect(budgetSpent(l, b)).toBe(700);
  });

  it('exports in the CLI column format', () => {
    const l = importTransactions(emptyLedger(), parseCsvText(SAMPLE_CSV).transactions, 5000);
    expect(toCsv(l).split(/\r?\n/).join('\n')).toBe(SAMPLE_CSV);
  });
});
