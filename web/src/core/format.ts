const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** ₹1,00,000 style (Indian digit grouping). */
export const rupees = (n: number) => `${n < 0 ? '−' : ''}₹${inr.format(Math.abs(n))}`;

/** Signed amount from the user's point of view: spending shows as −, income as +. */
export const signedRupees = (amount: number) => (amount > 0 ? `−₹${inr.format(amount)}` : `+₹${inr.format(-amount)}`);

export const monthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

export const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
