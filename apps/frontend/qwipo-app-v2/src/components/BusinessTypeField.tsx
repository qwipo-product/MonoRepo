import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Sheet, cn } from '@mockups/ui';
import { Field, controlClass } from './formbits';
import { BUSINESS_TYPES } from '../data/businessTypes';

function BtIcon({ paths }: { paths: string[] }) {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      {paths.map((d, i) => (
        <path key={i} d={d} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

/* Business Type control + its 4-column icon-grid bottom sheet (mirrors the
   source popup). Selected tile uses the DS primary-tint. */
export function BusinessTypeField({
  required,
  value,
  onChange,
}: {
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Field label="Business Type" required={required}>
      <button type="button" onClick={() => setOpen(true)} className={cn(controlClass, 'justify-between')}>
        <span className={value ? 'text-foreground' : 'text-foreground-secondary'}>
          {value || 'Select Business Type'}
        </span>
        <ChevronDown className="h-5 w-5 text-foreground-secondary" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Business Type">
        <ul className="grid grid-cols-4 gap-2">
          {BUSINESS_TYPES.map((bt) => {
            const active = bt.label === value;
            return (
              <li key={bt.label}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(bt.label);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl border p-1.5 shadow-sm transition-colors',
                    active
                      ? 'border-primary bg-primary-soft'
                      : 'border-border bg-card hover:border-primary hover:bg-primary-soft'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-full p-1.5 transition-colors',
                      active ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground-secondary'
                    )}
                  >
                    <BtIcon paths={bt.paths} />
                  </div>
                  <span className="text-center text-[9px] font-medium leading-tight text-foreground">
                    {bt.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </Field>
  );
}
