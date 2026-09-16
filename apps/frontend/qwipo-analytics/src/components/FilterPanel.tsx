// Right-side filter drawer for the ENTITY filters — Company / State / City /
// Distributor, multi-select with search over a growing network. The date
// range lives in its own popover under the Date chip (DateRangePopover).
// Desktop counterpart to the ui Sheet; stays in this app until a second app
// needs it.
import { useState } from 'react';
import { CalendarDays, Check, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button, Input, cn } from '@mockups/ui';
import { Calendar } from './Calendar';
import {
  ALL, stateOptions, companyOptions, cityOptions, distributorOptions, totals, type Filters,
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
  const [calOpen, setCalOpen] = useState(false);
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
            {(['Month to date', 'Last month', 'Last 7 days', 'Last 30 days', 'Custom'] as const).map((r) => (
              <Option key={r} selected={draft.preset === r} onClick={() => { setDraft({ ...draft, preset: r }); setCalOpen(r === 'Custom'); }}>
                {r === 'Month to date' ? '1 – 22 Aug 2026 · month to date' : r === 'Last month' ? '1 – 31 Jul 2026 · last month' : r === 'Custom' ? 'Custom…' : r}
              </Option>
            ))}
            {draft.preset === 'Custom' && (
              <div className="relative mt-1.5">
                <button
                  type="button"
                  onClick={() => setCalOpen((v) => !v)}
                  className="type-body flex h-9 w-full items-center gap-2 rounded-md border border-border bg-card px-3 text-left hover:bg-muted"
                >
                  <CalendarDays size={14} className="text-foreground-tertiary" />
                  {from ? (to && to.getTime() !== from.getTime() ? `${fmt(from)} – ${fmt(to)}` : `${fmt(from)} · single day`) : <span className="text-foreground-secondary">Pick dates</span>}
                </button>
                {calOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setCalOpen(false)} role="presentation" />
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-border bg-card p-1 shadow-lg">
                      <Calendar
                        from={from}
                        to={to}
                        onSelect={(f, t) => { setFrom(f); setTo(t); if (t) setCalOpen(false); }}
                      />
                    </div>
                  </>
                )}
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
            label="State" unit="states" total={totals.states}
            hint="More states appear as they onboard · cities narrow to the selected states"
            options={stateOptions} selected={draft.states}
            onChange={(states) => setDraft({ ...draft, states, cities: [], distributors: [] })}
          />

          <MultiSection
            label="City" unit="cities" total={totals.cities}
            hint="From outlet GPS · 64 unresolved outlets excluded · changing city resets Distributor"
            options={cityOptions} selected={draft.cities}
            onChange={(cities) => setDraft({ ...draft, cities, distributors: [] })}
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
