// Badge — status pill. Semantic variants read from the status tokens
// (success / warning / error / info / neutral / accent), so a "delivered"
// badge is the same green everywhere instead of hand-picked emerald shades.

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-semibold ' +
    'uppercase tracking-wider whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        neutral: 'bg-neutral-subtle text-neutral-foreground border border-neutral-border',
        secondary: 'bg-muted text-foreground', // alias / low-emphasis
        outline: 'border border-border text-foreground',
        success: 'bg-success-subtle text-success-foreground border border-success-border',
        warning: 'bg-warning-subtle text-warning-foreground border border-warning-border',
        danger: 'bg-error-subtle text-error-foreground border border-error-border',
        info: 'bg-info-subtle text-info-foreground border border-info-border',
        accent: 'bg-accent-subtle text-accent-foreground border border-accent-border',
        destructive: 'bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
