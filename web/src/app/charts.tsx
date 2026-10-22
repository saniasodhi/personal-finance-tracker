import { rupees } from '../core/format';
import type { Summary } from '../core/ledger';

const CAT_VARS: Record<string, string> = {
  Food: 'var(--cat-food)',
  Transport: 'var(--cat-transport)',
  Shopping: 'var(--cat-shopping)',
  Housing: 'var(--cat-housing)',
  Health: 'var(--cat-health)',
  Pleasure: 'var(--cat-pleasure)',
  Income: 'var(--cat-income)',
};
export const catColor = (c: string) => CAT_VARS[c] ?? 'var(--cat-other)';

/** Balance at the end of each day. `upTo` limits the line to days that have happened. */
export function BalanceChart({ values, upTo }: { values: number[]; upTo: number }) {
  const pts = values.slice(0, Math.max(1, upTo));
  const W = 600, H = 220, padL = 4, padR = 4, padT = 16, padB = 28;
  const min = Math.min(0, ...pts);
  const max = Math.max(...pts, 1);
  const x = (i: number) => padL + (i / Math.max(1, values.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts.length - 1).toFixed(1)} ${H - padB} L${x(0).toFixed(1)} ${H - padB} Z`;
  const last = pts[pts.length - 1];
  const label = `Balance went from ${rupees(pts[0])} to ${rupees(last)} this month.`;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <defs>
        <linearGradient id="balFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffb627" stopOpacity=".28" />
          <stop offset="1" stopColor="#ffb627" stopOpacity="0" />
        </linearGradient>
      </defs>
      {min < 0 && <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="rgba(255,122,122,.5)" strokeDasharray="4 4" />}
      <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="rgba(255,236,224,.12)" />
      <path d={area} fill="url(#balFill)" />
      <path d={line} fill="none" stroke="#ffb627" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(pts.length - 1)} cy={y(last)} r="4.5" fill="#ffb627" />
      <text className="chart-axis" x={padL} y={H - 8}>1</text>
      <text className="chart-axis" x={W - padR} y={H - 8} textAnchor="end">{values.length}</text>
    </svg>
  );
}

export function CategoryBars({ summary }: { summary: Summary }) {
  const rows = summary.byCategory.filter((c) => c.expense > 0);
  if (!rows.length) return <p className="empty-note">No spending this month yet.</p>;
  const max = rows[0].expense;
  return (
    <ul className="cats">
      {rows.map((c) => (
        <li className="cat-row" key={c.category}>
          <span className="cat-name"><i style={{ background: catColor(c.category) }} />{c.category}</span>
          <span className="cat-track" aria-hidden="true">
            <span style={{ width: `${Math.max(2, (c.expense / max) * 100)}%`, background: catColor(c.category) }} />
          </span>
          <span className="cat-amt">
            {rupees(c.expense)}
            <small>{Math.round((c.expense / summary.expense) * 100)}%</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

const LEVELS = ['#2a1420', '#5a2a1c', '#9a5a14', '#e08a17', '#ffb627'];
const LEVEL_INK = ['var(--muted-2)', '#f3d9c6', '#fff3e0', '#2a0816', '#2a0816'];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Heatmap of spend per day, weeks starting Monday. */
export function SpendCalendar({ month, daily }: { month: string; daily: number[] }) {
  const [y, m] = month.split('-').map(Number);
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  // Rank-based levels, so one big rent day doesn't wash every other day out.
  const spent = daily.filter((v) => v > 0).sort((a, b) => a - b);
  const level = (v: number) => {
    if (v <= 0) return 0;
    const below = spent.filter((s) => s < v).length;
    return 1 + Math.min(3, Math.floor((below / spent.length) * 4));
  };
  const monthShort = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });

  return (
    <>
      <div className="cal">
        {DOW.map((d, i) => <div className="cal-dow" key={i} aria-hidden="true">{d}</div>)}
        {Array.from({ length: offset }, (_, i) => <div key={`pad${i}`} />)}
        {daily.map((v, i) => {
          const l = level(v);
          const text = `${i + 1} ${monthShort}: ${v ? rupees(v) : 'no spending'}`;
          return (
            <div className="cal-day" key={i} title={text} aria-label={text} role="img"
              style={{ background: LEVELS[l], color: LEVEL_INK[l] }}>
              {i + 1}
            </div>
          );
        })}
      </div>
      <div className="cal-legend" aria-hidden="true">
        Less {LEVELS.map((c) => <span key={c} style={{ background: c }} />)} More
      </div>
    </>
  );
}
