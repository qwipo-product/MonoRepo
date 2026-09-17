// Entity-grain drill-through drawer (distributors, cities, brands, outlets…).
// Two renderings: rows carrying numeric v/delta get a sortable TABLE with
// headers (# · Name · Share · Value · vs Jul); descriptive rows (funnel
// outlets, quiet outlets) keep the card-row list.
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Input, cn } from '@mockups/ui';
import { makeTh } from './tableSort';
import type { EntityRow } from '../data/entityRows';
import type { Page } from '../nav';

export interface EntityQuickFilter { label: string; tag?: string; count: number | string }

type SortKey = 'name' | 'v' | 'delta';

export function EntityDrawer({
  title, total, rows, quickFilters, initialQf, shareTotal, onClose, go,
}: {
  title: string; total: string; rows: EntityRow[];
  quickFilters?: EntityQuickFilter[]; initialQf?: number;
  /** denominator for the Share column; enables the table rendering */
  shareTotal?: number;
  onClose: () => void; go: (p: Page) => void;
}) {
  const [q, setQ] = useState('');
  const [qf, setQf] = useState(initialQf ?? 0);
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: 'v', dir: -1 });
  const tabular = rows.some((r) => r.v !== undefined);

  const tag = quickFilters?.[qf]?.tag;
  let shown = tag ? rows.filter((r) => r.tags?.includes(tag)) : rows;
  if (q) shown = shown.filter((r) => `${r.name} ${r.sub}`.toLowerCase().includes(q.toLowerCase()));

  // Rank is always by value, whatever the current sort.
  const rankOf = new Map([...rows].sort((a, b) => (b.v ?? 0) - (a.v ?? 0)).map((r, i) => [r.name, i + 1]));
  if (tabular) {
    shown = [...shown].sort((a, b) => {
      if (sort.k === 'name') return sort.dir * a.name.localeCompare(b.name);
      return sort.dir * (((a[sort.k] ?? 0) as number) - ((b[sort.k] ?? 0) as number));
    });
  }

  const th = makeTh<SortKey>(sort, setSort, (k) => (k === 'name' ? 1 : -1));

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[560px] flex-col border-l border-border bg-card shadow-xl"
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
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 pl-8" />
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
                  {f.label} <span className="tabular-nums">{f.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {tabular ? (
          <div className="flex-1 overflow-y-auto px-5">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-card">
                <tr className="type-micro text-left text-foreground-tertiary">
                  <th className="w-7 py-2 pr-2 font-semibold">#</th>
                  {th('name', 'Name')}
                  <th className="py-2 pr-3 font-semibold">Share</th>
                  {th('v', 'Value', true)}
                  {th('delta', 'vs Jul', true)}
                </tr>
              </thead>
              <tbody className="type-caption">
                {shown.map((r) => (
                  <tr key={r.name} className="border-t border-border-subtle">
                    <td className="py-2 pr-2 tabular-nums text-foreground-tertiary">{rankOf.get(r.name)}</td>
                    <td className="py-2 pr-3">{r.name}</td>
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        <i className="block h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(((r.v ?? 0) / (shareTotal ?? 1)) * 160, 2)}px` }} />
                        <span className="tabular-nums text-foreground-secondary">{(((r.v ?? 0) / (shareTotal ?? 1)) * 100).toFixed(1)}%</span>
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums">₹{r.v}L</td>
                    <td className={cn('py-2 text-right tabular-nums', (r.delta ?? 0) < 0 ? 'font-medium text-error-foreground' : (r.delta ?? 0) > 0 ? 'text-success-foreground' : 'text-foreground-tertiary')}>
                      {(r.delta ?? 0) === 0 ? '—' : `${(r.delta ?? 0) < 0 ? '↓' : '↑'} ${Math.abs(r.delta ?? 0)}%`}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-foreground-secondary">Nothing matches</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-2">
            {shown.map((r) => (
              <div key={r.name} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border-subtle py-2.5">
                <span>
                  <span className="type-label block">{r.name}</span>
                  <span className="type-caption block text-foreground-secondary">{r.sub}</span>
                  {r.mid && <span className={cn('type-caption block', r.tone === 'error' ? 'text-error-foreground' : r.tone === 'warning' ? 'text-warning-foreground' : 'text-foreground-secondary')}>{r.mid}</span>}
                </span>
                <span className="text-right">
                  <span className="type-price-sm block">{r.right}</span>
                  {r.rightSub && <span className={cn('type-caption block', r.tone === 'error' ? 'text-error-foreground' : 'text-foreground-secondary')}>{r.rightSub}</span>}
                </span>
              </div>
            ))}
            {shown.length === 0 && <div className="py-8 text-center text-foreground-secondary">Nothing matches</div>}
          </div>
        )}

        <footer className="flex items-center gap-2 border-t border-border p-4">
          <span className="type-caption flex-1 text-foreground-secondary">Showing {shown.length} of {quickFilters?.[qf]?.count ?? total.split(' ')[0]}</span>
          <Button size="sm" onClick={() => go('reports')}>Full list in Reports</Button>
        </footer>
      </aside>
    </div>
  );
}
