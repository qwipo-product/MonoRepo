// Drill-through drawer: the record rows behind a KPI (Metabase "see these
// records" / Power BI drillthrough). Shows a scoped page of orders; the full
// register and the export stay with Reports.
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Badge, Button, Input, cn, type BadgeProps } from '@mockups/ui';
import { orderRows, stageLabel, type OrderRow, type Stage } from '../data/orderRows';
import type { Page } from '../nav';

/** Infinite scroll, mocked: each "page" replays the sample rows a week earlier
 *  with fresh ids (real build: keyset pagination against ClickHouse). */
const MAX_PAGES = 5;
const shiftDate = (d: string, weeks: number) => {
  const day = parseInt(d) - weeks * 7;
  return day > 0 ? `${day} Aug` : `${day + 31} Jul`;
};
function pageRows(page: number): OrderRow[] {
  if (page === 0) return orderRows;
  return orderRows.map((r, i) => ({
    ...r,
    id: `${r.id.slice(0, -2)}${page}${(i % 36).toString(36).toUpperCase()}`,
    date: shiftDate(r.date, page),
    delivered: r.delivered && shiftDate(r.delivered, page),
  }));
}

/** "21 Aug" → "22 Aug" = "1d" (mock dates are day-month strings in one month). */
function daysBetween(from: string, to?: string) {
  if (!to) return '';
  const d = parseInt(to) - parseInt(from);
  return d > 0 ? `· ${d}d` : '· same day';
}

const stageBadge: Record<Stage, NonNullable<BadgeProps['variant']>> = {
  created: 'neutral', accepted: 'info', packed: 'info', shipped: 'info',
  delivered: 'success', cancelled: 'danger', returned: 'warning',
};

export function RecordsDrawer({
  title, total, statuses, date, distributors, sortByValue, onClose, go,
}: {
  title: string;
  /** the KPI's real total, e.g. "1,142 orders · ₹38.6L" */
  total: string;
  /** limit to these stages (e.g. the four open stages) */
  statuses?: Stage[];
  date?: string;
  distributors?: string[];
  sortByValue?: boolean;
  onClose: () => void;
  go: (p: Page) => void;
}) {
  const [q, setQ] = useState('');
  const [pages, setPages] = useState(1);
  const capped = pages >= MAX_PAGES;
  let rows = Array.from({ length: pages }, (_, p) => pageRows(p)).flat();
  if (statuses?.length) rows = rows.filter((r) => statuses.includes(r.status));
  if (date) rows = rows.filter((r) => r.date === date);
  if (distributors?.length) rows = rows.filter((r) => distributors.includes(r.distributor));
  if (sortByValue) rows = [...rows].sort((a, b) => b.value - a.value);
  if (q) rows = rows.filter((r) => `${r.id} ${r.outlet} ${r.distributor}`.toLowerCase().includes(q.toLowerCase()));

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!capped && !q && el.scrollTop + el.clientHeight > el.scrollHeight - 160) setPages(pages + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[620px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">{title}</span>
            <span className="type-caption block text-foreground-secondary">{total} · current scope and period</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="border-b border-border-subtle px-5 py-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, outlet or distributor" className="h-9 pl-8" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5" onScroll={onScroll}>
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-card">
              <tr className="type-micro text-left text-foreground-tertiary">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Order</th>
                <th className="py-2 pr-3 font-semibold">Outlet</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 text-right font-semibold">Value</th>
              </tr>
            </thead>
            <tbody className="type-caption">
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border-subtle">
                  <td className="whitespace-nowrap py-2 pr-3 text-foreground-secondary">{r.date}</td>
                  <td className="py-2 pr-3">
                    <span className="block font-medium tabular-nums">{r.id.replace('QW-ONDC-', '')}</span>
                    <span className="block text-foreground-tertiary">{r.distributor}</span>
                  </td>
                  <td className="max-w-[170px] truncate py-2 pr-3">{r.outlet}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={stageBadge[r.status]}>{stageLabel[r.status]}</Badge>
                    {r.delivered && (
                      <span className="mt-0.5 block whitespace-nowrap tabular-nums text-foreground-tertiary">
                        {r.delivered} {daysBetween(r.date, r.delivered)}
                      </span>
                    )}
                  </td>
                  <td className={cn('py-2 text-right tabular-nums', r.status === 'cancelled' && 'text-error-foreground')}>
                    ₹{r.value.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-foreground-secondary">No orders match</td></tr>
              )}
              {capped && !q && (
                <tr>
                  <td colSpan={5} className="type-caption py-4 text-center text-foreground-secondary">
                    Preview capped — open the full register for the rest
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center gap-2 border-t border-border p-4">
          <span className="type-caption flex-1 text-foreground-secondary">
            Showing {rows.length} of {total.split(' ')[0]}{!capped && !q && ' · scroll for more'}
          </span>
          <Button size="sm" onClick={() => go('reports')}>Full register in Reports</Button>
        </footer>
      </aside>
    </div>
  );
}
