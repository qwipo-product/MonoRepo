// Right-side filter drawer. Desktop counterpart to the ui Sheet (a phone
// bottom-sheet); stays in this app until a second app needs it.
// Company / City / Distributor are multi-select (the network will have many of
// each — search finds the rest); Date range has presets plus a real calendar.
import { useState } from 'react';
import { Check, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button, Input, cn } from '@mockups/ui';
import { Calendar } from './Calendar';
import {
  ALL, companyOptions, cityOptions, distributorOptions, totals, type Filters,
} from './filters';

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function Section({ label, right, hint, children }: { label: string; right?: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border-subtle px-5 py-4">
      <div className="flex items-baseline justify-between">
        <span className="type-micro text-foreground-tertiary">{label}</span>
        {right}
      </div>
      {hint && <div className="type-caption text-foreground-secondary">{hint}</div>}
      <div className="mt-2 flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function Option({ selected, onClick, children, muted }: { selected: boolean; onClick: () => void; children: React.ReactNode; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'type-body flex items-center justify-between rounded-md px-2.5 py-1.5 text-left hover:bg-muted',
        muted && 'text-foreground-secondary',
        selected && 'bg-primary-soft font-medium text-primary-soft-foreground hover:bg-primary-soft',
      )}
    >
      <span>{children}</span>
      {selected && <Check size={15} />}
    </button>
  );
}

/** Multi-select list: "All" row + toggling options + optional search over a larger universe. */
function MultiSection({
  label, hint, options, total, unit, selected, onChange, searchable,
}: {
  label: string; hint?: string; options: string[]; total: number; unit: string;
  selected: string[]; onChange: (next: string[]) => void; searchable?: boolean;
}) {
  const [q, setQ] = useState('');
  const shown = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;
  const toggle = (o: string) =>
    onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o]);
  return (
    <Section
      label={label}
      hint={hint}
      right={selected.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="type-caption font-medium text-link">
          {selected.length} selected · Clear
        </button>
      )}
    >
      {searchable && (
        <div className="relative mb-1.5">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${unit}`} className="h-9 pl-8" />
        </div>
      )}
      {!q && <Option selected={selected.length === 0} onClick={() => onChange([])} muted>All {unit} ({total})</Option>}
      {shown.map((o) => <Option key={o} selected={selected.includes(o)} onClick={() => toggle(o)}>{o}</Option>)}
      {!q && options.length < total && (
        <div className="type-caption px-2.5 py-1 text-foreground-tertiary">
          + {total - options.length} more — {searchable ? 'search to find' : 'shown once onboarded'}
        </div>
      )}
    </Section>
  );
}

export function FilterPanel({
  open, value, onClose, onApply,
}: {
  open: boolean; value: Filters; onClose: () => void; onApply: (f: Filters) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  if (!open) return null;

  const apply = () => {
    onApply(draft.preset === 'Custom' && from
      ? { ...draft, from: fmt(from), to: to ? fmt(to) : fmt(from) }
      : { ...draft, from: undefined, to: undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[360px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary-soft-foreground">
            <SlidersHorizontal size={17} />
          </span>
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">Filters</span>
            <span className="type-caption block text-foreground-secondary">Scope every card on this page</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Section label="Date range">
            {(['Month to date', 'Last 7 days', 'Last 30 days', 'Custom'] as const).map((r) => (
              <Option key={r} selected={draft.preset === r} onClick={() => setDraft({ ...draft, preset: r })}>
                {r === 'Month to date' ? '1 – 22 Aug 2026 · month to date' : r === 'Custom' ? 'Custom…' : r}
              </Option>
            ))}
            {draft.preset === 'Custom' && (
              <div className="mt-2">
                <Calendar from={from} to={to} onSelect={(f, t) => { setFrom(f); setTo(t); }} />
              </div>
            )}
          </Section>

          <MultiSection
            label="Company" unit="companies" total={totals.companies} searchable
            hint="Counts stay whole-order; ₹ becomes the selected companies' lines only"
            options={companyOptions} selected={draft.companies}
            onChange={(companies) => setDraft({ ...draft, companies })}
          />

          <MultiSection
            label="City" unit="cities" total={totals.cities}
            hint="From outlet GPS · 64 unresolved outlets excluded on selection"
            options={cityOptions} selected={draft.cities}
            onChange={(cities) => setDraft({ ...draft, cities })}
          />

          <MultiSection
            label="Distributor" unit="distributors" total={totals.distributors} searchable
            hint="Narrowed by the selected cities"
            options={distributorOptions} selected={draft.distributors}
            onChange={(distributors) => setDraft({ ...draft, distributors })}
          />
        </div>

        <footer className="flex gap-2 border-t border-border p-4">
          <Button fullWidth onClick={apply}>Apply filters</Button>
          <Button variant="ghost" onClick={() => { setDraft(ALL); setFrom(undefined); setTo(undefined); }}>Reset</Button>
        </footer>
      </aside>
    </div>
  );
}
