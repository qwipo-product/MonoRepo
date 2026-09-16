// Right-side filter drawer. Desktop counterpart to the ui Sheet (which is a
// phone bottom-sheet); stays in this app until a second app needs it.
// Selections rescope the chip summary and scope sentence — the figures behind
// stay static, this is a clickable mockup.
import { useState } from 'react';
import { Check, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button, Input, cn } from '@mockups/ui';
import { ALL, companies, cities, distributors, ranges, type Filters } from './filters';

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border-subtle px-5 py-4">
      <div className="type-micro text-foreground-tertiary">{label}</div>
      {hint && <div className="type-caption mb-1 text-foreground-secondary">{hint}</div>}
      <div className="mt-2 flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function Option({ selected, onClick, children, note }: { selected: boolean; onClick: () => void; children: React.ReactNode; note?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'type-body flex items-center justify-between rounded-md px-2.5 py-1.5 text-left hover:bg-muted',
        selected && 'bg-primary-soft font-medium text-primary-soft-foreground hover:bg-primary-soft',
      )}
    >
      <span>
        {children}
        {note && <span className="type-caption ml-2 font-normal text-foreground-tertiary">{note}</span>}
      </span>
      {selected && <Check size={15} />}
    </button>
  );
}

export function FilterPanel({
  open, value, onClose, onApply,
}: {
  open: boolean; value: Filters; onClose: () => void; onApply: (f: Filters) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [q, setQ] = useState('');
  if (!open) return null;
  const set = (k: keyof Filters) => (v: string) => setDraft({ ...draft, [k]: v });
  const shown = distributors.filter((d) => d.toLowerCase().includes(q.toLowerCase()));

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
            {ranges.map((r) => <Option key={r} selected={draft.range === r} onClick={() => set('range')(r)}>{r}</Option>)}
            {draft.range === 'Custom…' && (
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <Input defaultValue="01 Aug 2026" className="h-9" aria-label="From date" />
                <Input defaultValue="22 Aug 2026" className="h-9" aria-label="To date" />
              </div>
            )}
          </Section>

          <Section label="Company" hint="Counts stay whole-order; ₹ becomes this company's lines only">
            {companies.map((c) => <Option key={c} selected={draft.company === c} onClick={() => set('company')(c)}>{c}</Option>)}
          </Section>

          <Section label="City" hint="From outlet GPS · 64 unresolved outlets excluded on selection">
            {cities.map((c) => <Option key={c} selected={draft.city === c} onClick={() => set('city')(c)}>{c}</Option>)}
          </Section>

          <Section label="Distributor" hint="Narrowed by the selected city">
            <div className="relative mb-1.5">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search distributors" className="h-9 pl-8" />
            </div>
            {shown.map((d) => <Option key={d} selected={draft.distributor === d} onClick={() => set('distributor')(d)}>{d}</Option>)}
            {!q && <div className="type-caption px-2.5 py-1 text-foreground-tertiary">+ 12 more — search to find</div>}
          </Section>
        </div>

        <footer className="flex gap-2 border-t border-border p-4">
          <Button fullWidth onClick={() => { onApply(draft); onClose(); }}>Apply filters</Button>
          <Button variant="ghost" onClick={() => setDraft(ALL)}>Reset</Button>
        </footer>
      </aside>
    </div>
  );
}
