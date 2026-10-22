import { useEffect, useMemo, useState } from 'react';
import { REPO_URL } from '../config';
import { download, toCsv } from '../core/files';
import { monthLabel, rupees, shiftMonth, shortDate, signedRupees, todayIso } from '../core/format';
import {
  addExpense, addIncome, allCategories, budgetSpent, currentBalance, dailyBalance, dailySpend, deleteBudget,
  deleteTransaction, importTransactions, inMonth, months as monthsOf, summarize, updateTransaction, upsertBudget,
  withBalances,
} from '../core/ledger';
import { sampleLedger } from '../core/sample';
import { clearLedger, loadLedger, saveLedger } from '../core/storage';
import { emptyLedger, type Budget, type Ledger } from '../core/types';
import { BalanceChart, CategoryBars, SpendCalendar, catColor } from './charts';
import { AddDialog, BudgetDialog, ImportDialog, SettingsDialog, type EntryInput } from './dialogs';
import { ChevronLeft, ChevronRight, Pencil, Plus, Settings, Trash, Upload } from './icons';

type DialogName = 'add' | 'import' | 'budget' | 'settings' | null;

const SAMPLE_HREF = '../sample_transactions.csv';

function useLedger() {
  const [ledger, setLedger] = useState<Ledger>(() => {
    const wantsSample = new URLSearchParams(location.search).has('sample');
    const saved = loadLedger();
    return wantsSample && saved.transactions.length === 0 ? sampleLedger() : saved;
  });
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => { setSaveFailed(!saveLedger(ledger)); }, [ledger]);
  useEffect(() => {
    if (location.search) history.replaceState(null, '', location.pathname);
  }, []);
  return [ledger, setLedger, saveFailed] as const;
}

export default function App() {
  const [ledger, setLedger, saveFailed] = useLedger();
  const [dialog, setDialog] = useState<DialogName>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const today = todayIso();
  const dataMonths = monthsOf(ledger);
  const [month, setMonth] = useState(() => dataMonths[0] ?? today.slice(0, 7));
  const monthOptions = useMemo(
    () => [...new Set([today.slice(0, 7), ...dataMonths, month])].sort().reverse(),
    [dataMonths.join(), month, today],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const categories = allCategories(ledger);
  const monthRows = inMonth(ledger.transactions, month);
  const summary = summarize(monthRows);
  const balance = currentBalance(ledger);
  const daysInMonth = dailySpend([], month).length;
  const upTo = month < today.slice(0, 7) ? daysInMonth : month === today.slice(0, 7) ? Number(today.slice(8)) : 1;

  const table = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withBalances(ledger)
      .filter((r) => r.date.startsWith(month))
      .filter((r) => !catFilter || r.category === catFilter)
      .filter((r) => !q || r.description.toLowerCase().includes(q))
      .reverse();
  }, [ledger, month, query, catFilter]);

  function saveEntry(e: EntryInput) {
    const entry = { date: e.date, description: e.description, amount: e.amount, category: e.category, paymentMethod: e.paymentMethod };
    setLedger((l) => (e.kind === 'expense' ? addExpense(l, entry) : addIncome(l, entry)));
    setMonth(e.date.slice(0, 7));
    setToast(`Saved ${e.kind === 'expense' ? '−' : '+'}${rupees(e.amount)} · ${e.description}`);
  }

  const hasData = ledger.transactions.length > 0;

  return (
    <div className="app">
      <header className="app-nav">
        <div className="wrap app-nav-inner">
          <a className="brand" href="../" aria-label="Kharcha home">
            <span className="brand-hi" aria-hidden="true">खर्चा</span>
            <span className="brand-en">kharcha</span>
          </a>
          {hasData && (
            <div className="month-switch">
              <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft /></button>
              <label className="sr-only" htmlFor="month">Month</label>
              <select id="month" value={month} onChange={(e) => setMonth(e.target.value)}>
                {monthOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
              <button type="button" className="icon-btn" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight /></button>
            </div>
          )}
          <div className="nav-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setDialog('import')}><Upload /><span className="label-text">Import</span></button>
            <button type="button" className="btn btn-primary" onClick={() => setDialog('add')}><Plus /><span className="label-text">Add</span></button>
            <button type="button" className="icon-btn" aria-label="Settings" onClick={() => setDialog('settings')}><Settings /></button>
          </div>
        </div>
      </header>

      <main className="wrap app-main">
        {saveFailed && (
          <p className="error" role="alert">This browser isn’t letting Kharcha save (private mode or storage full). Export a CSV before you close the tab.</p>
        )}

        {!hasData ? (
          <Onboarding
            startBalance={ledger.startBalance}
            onStart={(n) => { setLedger((l) => ({ ...l, startBalance: n })); setDialog('add'); }}
            onImport={() => setDialog('import')}
            onSample={() => { const s = sampleLedger(); setLedger(s); setMonth(today.slice(0, 7)); }}
          />
        ) : (
          <>
            <section className="kpis" aria-label="This month">
              <div className="kpi kpi-accent"><div className="kpi-label">Balance now</div><div className="kpi-value">{rupees(balance)}</div></div>
              <div className="kpi"><div className="kpi-label">Spent in {monthLabel(month)}</div><div className="kpi-value">{rupees(summary.expense)}</div></div>
              <div className="kpi"><div className="kpi-label">Came in</div><div className="kpi-value in">{rupees(summary.income)}</div></div>
              <div className="kpi"><div className="kpi-label">Net this month</div><div className="kpi-value" style={{ color: summary.net < 0 ? 'var(--danger)' : 'var(--income)' }}>{summary.net >= 0 ? '+' : ''}{rupees(summary.net)}</div></div>
            </section>

            <div className="grid-2">
              <section className="panel" aria-labelledby="h-balance">
                <div className="panel-head"><h2 id="h-balance">Balance</h2><span className="panel-note">End of each day</span></div>
                <BalanceChart values={dailyBalance(ledger, month)} upTo={upTo} />
              </section>
              <section className="panel" aria-labelledby="h-cats">
                <div className="panel-head"><h2 id="h-cats">Where it went</h2><span className="panel-note mono">{rupees(summary.expense)}</span></div>
                <CategoryBars summary={summary} />
              </section>
            </div>

            <div className="grid-2">
              <section className="panel" aria-labelledby="h-cal">
                <div className="panel-head"><h2 id="h-cal">Kharcha calendar</h2><span className="panel-note">Spending per day</span></div>
                <SpendCalendar month={month} daily={dailySpend(ledger.transactions, month)} />
              </section>
              <section className="panel" aria-labelledby="h-bud">
                <div className="panel-head">
                  <h2 id="h-bud">Budgets</h2>
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditingBudget(null); setDialog('budget'); }}><Plus />New</button>
                </div>
                {ledger.budgets.length === 0 ? (
                  <p className="empty-note">Set a budget for the month, a trip or Diwali. Kharcha tracks it as you spend.</p>
                ) : (
                  <ul className="budgets">
                    {ledger.budgets.map((b) => {
                      const spent = budgetSpent(ledger, b);
                      const pct = Math.min(100, (spent / b.limit) * 100);
                      const over = spent > b.limit;
                      return (
                        <li key={b.id}>
                          <div className="budget-top">
                            <span className="budget-name">{b.name}</span>
                            <span className="budget-actions">
                              <button type="button" className="icon-btn" aria-label={`Edit ${b.name}`} onClick={() => { setEditingBudget(b); setDialog('budget'); }}><Pencil /></button>
                              <button type="button" className="icon-btn" aria-label={`Delete ${b.name}`} onClick={() => setLedger((l) => deleteBudget(l, b.id))}><Trash /></button>
                            </span>
                          </div>
                          <div className={`bar${over ? ' over' : ''}`} role="progressbar" aria-label={b.name} aria-valuemin={0} aria-valuemax={b.limit} aria-valuenow={spent}>
                            <span style={{ width: `${pct}%` }} />
                          </div>
                          <div className="budget-top" style={{ marginTop: 6 }}>
                            <span className="budget-meta">{shortDate(b.start)} – {shortDate(b.end)} · {b.categories.length ? b.categories.join(', ') : 'All spending'}</span>
                            <span className="mono" style={{ fontSize: 14, color: over ? 'var(--danger)' : undefined }}>{rupees(spent)} / {rupees(b.limit)}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

            <section className="panel" aria-labelledby="h-tx">
              <div className="panel-head">
                <h2 id="h-tx">Transactions</h2>
                <div className="tx-tools">
                  <label className="sr-only" htmlFor="q">Search</label>
                  <input id="q" className="input" type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
                  <label className="sr-only" htmlFor="cf">Category</label>
                  <select id="cf" className="select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                    <option value="">All categories</option>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {table.length === 0 ? (
                <p className="empty-note">No transactions in {monthLabel(month)}{query || catFilter ? ' match those filters' : ''}.</p>
              ) : (
                <div className="table-box">
                  <table>
                    <thead>
                      <tr><th>Date</th><th>Description</th><th>Category</th><th className="num">Amount</th><th className="num">Balance</th><th><span className="sr-only">Actions</span></th></tr>
                    </thead>
                    <tbody>
                      {table.map((r) => (
                        <tr key={r.id}>
                          <td className="date">{shortDate(r.date)}</td>
                          <td>{r.description} <span className="method">· {r.paymentMethod}</span></td>
                          <td>
                            <label className="sr-only" htmlFor={`c-${r.id}`}>Category for {r.description}</label>
                            <select id={`c-${r.id}`} className="cat-select" value={r.category} style={{ color: catColor(r.category) }}
                              onChange={(e) => setLedger((l) => updateTransaction(l, r.id, { category: e.target.value }))}>
                              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td className={`num${r.amount < 0 ? ' in' : ''}`}>{signedRupees(r.amount)}</td>
                          <td className="num" style={{ color: r.balance < 0 ? 'var(--danger)' : 'var(--muted)' }}>{rupees(r.balance)}</td>
                          <td style={{ width: 44 }}>
                            <button type="button" className="icon-btn" aria-label={`Delete ${r.description}`}
                              onClick={() => { setLedger((l) => deleteTransaction(l, r.id)); setToast(`Deleted ${r.description}`); }}><Trash /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="app-foot">
        <div className="wrap">
          <span>Your data is saved in this browser only.</span>
          <span><a href={REPO_URL}>Open source on GitHub</a></span>
        </div>
      </footer>

      <AddDialog open={dialog === 'add'} onClose={() => setDialog(null)} categories={categories} onSave={saveEntry} />
      <ImportDialog open={dialog === 'import'} onClose={() => setDialog(null)} sampleHref={SAMPLE_HREF}
        onImport={(r) => {
          setLedger((l) => importTransactions(l, r.transactions, r.inferredStartBalance));
          setMonth(r.transactions[r.transactions.length - 1].date.slice(0, 7));
          setDialog(null);
          setToast(`Imported ${r.transactions.length} transactions`);
        }} />
      <BudgetDialog open={dialog === 'budget'} onClose={() => setDialog(null)} budget={editingBudget} categories={categories} month={month}
        onSave={(b) => { setLedger((l) => upsertBudget(l, b)); setDialog(null); }} />
      <SettingsDialog open={dialog === 'settings'} onClose={() => setDialog(null)} hasData={hasData}
        startBalance={ledger.startBalance}
        onStartBalance={(n) => { setLedger((l) => ({ ...l, startBalance: n })); setToast('Starting balance updated'); }}
        onExport={() => download(`kharcha-${today}.csv`, toCsv(ledger))}
        onSample={() => { setLedger(sampleLedger()); setMonth(today.slice(0, 7)); setDialog(null); setToast('Sample data loaded'); }}
        onReset={() => { clearLedger(); setLedger(emptyLedger()); setDialog(null); setToast('All data deleted'); }} />

      <div aria-live="polite" className={toast ? 'toast-msg' : 'sr-only'}>{toast}</div>
    </div>
  );
}

function Onboarding({ startBalance, onStart, onImport, onSample }: {
  startBalance: number; onStart: (n: number) => void; onImport: () => void; onSample: () => void;
}) {
  return (
    <section className="onboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>
        <h1>Let’s find out where your <span>₹</span> goes.</h1>
        <p className="onboard-lead">Kharcha runs entirely in your browser. Nothing you add here is sent anywhere, and there’s no account to create.</p>
      </div>
      <div className="onboard-steps">
        <div className="ob-card">
          <h2>Import a statement</h2>
          <p>A CSV or .xlsx export from your bank or UPI app. Categories and balance are filled in for you.</p>
          <div className="row"><button type="button" className="btn btn-primary" onClick={onImport}><Upload />Import file</button></div>
        </div>
        <form className="ob-card" onSubmit={(e) => { e.preventDefault(); onStart(Number(new FormData(e.currentTarget).get('start')) || 0); }}>
          <h2>Or start fresh</h2>
          <p>How much money do you have right now? Then add spends as they happen.</p>
          <div className="row">
            <label className="sr-only" htmlFor="ob-start">Current balance in rupees</label>
            <input id="ob-start" name="start" className="input mono" type="number" step="0.01" placeholder="₹ current balance" defaultValue={startBalance || ''} style={{ flex: '1 1 160px' }} />
            <button type="submit" className="btn btn-ghost">Start</button>
          </div>
        </form>
        <div className="ob-card">
          <h2>Just looking?</h2>
          <p>Load two months of sample data to explore. You can delete it from Settings.</p>
          <div className="row"><button type="button" className="btn btn-ghost" onClick={onSample}>Try sample data</button></div>
        </div>
      </div>
    </section>
  );
}
