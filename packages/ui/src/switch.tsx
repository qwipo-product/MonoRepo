// Switch — accessible on/off toggle. role="switch" + aria-checked so it reads
// correctly to assistive tech. Track is primary when on, a muted fill when off.
//
//   <Switch checked={isDark} onCheckedChange={setDark} aria-label="Dark mode" />

import * as React from 'react';
import { cn } from './cn';

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        checked ? 'bg-primary' : 'bg-foreground/20',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  )
);
Switch.displayName = 'Switch';
