// Date-range popover anchored under the Date chip in the scope bar:
// presets on the left, calendar on the right. A preset applies instantly;
// a custom range applies when its second day is picked.
import { useState } from 'react';
import { cn } from '@mockups/ui';
import { Calendar } from './Calendar';
import type { Filters } from './filters';

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const presets = ['Month to date', 'Last month', 'Last 7 days', 'Last 30 days'] as const;

export function DateRangePopover({
  value, onApply, onClose,
}: {
  value: Filters; onApply: (patch: Pick<Filters, 'preset' | 'from' | 'to'>) => void; onClose: () => void;
}) {
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} role="presentation" />
      <div className="absolute left-0 top-full z-50 mt-2 flex overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div className="flex w-44 flex-col gap-0.5 border-r border-border-subtle p-2">
          <div className="type-micro px-2.5 pb-1 pt-1.5 text-foreground-tertiary">Period</div>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { onApply({ preset: p, from: undefined, to: undefined }); onClose(); }}
              className={cn(
                'type-body rounded-md px-2.5 py-1.5 text-left hover:bg-muted',
                value.preset === p && 'bg-primary-soft font-medium text-primary-soft-foreground hover:bg-primary-soft',
              )}
            >
              {p}
            </button>
          ))}
          <div className={cn(
            'type-body mt-1 rounded-md border-t border-border-subtle px-2.5 pb-1.5 pt-2.5',
            value.preset === 'Custom' ? 'font-medium text-primary-soft-foreground' : 'text-foreground-secondary',
          )}>
            Custom
            <span className="type-caption block font-normal text-foreground-secondary">
              {from ? (to && to.getTime() !== from.getTime() ? `${fmt(from)} – ${fmt(to)}` : `${fmt(from)} · single day`) : 'Pick days on the calendar'}
            </span>
          </div>
        </div>
        <div className="w-[300px] p-2.5">
          <Calendar
            from={from}
            to={to}
            onSelect={(f, t) => {
              setFrom(f); setTo(t);
              if (t) { onApply({ preset: 'Custom', from: fmt(f), to: fmt(t) }); onClose(); }
            }}
          />
        </div>
      </div>
    </>
  );
}
