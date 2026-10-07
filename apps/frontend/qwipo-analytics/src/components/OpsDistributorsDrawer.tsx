// Ops distributor list drawer — the sortable fleet-use table behind the
// Trips page's Distributor performance panel (code + name, city, vehicles,
// the four utilizations), per the reference dashboard's table.
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Input, cn } from '@mockups/ui';
import { makeTh, type Sort } from './tableSort';
import { opsDistributors, registry, type OpsDistributor } from '../data/logistics';
import type { Page } from '../nav';

type SortKey = 'name' | 'city' | 'vehicles' | 'vehicleUtil' | 'weightUtil' | 'timeUtil' | 'dpUtil';

const utilClass = (n: number) =>
  n >= 85 ? 'text-success-foreground' : n < 75 ? 'text-warning-foreground' : 'text-foreground';

export function OpsDistributorsDrawer({ onClose, go }: { onClose: () => void; go: (p: Page | string) => void }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort<SortKey>>({ k: 'vehicleUtil', dir: -1 });
  const th = makeTh<SortKey>(sort, setSort, (k) => (k === 'name' || k === 'city' ? 1 : -1));

  let shown = opsDistributors.filter((d) =>
    `${d.name} ${d.code} ${d.city}`.toLowerCase().includes(q.toLowerCase()),
  );
  shown = [...shown].sort((a, b) => {
    if (sort.k === 'name' || sort.k === 'city') return sort.dir * a[sort.k].localeCompare(b[sort.k]);
    return sort.dir * ((a[sort.k] as number) - (b[sort.k] as number));
  });

  const util = (d: OpsDistributor, k: 'vehicleUtil' | 'weightUtil' | 'timeUtil' | 'dpUtil') => (
    <td className={cn('py-2.5 pr-3 text-right font-medium tabular-nums', utilClass(d[k]))}>{d[k]}%</td>
  );

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[720px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Distributor performance"
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">Distributor performance</span>
            <span className="type-caption block text-foreground-secondary">
              {opsDistributors.length} distributors with metrics · {registry.length} registered · current scope and period
            </span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="border-b border-border-subtle px-5 py-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search distributor, code or city" className="h-9 pl-8" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-card">
              <tr className="type-micro text-left text-foreground-tertiary">
                {th('name', 'Distributor')}
                {th('city', 'City')}
                {th('vehicles', 'Vehicles', true)}
                {th('vehicleUtil', 'Vehicle util.', true)}
                {th('weightUtil', 'Weight util.', true)}
                {th('timeUtil', 'Time util.', true)}
                {th('dpUtil', 'Delivery pt. util.', true)}
              </tr>
            </thead>
            <tbody className="type-caption">
              {shown.map((d) => (
                <tr key={d.code} className="border-t border-border-subtle">
                  <td className="py-2.5 pr-3">
                    <span className="block font-mono text-foreground">{d.code}</span>
                    <span className="block text-foreground-secondary">{d.name}</span>
                  </td>
                  <td className="py-2.5 pr-3">{d.city}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{d.vehicles}</td>
                  {util(d, 'vehicleUtil')}
                  {util(d, 'weightUtil')}
                  {util(d, 'timeUtil')}
                  {util(d, 'dpUtil')}
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-foreground-secondary">Nothing matches</td></tr>}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center gap-2 border-t border-border p-4">
          <span className="type-caption flex-1 text-foreground-secondary">Showing {shown.length} of {opsDistributors.length}</span>
          <Button size="sm" onClick={() => go('reports/run:ops-distributor-report')}>Full list in Reports</Button>
        </footer>
      </aside>
    </div>
  );
}
