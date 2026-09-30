import * as React from 'react';
import { cn } from '@mockups/ui';

/* The "how many are in the cart" control. One control, not a stepper: every
   quantity change goes through the selling-units sheet, so the pack the buyer
   picked is never silently turned into a loose count. − and + are affordances
   that open it, the same as tapping the number.

   Lives here because a product line shows it in two places — the product card
   and the cart's line list — and the two have to read identically. */
export interface QtyPillProps {
  qty: number;
  /** Opens the selling-units sheet. */
  onEdit?: () => void;
  /** What the control is editing, for screen readers. */
  label?: string;
  className?: string;
}

export function QtyPill({ qty, onEdit, label, className }: QtyPillProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={label ? `Edit quantity for ${label}` : 'Edit quantity'}
      className={cn(
        'flex h-10 items-center justify-center gap-4 rounded-md bg-primary-soft px-4 text-primary-soft-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:opacity-80',
        className
      )}
    >
      <span aria-hidden className="text-lg font-medium leading-none">
        −
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{qty}</span>
      <span aria-hidden className="text-lg font-medium leading-none">
        +
      </span>
    </button>
  );
}
