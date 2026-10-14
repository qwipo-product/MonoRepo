import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button, Card } from '@mockups/ui';
import { Chip } from './Chip';
import { FilterPanel } from './FilterPanel';
import { ALL, rangeLabel, totals } from './filters';
import { useScope } from '../scope';

/** Extra read-only chips (the Sales drill state). */
export interface ScopeChip { label: string; value: string; drill?: boolean }

export function ScopeBar({
  chips = [], line, action, onAction,
}: {
  chips?: ScopeChip[]; line?: React.ReactNode; action?: string; onAction?: () => void;
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
      <b className="text-foreground">₹ = {nCompanies === 1 ? `${f.companies[0]} lines` : `${nCompanies} companies' lines`} only</b>
      {cityScoped && ' · 64 unresolved outlets excluded'} · Super Admin
    </>
  ) : cityScoped ? (
    <><b className="text-foreground">64 unresolved outlets excluded</b> · Super Admin</>
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
      {scopeLine && (
        <div className="type-caption mt-2.5 text-foreground-secondary">{scopeLine}</div>
      )}

      {/* Mounted only while open so each opening starts from the APPLIED filters. */}
      {open && <FilterPanel open value={f} onClose={() => setOpen(false)} onApply={setF} />}
    </Card>
  );
}
