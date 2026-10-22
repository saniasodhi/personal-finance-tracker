// Keyword rules for auto-categorizing transactions, ported from categorize.py.
// Keywords match whole words only, so "ps" no longer matches "chips" and
// "bus" no longer matches "business".

export const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Housing',
  'Health',
  'Pleasure',
  'Income',
  'Other',
] as const;

export type CategoryName = (typeof CATEGORIES)[number];

const RULES: [CategoryName, string[]][] = [
  ['Income', ['salary', 'stipend', 'pocket money', 'refund', 'cashback', 'interest credit', 'freelance']],
  ['Food', ['starbucks', 'cafe', 'café', 'restaurant', 'swiggy', 'zomato', 'pizza', 'dominos', "domino's", 'maggi', 'maggie', 'coffee', 'burger', 'chai', 'tea', 'canteen', 'mess', 'bakery', 'blinkit', 'zepto', 'bigbasket', 'grocery', 'groceries', 'kfc', 'mcdonalds', "mcdonald's"]],
  ['Transport', ['uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'irctc', 'cab', 'taxi', 'auto', 'fuel', 'petrol', 'diesel', 'fastag', 'parking']],
  ['Shopping', ['amazon', 'flipkart', 'myntra', 'nykaa', 'ajio', 'meesho', 'zara', 'h&m', 'mall', 'store', 'earphones', 'clothes', 'shoes', 'decathlon']],
  ['Housing', ['rent', 'pg', 'hostel', 'maintenance', 'electricity', 'water bill', 'gas bill', 'wifi', 'wi-fi', 'broadband', 'recharge', 'mobile bill']],
  ['Health', ['pharmacy', 'chemist', 'doctor', 'hospital', 'clinic', 'medicine', 'medicines', 'gym', 'apollo', 'pharmeasy', '1mg']],
  ['Pleasure', ['movie', 'movies', 'cinema', 'netflix', 'spotify', 'prime video', 'hotstar', 'gaming', 'playstation', 'steam', 'bookmyshow', 'concert']],
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Unicode-aware "word boundary": keyword must not touch other letters or digits.
const COMPILED: [CategoryName, RegExp][] = RULES.map(([cat, words]) => [
  cat,
  new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'iu'),
]);

/** Values that mean "please pick a category for me". */
export const isAutoCategory = (category: string | null | undefined) => {
  const c = (category ?? '').trim().toLowerCase();
  return c === '' || c === '-' || c === 'auto' || c === 'nan' || c === 'none';
};

/** Guess a category from the description. Money in defaults to Income. */
export function guessCategory(description: string, amount: number): CategoryName {
  for (const [cat, re] of COMPILED) {
    if (cat === 'Income' && amount > 0) continue;
    if (re.test(description)) return cat;
  }
  return amount < 0 ? 'Income' : 'Other';
}

/** Keep a category the user chose; otherwise guess one. */
export function resolveCategory(category: string | null | undefined, description: string, amount: number): string {
  return isAutoCategory(category) ? guessCategory(description, amount) : String(category).trim();
}
