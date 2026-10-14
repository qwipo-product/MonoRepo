// Right-side filter drawer for the ENTITY filters — Company / State / City /
// Distributor, multi-select with search over a growing network. The date
// range lives in its own popover under the Date chip (DateRangePopover).
// Desktop counterpart to the ui Sheet; stays in this app until a second app
// needs it.
import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@mockups/ui';
import { Section, Option, MultiSection } from './filterControls';
import {
  ALL, stateOptions, companyOptions, citiesFor, distributorOptions, totals, type Filters,
} from './filters';
import { DateField } from './DateField';

export function FilterPanel({
  open, value, onClose, onApply,
}: {
  open: boolean; value: Filters; onClose: () => void; onApply: (f: Filters) => void;
}) {
  const [draft, setDraft] = useState(value);
  // Rehydrate the calendars from the APPLIED custom range, so reopening shows it.
  const [from, setFrom] = useState<Date | undefined>(value.from ? new Date(value.from) : undefined);
  const [to, setTo] = useState<Date | undefined>(value.to ? new Date(value.to) : undefined);
  const [calOpen, setCalOpen] = useState<'from' | 'to' | null>(null);
  if (!open) return null;

  const apply = () => {
    onApply(draft.preset === 'Custom' && from
      ? { ...draft, from: from.toISOString(), to: (to ?? from).toISOString() }
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
              <Option
                key={r}
                selected={draft.preset === r}
                onClick={() => {
                  setDraft({ ...draft, preset: r });
                  if (r === 'Custom') {
                    // Prefill with the current period so the fields are never empty.
                    if (!from) { setFrom(new Date(2026, 7, 1)); setTo(new Date(2026, 7, 22)); }
                    setCalOpen('from');
                  } else setCalOpen(null);
                }}
              >
                {r === 'Month to date' ? '1 – 22 Aug 2026 · month to date' : r === 'Last month' ? '1 – 31 Jul 2026 · last month' : r === 'Custom' ? 'Custom…' : r}
              </Option>
            ))}
            {draft.preset === 'Custom' && (
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <DateField
                  label="From" date={from}
                  open={calOpen === 'from'} onOpen={() => setCalOpen('from')} onClose={() => setCalOpen(null)}
                  rangeStart={from} rangeEnd={to}
                  onPick={(d) => { setFrom(d); if (to && d > to) setTo(d); setCalOpen('to'); }}
                />
                <DateField
                  label="To" date={to}
                  open={calOpen === 'to'} onOpen={() => setCalOpen('to')} onClose={() => setCalOpen(null)}
                  rangeStart={from} rangeEnd={to}
                  onPick={(d) => { if (from && d < from) { setTo(from); setFrom(d); } else setTo(d); setCalOpen(null); }}
                />
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
            hint="Telangana, Maharashtra, Rajasthan · cities narrow to the selected states"
            options={stateOptions} selected={draft.states}
            onChange={(states) => setDraft({ ...draft, states, cities: [], distributors: [] })}
          />

          <MultiSection
            label="City" unit="cities" total={citiesFor(draft.states).length}
            hint="From outlet GPS · 64 unresolved outlets excluded · changing city resets Distributor"
            options={citiesFor(draft.states)} selected={draft.cities}
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
