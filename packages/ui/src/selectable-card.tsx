// SelectableCard — a clickable card that toggles the primary-tint "selected"
// state. This is the app's most repeated inline pattern (coupon, address,
// reorder seller option, delivery window, language) written once. The tint IS
// the selection signal; pass `radio` to also show a dot.
//
//   <SelectableCard selected={id === active} onClick={() => setActive(id)} radio>
//     …content…
//   </SelectableCard>

import * as React from 'react';
import { cn } from './cn';
import { cardVariants } from './card';

export interface SelectableCardProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  selected?: boolean;
  /** Show a radio dot in the top-right corner. */
  radio?: boolean;
}

export const SelectableCard = React.forwardRef<HTMLButtonElement, SelectableCardProps>(
  ({ selected, radio, className, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cn(
        'relative w-full text-left',
        cardVariants({ variant: selected ? 'highlighted' : 'interactive' }),
        className
      )}
      {...props}
    >
      {radio && (
        <span
          aria-hidden
          className={cn(
            'absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border-2',
            selected ? 'border-primary' : 'border-border'
          )}
        >
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
        </span>
      )}
      {children}
    </button>
  )
);
SelectableCard.displayName = 'SelectableCard';
