// FieldError — the one-line error that belongs to a single input. Sits directly
// under the field it describes; pair it with `aria-invalid` on the Input so the
// border turns red at the same time.
//
//   <Input value={phone} aria-invalid={!!err} />
//   <FieldError>Enter a valid 10-digit mobile number</FieldError>

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from './cn';

export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export function FieldError({ className, children, ...props }: FieldErrorProps) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={cn('mt-1.5 flex items-start gap-1.5 text-xs text-error-foreground', className)}
      {...props}
    >
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
