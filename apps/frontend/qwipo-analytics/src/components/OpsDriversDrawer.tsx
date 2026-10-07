// Ops driver list drawer — the sortable driver analytics table behind the
// Trips page's Driver performance panel (rank, trips, distance, attempts,
// returns, success rate, runtime), per the reference dashboard's table.
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Input, cn } from '@mockups/ui';
import { makeTh, type Sort } from './tableSort';
import type { Driver } from '../data/logistics';
import type { Page } from '../nav';

type SortKey = 'name' | 'trips' | 'distanceKm' | 'attempts' | 'returns' | 'successRate' | 'runtime';

const runtimeMin = (r: string) => {
  const [, h, m] = r.match(/(\d+)h (\d+)m/) ?? [];
  return Number(h) * 60 + Number(m);
};

export function OpsDriversDrawer({ title, drivers, onClose, go }: {
  title: string; drivers: Driver[]; onClose: () => void; go: (p: Page | string) => void;
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort<SortKey>>({ k: 'trips', dir: -1 });
  const th = makeTh<SortKey>(sort, setSort, (k) => (k === 'name' ? 1 : -1));

  const trips = drivers.reduce((s, d) => s + d.trips, 0);
  const km = drivers.reduce((s, d) => s + d.distanceKm, 0);
  // Rank is always by trips, whatever the current sort.
  const rankOf = new Map([...drivers].sort((a, b) => b.trips - a.trips).map((d, i) => [d.name, i + 1]));

  let shown = drivers.filter((d) => `${d.name} ${d.city}`.toLowerCase().includes(q.toLowerCase()));
  shown = [...shown].sort((a, b) => {
    if (sort.k === 'name') return sort.dir * a.name.localeCompare(b.name);
    if (sort.k === 'runtime') return sort.dir * (runtimeMin(a.runtime) - runtimeMin(b.runtime));
    return sort.dir * ((a[sort.k] as number) - (b[sort.k] as number));
  });

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[720px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={title}
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">{title}</span>
            <span className="type-caption block text-foreground-secondary">
              Summary: {trips} trips · {km.toLocaleString('en-IN')} km · avg {Math.round(km / drivers.length)} km/driver
            </span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="border-b border-border-subtle px-5 py-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search driver…" className="h-9 pl-8" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-card">
              <tr className="type-micro text-left text-foreground-tertiary">
                <th className="w-8 py-2 pr-2 font-semibold">#</th>
                {th('name', 'Driver')}
                {th('trips', 'Trips', true)}
                {th('distanceKm', 'Distance (km)', true)}
                {th('attempts', 'Attempts', true)}
                {th('returns', 'Returns', true)}
                {th('successRate', 'Success rate', true)}
                {th('runtime', 'Runtime', true)}
              </tr>
            </thead>
            <tbody className="type-caption">
              {shown.map((d) => (
                <tr key={d.name} className="border-t border-border-subtle">
                  <td className="py-2.5 pr-2">
                    <span className="type-micro grid h-5 w-5 place-items-center rounded-full bg-warning-subtle tabular-nums text-warning-foreground">{rankOf.get(d.name)}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="block font-medium">{d.name}</span>
                    <span className="block text-foreground-secondary">{d.city} · {(d.vehicles ?? [d.vehicle]).join(', ')}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{d.trips}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-foreground-secondary">{d.distanceKm} km</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{d.attempts}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{d.returns}</td>
                  <td className={cn('py-2.5 pr-3 text-right font-medium tabular-nums', d.successRate >= 95 ? 'text-success-foreground' : 'text-warning-foreground')}>
                    {d.successRate}%
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{d.runtime}</td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-foreground-secondary">Nothing matches</td></tr>}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center gap-2 border-t border-border p-4">
          <span className="type-caption flex-1 text-foreground-secondary">Showing {shown.length} of {drivers.length} records</span>
          <Button size="sm" onClick={() => go('reports/run:ops-distributor-report')}>Full list in Reports</Button>
        </footer>
      </aside>
    </div>
  );
}
