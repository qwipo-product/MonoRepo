// Button — foundational primitive, bound to @mockups/design-tokens.
// Mobile-first: default height is a 44px touch target; variants read from
// semantic tokens (bg-primary, bg-success, bg-error, bg-primary-soft).
//
// Old variant/size names (default, outline) are kept as aliases so the
// retiring qwipo-app keeps rendering while qwipo-buyer-paytm-app is built.

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const PRIMARY =
  'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active';
const SECONDARY = 'border border-border bg-card text-foreground hover:bg-muted';
/* Quiet, but unmistakably an action: the brand colour in an outline rather
   than a fill. For the repeatable step inside a form — "Upload Shop Photo",
   "Use My Current Location" — where a filled primary shouts over the one
   button that actually commits the screen. */
const OUTLINE_PRIMARY =
  'border border-primary bg-card text-primary hover:bg-primary-soft active:bg-primary-soft';
const SIZE_MD = 'h-11 gap-2 px-4 text-sm';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md font-bold ' +
    'transition-[color,background-color,transform] duration-150 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ' +
    'active:scale-[0.98] disabled:pointer-events-none disabled:bg-muted disabled:text-foreground-secondary',
  {
    variants: {
      variant: {
        primary: PRIMARY,
        default: PRIMARY, // alias
        secondary: SECONDARY,
        outline: SECONDARY, // alias
        outlinePrimary: OUTLINE_PRIMARY,
        ghost: 'bg-transparent text-foreground hover:bg-muted',
        soft: 'bg-primary-soft text-primary-soft-foreground hover:opacity-90', // tonal ("Discounts")
        destructive: 'bg-error text-white hover:opacity-90',
        success: 'bg-success text-white hover:opacity-90',
        warning: 'bg-warning text-white hover:opacity-90',
      },
      size: {
        sm: 'h-9 gap-1.5 px-3 text-xs',
        md: SIZE_MD,
        default: SIZE_MD, // alias
        lg: 'h-12 gap-2 px-6 text-base',
        icon: 'h-11 w-11 p-0',
      },
      fullWidth: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', fullWidth: false },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export { buttonVariants };
