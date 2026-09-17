// Shared filter controls — the ONE way filters look everywhere (dashboard
// scope panel, report run drawer): section with micro label, checkmark option
// rows, multi-select list with "All (N)" and search.
import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Input, cn } from '@mockups/ui';

export function Section({ label, right, hint, children }: { label: string; right?: React.ReactNode; hint?: string; children: React.ReactNode }) {
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

export function Option({ selected, onClick, children, muted }: { selected: boolean; onClick: () => void; children: React.ReactNode; muted?: boolean }) {
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
export function MultiSection({
  label, hint, options, total, unit, selected, onChange, searchable,
}: {
  label: string; hint?: string; options: string[]; total: number; unit: string;
  selected: string[]; onChange: (next: string[]) => void; searchable?: boolean;
}) {
  const [q, setQ] = useState('');
  // Selected options float to the top so an applied choice is never buried.
  const ordered = [...options].sort((a, b) => Number(selected.includes(b)) - Number(selected.includes(a)));
  const shown = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : ordered;
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
