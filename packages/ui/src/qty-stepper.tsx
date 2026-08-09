// QtyStepper — one quantity control. Replaces the two inline steppers (h-7 and
// h-9) the app grew. `tone="soft"` gives the primary-tinted look used inside
// product cards; default is a neutral bordered control.
//
//   <QtyStepper value={qty} onChange={setQty} min={0} />

import * as React from 'react';
import { cn } from './cn';

export interface QtyStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  tone?: 'neutral' | 'soft';
  disabled?: boolean;
  className?: string;
}

export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  tone = 'neutral',
  disabled,
  className,
}: QtyStepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  const soft = tone === 'soft';

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-md',
        soft ? 'bg-primary-soft' : 'border border-border bg-card',
        className
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease"
        className={cn(
          'grid h-9 w-9 place-items-center text-lg font-medium disabled:opacity-40',
          soft ? 'text-primary-soft-foreground hover:bg-primary/10' : 'text-primary hover:bg-muted'
        )}
      >
        −
      </button>
      <span className="w-8 select-none text-center text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase"
        className={cn(
          'grid h-9 w-9 place-items-center text-lg font-medium disabled:opacity-40',
          soft ? 'text-primary-soft-foreground hover:bg-primary/10' : 'text-primary hover:bg-muted'
        )}
      >
        +
      </button>
    </div>
  );
}
