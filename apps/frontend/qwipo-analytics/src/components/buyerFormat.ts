// Formatting, scope text, KPI deltas and CSV export for the DigiDukaan · Buyer
// pages. Kept apart from buyerKit.tsx so that file only exports components.
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

export const rangeText = (s: BuyerScope) => `${dmy(s.from)} to ${dmy(s.to)}`;
export const geoText = (s: BuyerScope) =>
  [s.state === 'All' ? 'All states' : s.state, s.city !== 'All' && s.city, s.sellerType !== 'All' && `${s.sellerType}s`, s.distributor !== 'All' && s.distributor, s.team !== 'All' && `Team ${s.team}`]
    .filter(Boolean).join(' · ');

/** KPI card change vs the previous period: `↑ 8.1%` for amounts, `↑ 2.4 pts` for rates. */
export function kpiDelta(cur: number, prev: number | null | undefined, mode: 'pct' | 'pts' = 'pct'): { change: string; trend: 'up' | 'down' | 'flat' } {
  if (prev == null || (mode === 'pct' && !prev)) return { change: '—', trend: 'flat' };
  const d = mode === 'pct' ? ((cur - prev) / prev) * 100 : cur - prev;
  if (Math.abs(d) < 0.05) return { change: '→ 0', trend: 'flat' };
  return { change: `${d > 0 ? '↑' : '↓'} ${Math.abs(d).toFixed(1)}${mode === 'pct' ? '%' : ' pts'}`, trend: d > 0 ? 'up' : 'down' };
}

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
