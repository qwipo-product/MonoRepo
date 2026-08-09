// Card — the one card surface. Product cards, order cards, seller cards, etc.
// are COMPONENTS composed from this, not new card variants (see the design-
// system analysis, §8). Container variants below cover the real on-screen
// needs: resting, selected, tappable, grouped-flat, and tight inner panels.

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const cardVariants = cva('bg-card text-foreground', {
  variants: {
    variant: {
      // resting card — the app's dominant surface
      default: 'rounded-lg border border-border shadow-sm',
      // selected / emphasized (coupon, address, reorder option)
      highlighted: 'rounded-lg border border-primary bg-primary-soft shadow-sm',
      // tappable — adds hover lift + press
      interactive:
        'rounded-lg border border-border shadow-sm transition-[box-shadow,transform] ' +
        'hover:shadow-md active:scale-[0.99] cursor-pointer',
      // grouped rows (menus, settings) — no shadow, divide children yourself
      flat: 'rounded-lg border border-border',
      // tight inner panel / tile (bill rows, MOV boxes)
      compact: 'rounded-md border border-border bg-background-subtle',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1 p-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold leading-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs text-foreground-secondary', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-4 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { cardVariants };
