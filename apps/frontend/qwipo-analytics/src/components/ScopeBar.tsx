import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Button, Card, cn } from '@mockups/ui';
import { FilterPanel } from './FilterPanel';
import { ALL, rangeLabel, totals } from './filters';
import { useScope } from '../scope';

/** Extra read-only chips (the Sales drill state). */
export interface ScopeChip { label: string; value: string; drill?: boolean }

/** The one chip shape everything in the bar uses. */
function Chip({
  label, value, active, tone, onClick, onRemove,
}: {
  label?: string; value: string; active?: boolean; tone?: 'drill';
  onClick?: () => void; onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        'type-caption flex items-center gap-1.5 rounded-full py-1.5 pl-3',
        onRemove ? 'pr-1.5' : 'pr-3',
        tone === 'drill'
          ? 'border border-info-border bg-info-subtle font-medium text-info-foreground'
          : active
            ? 'bg-primary-soft font-medium text-primary-soft-foreground'
            : 'bg-background-sunken text-foreground',
        onClick && !active && tone !== 'drill' && 'cursor-pointer hover:bg-muted',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {label && <span className={cn(!active && tone !== 'drill' && 'text-foreground-secondary')}>{label} ·</span>}
      {value}
      {onClick && !onRemove && <ChevronDown size={12} className={cn(tone !== 'drill' && !active && 'text-foreground-tertiary')} />}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${value}`}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary/15"
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
}

export function ScopeBar({
  chips = [], line, refreshed = 'Data refreshed 22 Aug, 06:15 IST', action, onAction,
}: {
  chips?: ScopeChip[]; line: React.ReactNode; refreshed?: string; action?: string; onAction?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { f, setF } = useScope();
  const nCompanies = f.companies.length;
  const cityScoped = f.cities.length > 0;
  const openPanel = () => setOpen(true);

  // A filter with selections shows its VALUES as chips; empty ones show one
  // "All" chip. Removing a state or city cascades per the reset rules.
  type Group = { label: string; total: number; sel: string[]; remove: (v: string) => void };
  const groups: Group[] = [
    { label: 'Company', total: totals.companies, sel: f.companies, remove: (v) => setF({ ...f, companies: f.companies.filter((x) => x !== v) }) },
    ...(f.states.length > 0 || totals.states > 1
      ? [{ label: 'State', total: totals.states, sel: f.states, remove: (v: string) => setF({ ...f, states: f.states.filter((x) => x !== v), cities: [], distributors: [] }) }]
      : []),
    { label: 'City', total: totals.cities, sel: f.cities, remove: (v) => setF({ ...f, cities: f.cities.filter((x) => x !== v), distributors: [] }) },
    { label: 'Distributor', total: totals.distributors, sel: f.distributors, remove: (v) => setF({ ...f, distributors: f.distributors.filter((x) => x !== v) }) },
  ];
  const anyActive = groups.some((g) => g.sel.length > 0) || f.preset !== 'Month to date';

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
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip label="Date" value={rangeLabel(f)} active={f.preset !== 'Month to date'} onClick={openPanel} />
        {groups.map((g) =>
          g.sel.length === 0 ? (
            <Chip key={g.label} label={g.label} value={`All (${g.total})`} onClick={openPanel} />
          ) : (
            g.sel.map((v) => <Chip key={v} value={v} active onClick={openPanel} onRemove={() => g.remove(v)} />)
          ),
        )}
        {chips.map((c) => <Chip key={c.label} tone="drill" label={c.label} value={c.value} onRemove={() => {}} />)}
        <span className="ml-auto flex items-center gap-1.5">
          {anyActive && <Button variant="ghost" size="sm" className="text-link" onClick={() => setF(ALL)}>Reset</Button>}
          {action && <Button variant="ghost" size="sm" className="text-link" onClick={onAction}>{action}</Button>}
          <Button variant="secondary" size="sm" onClick={openPanel}>
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

      {/* Mounted only while open so each opening starts from the APPLIED filters. */}
      {open && <FilterPanel open value={f} onClose={() => setOpen(false)} onApply={setF} />}
    </Card>
  );
}
