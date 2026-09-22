// Full distributor leaderboard in a drawer: all 18, sortable columns,
// row click hands over to the distributor detail drawer.
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Badge, Button, Input, cn } from '@mockups/ui';
import { makeTh } from './tableSort';
import { distributorRows, type DistributorRow } from '../data/distributors';
import type { Page } from '../nav';

const NETWORK_CANCEL = 24.9;
type SortKey = 'value' | 'orders' | 'delivery' | 'cancel' | 'change';
const priorityVariant = { Spotlight: 'success', 'Push in beats': 'info', Nurture: 'neutral' } as const;

export function LeaderboardDrawer({
  onClose, onPick, go,
}: {
  onClose: () => void; onPick: (d: DistributorRow) => void; go: (p: Page | string) => void;
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: 'value', dir: -1 });
  const th = makeTh<SortKey>(sort, setSort);

  let rows = [...distributorRows].sort((a, b) => sort.dir * (a[sort.k] - b[sort.k]));
  if (q) rows = rows.filter((d) => `${d.name} ${d.city}`.toLowerCase().includes(q.toLowerCase()));
  const rankOf = new Map([...distributorRows].sort((a, b) => b.value - a.value).map((r, i) => [r.name, i + 1]));

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[680px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Distributor leaderboard"
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">Distributor leaderboard</span>
            <span className="type-caption block text-foreground-secondary">All 18 · current scope and period · click a row to drill in</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="border-b border-border-subtle px-5 py-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search distributor or city" className="h-9 pl-8" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-card">
              <tr className="type-micro text-left text-foreground-tertiary">
                <th className="w-7 py-2 pr-2 font-semibold">#</th>
                <th className="py-2 pr-3 font-semibold">Distributor</th>
                {th('orders', 'Orders', true)}
                {th('value', 'Value', true)}
                {th('change', 'vs Jul', true)}
                {th('delivery', 'Delivery %', true)}
                {th('cancel', 'Cancel %', true)}
                <th className="py-2 font-semibold">Priority</th>
              </tr>
            </thead>
            <tbody className="type-caption">
              {rows.map((d) => (
                <tr key={d.name} className="cursor-pointer border-t border-border-subtle hover:bg-muted" onClick={() => onPick(d)}>
                  <td className="py-2 pr-2 tabular-nums text-foreground-tertiary">{rankOf.get(d.name)}</td>
                  <td className="py-2 pr-3">
                    <span className="block font-medium">{d.name}</span>
                    <span className="block text-foreground-tertiary">{d.city}</span>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{d.orders}</td>
                  <td className="py-2 pr-3 text-right font-medium tabular-nums">₹{d.value}L</td>
                  <td className={cn('py-2 pr-3 text-right tabular-nums', d.change < 0 ? 'font-medium text-error-foreground' : 'text-success-foreground')}>
                    {d.change < 0 ? '↓' : '↑'} {Math.abs(d.change)}%
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{d.delivery}%</td>
                  <td className={cn('py-2 pr-3 text-right tabular-nums', d.cancel > NETWORK_CANCEL && 'font-medium text-error-foreground')}>{d.cancel}%</td>
                  <td className="py-2"><Badge variant={priorityVariant[d.priority]}>{d.priority}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-foreground-secondary">Nothing matches</td></tr>}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center gap-2 border-t border-border p-4">
          <span className="type-caption flex-1 text-warning-foreground">Activation column needs the retailer↔distributor mapping feed</span>
          <Button size="sm" onClick={() => go('reports/run:distributor-performance')}>Full list in Reports</Button>
        </footer>
      </aside>
    </div>
  );
}
