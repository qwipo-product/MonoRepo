import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button, Card, cn } from '@mockups/ui';
import { FilterPanel } from './FilterPanel';
import { ALL, countLabel, rangeLabel, totals, type Filters } from './filters';

/** Extra read-only chips (the Sales drill state). */
export interface ScopeChip { label: string; value: string; drill?: boolean }

export function ScopeBar({
  chips = [], line, refreshed = 'Data refreshed 22 Aug, 06:15 IST', action, onAction,
}: {
  chips?: ScopeChip[]; line: React.ReactNode; refreshed?: string; action?: string; onAction?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Filters>(ALL);
  const nCompanies = f.companies.length;
  const cityScoped = f.cities.length > 0;

  // Order = dependency chain: when → whose goods → where → who serves it.
  const summary = [
    { label: 'Date range', value: rangeLabel(f), active: f.preset !== 'Month to date' },
    { label: 'Company', value: countLabel(f.companies, 'companies', totals.companies), active: nCompanies > 0 },
    { label: 'City', value: countLabel(f.cities, 'cities', totals.cities), active: cityScoped },
    { label: 'Distributor', value: countLabel(f.distributors, 'distributors', totals.distributors), active: f.distributors.length > 0 },
  ];

  // Gap rules made visible: a company selection rewrites the scope sentence to
  // the grain rule; a city selection names its exclusions.
  const scopeLine = nCompanies > 0 ? (
    <>
      <b className="text-foreground">Orders containing {nCompanies === 1 ? `${f.companies[0]} lines` : `lines of ${nCompanies} companies`}</b>
      {' '}· ₹ figures = {nCompanies === 1 ? 'their lines' : 'those lines'} only
      {cityScoped && ' · 64 unresolved outlets excluded'} · Super Admin
    </>
  ) : cityScoped ? (
    <>{f.cities.join(', ')} · <b className="text-foreground">64 unresolved outlets excluded</b> (no usable GPS) · Super Admin</>
  ) : line;

  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {summary.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-left leading-tight transition-colors hover:bg-muted',
              c.active ? 'bg-primary-soft hover:bg-primary-soft' : 'bg-background-sunken',
            )}
          >
            <span className={cn('type-micro block normal-case tracking-normal', c.active ? 'text-primary-soft-foreground' : 'text-foreground-secondary')}>{c.label}</span>
            <span className={cn('type-label block', c.active && 'text-primary-soft-foreground')}>{c.value}</span>
          </button>
        ))}
        {chips.map((c) => (
          <Card key={c.label} variant="flat" className="flex items-center justify-between gap-3 rounded-md border border-info-border bg-info-subtle px-2.5 py-1.5">
            <span className="leading-tight">
              <span className="type-micro block normal-case tracking-normal text-info-foreground">{c.label}</span>
              <span className="type-label block text-info-foreground">{c.value}</span>
            </span>
            <X size={13} className="text-info-foreground" />
          </Card>
        ))}
        <span className="ml-auto flex items-center gap-1.5">
          {action && <Button variant="ghost" size="sm" className="text-link" onClick={onAction}>{action}</Button>}
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <SlidersHorizontal size={14} /> Filters
          </Button>
        </span>
      </div>
      <div className="type-caption mt-2.5 flex flex-wrap justify-between gap-2 text-foreground-secondary">
        <span>{scopeLine}</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {refreshed}
        </span>
      </div>

      {/* Mounted only while open so each opening starts from the APPLIED
          filters, never from a draft abandoned with ✕ or a backdrop click. */}
      {open && <FilterPanel open value={f} onClose={() => setOpen(false)} onApply={setF} />}
    </Card>
  );
}
