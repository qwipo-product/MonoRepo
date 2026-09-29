// Formatting, scope text and CSV export for the DigiDukaan · Buyer pages.
// Kept apart from buyerKit.tsx so that file only exports components.
import type { ChipData } from './filters';
import { TODAY, type BuyerScope } from '../data/buyer';

/* -------------------------------- formatting ------------------------------- */

const pad = (n: number) => String(n).padStart(2, '0');
export const dmy = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
export const dmyTime = (d: Date) => `${dmy(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;
export const lakh = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : inr(v));
export const num = (n: number) => n.toLocaleString('en-IN');
export const pctOf = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');
export const daysAgo = (d: Date) => Math.floor((TODAY.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
export const ago = (d?: Date) => {
  if (!d) return '—';
  const n = daysAgo(d);
  return n === 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`;
};

export function sortBy<T, K extends keyof T>(rows: T[], k: K, dir: 1 | -1) {
  return [...rows].sort((a, b) => {
    const av = a[k] ?? 0, bv = b[k] ?? 0;
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
  });
}

export const rangeText = (s: BuyerScope) => `${dmy(s.from)} to ${dmy(s.to)}`;
export const geoText = (s: BuyerScope) =>
  [s.state === 'All' ? 'All states' : s.state, s.city !== 'All' && s.city, s.distributor !== 'All' && s.distributor].filter(Boolean).join(' · ');

/** What an export records in Reports history. */
export function buyerChips(s: BuyerScope, extra: ChipData[] = []): ChipData[] {
  return [
    { label: 'Date', value: rangeText(s) },
    ...(s.state !== 'All' ? [{ label: 'State', value: s.state }] : []),
    ...(s.city !== 'All' ? [{ label: 'City', value: s.city }] : []),
    ...(s.distributor !== 'All' ? [{ label: 'Distributor', value: s.distributor }] : []),
    ...extra,
  ];
}

/** File-name safe suffix for an export. */
export const fileTag = (s: BuyerScope) =>
  [dmy(s.from), 'to', dmy(s.to), s.state !== 'All' && s.state, s.city !== 'All' && s.city].filter(Boolean).join('_').replace(/ /g, '-');

/* ---------------------------------- export --------------------------------- */

export function downloadCsv(file: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const str = String(v);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = file; a.click();
  URL.revokeObjectURL(url);
}

