import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { readStatementFile } from '../core/files';
import { rupees, todayIso } from '../core/format';
import type { NormalizeResult } from '../core/normalize';
import type { Budget } from '../core/types';
import { Close, Upload } from './icons';

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={titleId}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <div className="dlg">
          <div className="dlg-head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Close /></button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

// ---------- Add expense / income ----------

export interface EntryInput {
  kind: 'expense' | 'income';
  date: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
}

export function AddDialog({ open, onClose, categories, onSave }: {
  open: boolean; onClose: () => void; categories: string[]; onSave: (e: EntryInput) => void;
}) {
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [error, setError] = useState('');

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amount = Number(f.get('amount'));
    if (!(amount > 0)) { setError('Enter an amount greater than 0.'); return; }
    onSave({
      kind,
      date: String(f.get('date')),
      description: String(f.get('description')),
      amount,
      category: String(f.get('category')),
      paymentMethod: String(f.get('method')),
    });
    setError('');
    e.currentTarget.reset();
  }

  return (
    <Modal open={open} onClose={onClose} title={kind === 'expense' ? 'Add an expense' : 'Add money in'}>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <div className="seg" role="group" aria-label="Type">
          <button type="button" aria-pressed={kind === 'expense'} onClick={() => setKind('expense')}>Expense</button>
          <button type="button" aria-pressed={kind === 'income'} onClick={() => setKind('income')}>Income</button>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="add-amount">Amount (₹)</label>
            <input id="add-amount" name="amount" className="input mono" type="number" inputMode="decimal" min="0.01" step="0.01" required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="add-date">Date</label>
            <input id="add-date" name="date" className="input" type="date" defaultValue={todayIso()} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="add-desc">Description</label>
          <input id="add-desc" name="description" className="input" placeholder={kind === 'expense' ? 'e.g. Swiggy order' : 'e.g. Pocket money'} required />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="add-cat">Category</label>
            <select id="add-cat" name="category" className="select" defaultValue="">
              <option value="">Auto (from description)</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="add-method">Paid with</label>
            <select id="add-method" name="method" className="select" defaultValue="UPI">
              <option>UPI</option><option>Cash</option><option>Card</option><option>Bank transfer</option>
            </select>
          </div>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="dlg-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Done</button>
          <button type="submit" className="btn btn-primary">Save {kind}</button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Import ----------

export function ImportDialog({ open, onClose, onImport, sampleHref }: {
  open: boolean; onClose: () => void; onImport: (r: NormalizeResult) => void; sampleHref: string;
}) {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<(NormalizeResult & { name: string }) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!open) { setResult(null); setError(''); } }, [open]);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const r = await readStatementFile(file);
      if (!r.transactions.length) setError('No transactions found. The file needs at least a date column and an amount (or debit/credit) column.');
      else setResult({ ...r, name: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Import a statement">
      <label
        className={`dropzone${drag ? ' drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void handle(e.dataTransfer.files[0]); }}
      >
        <Upload />
        <strong>{busy ? 'Reading…' : 'Drop a CSV or .xlsx file here'}</strong>
        <span>or click to choose one. It is read on your device and never uploaded.</span>
        <input ref={inputRef} type="file" accept=".csv,.xlsx,text/csv" className="sr-only"
          onChange={(e) => void handle(e.target.files?.[0])} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {result && (
        <div className="ob-card" style={{ padding: 16 }}>
          <strong>{result.name}</strong>
          <p>
            {result.transactions.length} transactions found
            {result.skipped ? `, ${result.skipped} rows skipped (no date or amount)` : ''}.
            {result.inferredStartBalance != null && ` Starting balance: ${rupees(result.inferredStartBalance)}.`}
          </p>
        </div>
      )}
      <p className="panel-note" style={{ margin: 0 }}>
        Works with bank and UPI app exports: date, description and amount, or separate debit/credit columns.{' '}
        <a href={sampleHref} download>Download an example file</a>.
      </p>
      <div className="dlg-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" disabled={!result} onClick={() => result && onImport(result)}>
          Import {result ? result.transactions.length : ''} transactions
        </button>
      </div>
    </Modal>
  );
}

// ---------- Budget ----------

export function BudgetDialog({ open, onClose, budget, categories, month, onSave }: {
  open: boolean; onClose: () => void; budget: Budget | null; categories: string[]; month: string;
  onSave: (b: Omit<Budget, 'id'> & { id?: string }) => void;
}) {
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const spendCats = categories.filter((c) => c !== 'Income');

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    onSave({
      id: budget?.id,
      name: String(f.get('name')).trim() || 'Budget',
      limit: Number(f.get('limit')),
      start: String(f.get('start')),
      end: String(f.get('end')),
      categories: f.getAll('cats').map(String),
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={budget ? 'Edit budget' : 'New budget'}>
      <form onSubmit={submit} style={{ display: 'contents' }} key={budget?.id ?? 'new'}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="b-name">Name</label>
            <input id="b-name" name="name" className="input" defaultValue={budget?.name ?? ''} placeholder="e.g. Diwali" required />
          </div>
          <div className="field">
            <label htmlFor="b-limit">Limit (₹)</label>
            <input id="b-limit" name="limit" className="input mono" type="number" min="1" step="1" defaultValue={budget?.limit ?? ''} required />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="b-start">From</label>
            <input id="b-start" name="start" className="input" type="date" defaultValue={budget?.start ?? `${month}-01`} required />
          </div>
          <div className="field">
            <label htmlFor="b-end">To</label>
            <input id="b-end" name="end" className="input" type="date" defaultValue={budget?.end ?? `${month}-${lastDay}`} required />
          </div>
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 8 }}>Counts spending in (none ticked = everything)</legend>
          <div className="checks">
            {spendCats.map((c) => (
              <label className="check" key={c}>
                <input type="checkbox" name="cats" value={c} defaultChecked={budget?.categories.includes(c)} />{c}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="dlg-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save budget</button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Settings ----------

export function SettingsDialog({ open, onClose, startBalance, onStartBalance, onExport, onSample, onReset, hasData }: {
  open: boolean; onClose: () => void; startBalance: number; onStartBalance: (n: number) => void;
  onExport: () => void; onSample: () => void; onReset: () => void; hasData: boolean;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => { if (!open) setConfirmReset(false); }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <form className="field" onSubmit={(e) => {
        e.preventDefault();
        onStartBalance(Number(new FormData(e.currentTarget).get('start')) || 0);
      }}>
        <label htmlFor="s-start">Starting balance (before your first transaction)</label>
        <div className="row">
          <input id="s-start" name="start" className="input mono" type="number" step="0.01" defaultValue={startBalance} style={{ flex: 1 }} key={startBalance} />
          <button type="submit" className="btn btn-ghost">Update</button>
        </div>
      </form>
      <div className="ob-card" style={{ padding: 16 }}>
        <p>Your data is stored only in this browser. Export a CSV to back it up or move it to another device. The file also works with the Kharcha command-line tool.</p>
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onExport} disabled={!hasData}>Export CSV</button>
          <button type="button" className="btn btn-ghost" onClick={onSample}>Load sample data</button>
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        {confirmReset ? (
          <>
            <span className="error">Delete every transaction and budget? This can’t be undone.</span>
            <span className="row">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Keep</button>
              <button type="button" className="btn btn-ghost danger-btn" onClick={onReset}>Delete all</button>
            </span>
          </>
        ) : (
          <button type="button" className="btn btn-ghost danger-btn" onClick={() => setConfirmReset(true)} disabled={!hasData}>Delete all data</button>
        )}
      </div>
    </Modal>
  );
}
