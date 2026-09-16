import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button, Card, cn } from '@mockups/ui';
import { FilterPanel } from './FilterPanel';
import { ALL, type Filters } from './filters';

/** Extra read-only chips (the Sales drill state). */
export interface ScopeChip { label: string; value: string; drill?: boolean }

export function ScopeBar({
  chips = [], line, refreshed = 'Data refreshed 22 Aug, 06:15 IST', action, onAction,
}: {
  chips?: ScopeChip[]; line: React.ReactNode; refreshed?: string; action?: string; onAction?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(ALL);
  const companyScoped = filters.company !== ALL.company;
  const cityScoped = filters.city !== ALL.city;

  const summary: { label: string; value: string; active: boolean }[] = [
    { label: 'Company', value: filters.company, active: companyScoped },
    { label: 'City', value: filters.city, active: cityScoped },
    { label: 'Distributor', value: filters.distributor, active: filters.distributor !== ALL.distributor },
    { label: 'Date range', value: filters.range, active: filters.range !== ALL.range },
  ];

  // Gap rules made visible: company selection rewrites the scope sentence to
  // the grain rule; a city selection names its exclusions.
  const scopeLine = companyScoped ? (
    <>
      <b className="text-foreground">Orders containing {filters.company} lines</b> · ₹ figures = {filters.company} lines only
      {cityScoped && ' · 64 unresolved outlets excluded'} · Super Admin
    </>
  ) : cityScoped ? (
    <>{filters.city} · <b className="text-foreground">64 unresolved outlets excluded</b> (no usable GPS) · Super Admin</>
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

      <FilterPanel open={open} value={filters} onClose={() => setOpen(false)} onApply={setFilters} />
    </Card>
  );
}
