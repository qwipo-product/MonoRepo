// Input — text field primitive. Mobile 44px height.
//
// State → surface:
//   • editable (default) → WHITE (bg-card) + border. An enterable field must
//     not read as gray.
//   • disabled / read-only → GRAY (bg-input) + muted text + not-allowed cursor.
//     Gray is the "you can't type here" signal, not the default.

import * as React from 'react';
import { cn } from './cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground ' +
          'placeholder:text-foreground-secondary transition-colors ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
          // non-editable states read gray
          'read-only:bg-input read-only:text-foreground-secondary ' +
          'disabled:bg-input disabled:text-foreground-secondary disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
