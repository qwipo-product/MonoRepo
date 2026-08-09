// SegmentedControl — one control for 2–4 mutually-exclusive options.
// Replaces the three tab treatments the app grew (Home bordered-card tabs,
// Reorder pill tabs, Notifications filter chips-as-tabs). For a scrollable row
// of filter categories, use a row of <Chip> instead.
//
//   <SegmentedControl
//     options={[{ value: 'dist', label: 'Distributors' }, { value: 'whole', label: 'Wholesalers' }]}
//     value={tab} onChange={setTab} />

import * as React from 'react';
import { cn } from './cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div role="tablist" className={cn('inline-flex w-full gap-1 rounded-lg bg-muted p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground-secondary hover:text-foreground'
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
