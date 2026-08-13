// InlineMessage — persistent, in-page feedback. The banner that sits at the top
// of a form or list and stays until the underlying problem is fixed.
//
// Pick by lifetime, not by severity:
//   • InlineMessage — blocks or explains the whole screen, stays put
//   • Toast         — confirms something that already happened, auto-dismisses
//   • FieldError    — belongs to one specific input
//
//   <InlineMessage variant="warning" title="Prices updated"
//     description="Some items changed price since you added them."
//     action={<Button size="sm" variant="soft">Review</Button>} />

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { cn } from './cn';

const inlineMessageVariants = cva(
  'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
  {
    variants: {
      variant: {
        success: 'bg-success-subtle text-success-foreground border-success-border',
        warning: 'bg-warning-subtle text-warning-foreground border-warning-border',
        error: 'bg-error-subtle text-error-foreground border-error-border',
        info: 'bg-info-subtle text-info-foreground border-info-border',
      },
    },
    defaultVariants: { variant: 'info' },
  }
);

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
} as const;

export interface InlineMessageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof inlineMessageVariants> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Trailing control — usually a small Button ("Retry", "Review"). */
  action?: React.ReactNode;
  /** Renders a dismiss X. Omit for messages the buyer can't dismiss. */
  onDismiss?: () => void;
}

export function InlineMessage({
  className,
  variant = 'info',
  title,
  description,
  action,
  onDismiss,
  ...props
}: InlineMessageProps) {
  const Icon = ICONS[variant ?? 'info'];
  return (
    <div role="status" className={cn(inlineMessageVariants({ variant }), className)} {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="font-semibold leading-snug">{title}</div>
        {description && <div className="mt-0.5 text-sm opacity-90">{description}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-0.5 shrink-0 rounded p-1 opacity-70 active:opacity-40"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export { inlineMessageVariants };
