// Drill-through drawer: the record rows behind a KPI (Metabase "see these
// records" / Power BI drillthrough). Shows a scoped page of orders; the full
// register and the export stay with Reports.
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Badge, Button, Input, cn, type BadgeProps } from '@mockups/ui';
import { MAX_PAGES, pageRows, stageLabel, type Stage } from '../data/orderRows';
import type { Page } from '../nav';

/** Days since order date, as of the 22 Aug refresh. */
function ageDays(date: string) {
  const d = parseInt(date);
  return date.includes('Jul') ? 22 + 31 - d : 22 - d;
}

/** "21 Aug" → "22 Aug" = "1d" (mock dates are day-month strings in one month). */
function daysBetween(from: string, to?: string) {
  if (!to) return '';
  const d = parseInt(to) - parseInt(from);
  return d > 0 ? `· ${d}d` : '· same day';
}

// Badges speak outcome language, matching the Order outcomes card: every open
// stage reads "Order placed"; only real outcomes get their own badge.
const stageBadge: Record<Stage, { variant: NonNullable<BadgeProps['variant']>; label: string }> = {
  created: { variant: 'info', label: 'Order placed' },
  accepted: { variant: 'info', label: 'Order placed' },
  packed: { variant: 'info', label: 'Order placed' },
  shipped: { variant: 'info', label: 'Order placed' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  returned: { variant: 'warning', label: 'Returned' },
};

export function RecordsDrawer({
  title, total, statuses, date, distributors, sortByValue, quickFilters, initialQf, onClose, go,
}: {
  title: string;
  /** the KPI's real total, e.g. "1,142 orders · ₹38.6L" */
  total: string;
  /** limit to these stages (e.g. the four open stages) */
  statuses?: Stage[];
  date?: string;
  distributors?: string[];
  sortByValue?: boolean;
  /** chips inside the drawer to slice the list — by status group or age bucket */
  quickFilters?: { label: string; statuses?: Stage[]; age?: [number, number | null]; count: number | string }[];
  /** index of the chip to preselect (e.g. the bar the user clicked) */
  initialQf?: number;
  onClose: () => void;
  go: (p: Page | string) => void;
}) {
  const [q, setQ] = useState('');
  const [pages, setPages] = useState(1);
  const [qf, setQf] = useState(initialQf ?? 0);
  const capped = pages >= MAX_PAGES;
  const active = quickFilters?.[qf];
  const activeStatuses = quickFilters ? active?.statuses : statuses;
  const showAge = quickFilters?.some((x) => x.age) ?? false;
  let rows = Array.from({ length: pages }, (_, p) => pageRows(p)).flat();
  if (activeStatuses?.length) rows = rows.filter((r) => activeStatuses.includes(r.status));
  if (active?.age) {
    const [lo, hi] = active.age;
    rows = rows.filter((r) => ageDays(r.date) >= lo && (hi === null || ageDays(r.date) <= hi));
  }
  if (date) rows = rows.filter((r) => r.date === date);
  if (distributors?.length) rows = rows.filter((r) => distributors.includes(r.distributor));
  if (sortByValue) rows = [...rows].sort((a, b) => b.value - a.value);
  if (q) rows = rows.filter((r) => `${r.id} ${r.outlet} ${r.distributor}`.toLowerCase().includes(q.toLowerCase()));

  // The status the list is sliced to, as the register's Status filter option —
  // carried in the hash so the Run drawer opens with it pre-applied.
  const open: Stage[] = ['created', 'accepted', 'packed', 'shipped'];
  const s = activeStatuses ?? [];
  const outcome =
    s.length === 0 ? 'All'
      : s.every((x) => x === 'delivered') ? 'Delivered'
      : s.every((x) => x === 'cancelled') ? 'Cancelled'
      : s.every((x) => x === 'returned') ? 'Returned'
      : s.every((x) => open.includes(x)) ? 'Order placed'
      : 'All';

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
          {quickFilters && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {quickFilters.map((f, i) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setQf(i)}
                  className={cn(
                    'type-caption rounded-full px-3 py-1',
                    i === qf ? 'bg-primary-soft font-medium text-primary-soft-foreground' : 'bg-background-sunken text-foreground-secondary hover:bg-muted',
                  )}
                >
                  {f.label} <span className="tabular-nums">{typeof f.count === 'number' ? f.count.toLocaleString('en-IN') : f.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5" onScroll={onScroll}>
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-card">
              <tr className="type-micro text-left text-foreground-tertiary">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Order</th>
                <th className="py-2 pr-3 font-semibold">Outlet</th>
                {!showAge && <th className="py-2 pr-3 font-semibold">Status</th>}
                {showAge && <th className="py-2 pr-3 font-semibold">Age</th>}
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
                  {!showAge && (
                    <td className="py-2 pr-3">
                      <Badge variant={stageBadge[r.status].variant}>{stageBadge[r.status].label}</Badge>
                      {r.delivered && (
                        <span className="mt-0.5 block whitespace-nowrap tabular-nums text-foreground-tertiary">
                          {r.delivered} {daysBetween(r.date, r.delivered)}
                        </span>
                      )}
                    </td>
                  )}
                  {showAge && (
                    <td className="py-2 pr-3">
                      <Badge variant={ageDays(r.date) >= 4 ? 'danger' : ageDays(r.date) >= 2 ? 'warning' : 'info'}>
                        {ageDays(r.date) >= 4 ? 'D4+' : `D${ageDays(r.date)}`}
                      </Badge>
                      <span className="ml-1.5 tabular-nums text-foreground-secondary">{ageDays(r.date)}d</span>
                      <span className="mt-0.5 block text-foreground-tertiary">{stageLabel[r.status]}</span>
                    </td>
                  )}
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
          <Button size="sm" onClick={() => go(`reports/run:order-register:${encodeURIComponent(outcome)}`)}>Full register in Reports</Button>
        </footer>
      </aside>
    </div>
  );
}
