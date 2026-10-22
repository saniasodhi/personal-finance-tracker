// Demo data so first-time visitors can see a full dashboard before importing anything.

import { resolveCategory } from './categorize';
import { newId } from './normalize';
import type { Ledger, Transaction } from './types';

// [day of month, description, amount (+ spent, − income)]
const LAST_MONTH: [number, string, number][] = [
  [1, 'Pocket money', -12000], [1, 'PG Rent', 6500], [2, 'Swiggy order', 240], [3, 'Metro recharge', 300],
  [4, 'Chai point', 40], [5, 'Amazon earphones', 1199], [7, 'Zomato dinner', 420], [8, 'Uber ride', 186],
  [10, 'Netflix', 199], [11, 'Blinkit groceries', 640], [13, 'Gym membership', 900], [15, 'Movie tickets BookMyShow', 560],
  [17, 'Rapido bike', 65], [18, 'Starbucks coffee', 330], [20, 'Myntra t-shirt', 799], [22, 'Wi-Fi bill', 499],
  [24, 'Dominos pizza', 549], [26, 'Pharmacy', 210], [28, 'Ola cab', 240], [29, 'Canteen lunch', 90],
];

const THIS_MONTH: [number, string, number][] = [
  [1, 'Pocket money', -12000], [1, 'PG Rent', 6500], [2, 'Chai point', 40], [2, 'Metro recharge', 300],
  [3, 'Swiggy order', 310], [4, 'Spotify', 119], [5, 'Uber ride', 152], [6, 'Blinkit groceries', 520],
  [7, 'Diwali gifts Amazon', 1800], [8, 'Zomato dinner', 380], [9, 'Freelance design gig', -2500], [10, 'Sweets from bakery', 650],
  [11, 'Diyas and decor store', 450], [12, 'Rapido bike', 70], [13, 'Starbucks coffee', 290], [14, 'Train ticket IRCTC home', 1240],
  [15, 'Chemist medicines', 180], [16, 'Canteen lunch', 85], [18, 'Movie tickets BookMyShow', 480], [19, 'Ajio kurta', 1299],
  [20, 'Swiggy order', 260], [21, 'Cashback', -150],
];

const ymd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function build(year: number, month: number, rows: [number, string, number][], maxDay: number): Transaction[] {
  return rows
    .filter(([d]) => d <= maxDay)
    .map(([d, description, amount]) => ({
      id: newId(),
      date: ymd(year, month, d),
      description,
      amount,
      category: resolveCategory(null, description, amount),
      paymentMethod: 'UPI',
    }));
}

export function sampleLedger(today = new Date()): Ledger {
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const prev = new Date(y, m - 2, 1);
  const py = prev.getFullYear();
  const pm = prev.getMonth() + 1;
  const prevDays = new Date(py, pm, 0).getDate();
  const thisMonthEnd = new Date(y, m, 0).getDate();

  return {
    version: 1,
    startBalance: 6200,
    transactions: [
      ...build(py, pm, LAST_MONTH, prevDays),
      ...build(y, m, THIS_MONTH, today.getDate()),
    ],
    budgets: [
      {
        id: newId(),
        name: 'Festive budget',
        limit: 8000,
        start: ymd(y, m, 1),
        end: ymd(y, m, thisMonthEnd),
        categories: ['Shopping', 'Food'],
      },
      {
        id: newId(),
        name: 'Eating out',
        limit: 3000,
        start: ymd(y, m, 1),
        end: ymd(y, m, thisMonthEnd),
        categories: ['Food'],
      },
    ],
  };
}
