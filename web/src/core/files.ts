// Reading statement files and exporting the ledger. Everything runs in the browser.

import Papa from 'papaparse';
import { withBalances } from './ledger';
import { normalizeRows, type NormalizeResult, type RawRow } from './normalize';
import type { Ledger } from './types';

export function parseCsvText(text: string): NormalizeResult {
  const { data } = Papa.parse<RawRow>(text.trim(), { header: true, skipEmptyLines: true });
  return normalizeRows(data);
}

/** Turn a 2D sheet (first row = headers) into keyed rows. Finds the header row in bank statements that start with a preamble. */
export function sheetToRows(sheet: unknown[][]): RawRow[] {
  const headerIdx = sheet.findIndex((r) =>
    r.some((c) => /date/i.test(String(c ?? ''))) && r.filter((c) => c != null && c !== '').length >= 2,
  );
  if (headerIdx < 0) return [];
  const headers = sheet[headerIdx].map((h) => String(h ?? '').trim());
  return sheet.slice(headerIdx + 1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

export async function readStatementFile(file: File): Promise<NormalizeResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    const sheet = (await readSheet(file)) as unknown[][];
    return normalizeRows(sheetToRows(sheet));
  }
  if (name.endsWith('.xls')) {
    throw new Error('Old .xls files are not supported yet. Open it in Excel or Google Sheets and save as .xlsx or .csv.');
  }
  const text = await file.text();
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
  return normalizeRows(sheetToRows(parsed.data));
}

/** Export in the same columns the Python CLI uses, so files move freely between the two. */
export function toCsv(ledger: Ledger): string {
  const rows = withBalances(ledger).map((r) => ({
    date: r.date,
    category: r.category,
    description: r.description,
    money_spent: r.amount,
    money_left: r.balance,
    payment_method: r.paymentMethod,
  }));
  return Papa.unparse(rows, {
    columns: ['date', 'category', 'description', 'money_spent', 'money_left', 'payment_method'],
  });
}

export function download(filename: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
