// Chip — one pill for filters, tags, recent/trending searches, and category
// shortcuts. Replaces the several bespoke pill treatments the app grew.
// Selectable: pass `selected` to get the primary-tint active state (the same
// "border-primary bg-primary-soft" language used for selected cards).
//
//   <Chip selected={active} onClick={toggle} icon={<Clock/>}>Mung dal</Chip>

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const chipVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
  {
    variants: {
      selected: {
        true: 'border-primary bg-primary-soft text-primary-soft-foreground',
        false: 'border-border bg-card text-foreground hover:bg-muted',
      },
    },
    defaultVariants: { selected: false },
  }
);

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof chipVariants> {
  icon?: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, icon, children, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(chipVariants({ selected }), className)} {...props}>
      {icon}
      {children}
    </button>
  )
);
Chip.displayName = 'Chip';

export { chipVariants };
