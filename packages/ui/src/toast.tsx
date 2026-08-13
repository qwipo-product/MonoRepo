// Toast — transient confirmation of something that already happened. Renders
// `absolute` so it floats inside the phone frame (same trick as Sheet), pinned
// above the bottom nav.
//
// Use for outcomes, not for problems the buyer must act on — a Toast that
// disappears is the wrong home for "fix this before you continue".
//
//   <Toast open={saved} variant="success" message="Address saved"
//          onClose={() => setSaved(false)} />

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from './cn';

// Subtle surface + border rather than a solid slab: the kit has no
// "text on solid success" token, and inventing one here would put a colour
// decision in the shared package instead of the app's @theme block.
const toastVariants = cva(
  'pointer-events-auto flex w-full items-center gap-2.5 rounded-lg border px-3.5 py-3 ' +
    'text-sm font-medium shadow-lg',
  {
    variants: {
      variant: {
        success: 'bg-success-subtle text-success-foreground border-success-border',
        error: 'bg-error-subtle text-error-foreground border-error-border',
        info: 'bg-card text-foreground border-border',
      },
    },
    defaultVariants: { variant: 'info' },
  }
);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info } as const;

export interface ToastProps extends VariantProps<typeof toastVariants> {
  open: boolean;
  message: React.ReactNode;
  /** Auto-dismiss delay in ms. Pass 0 to keep it until closed manually. */
  duration?: number;
  onClose?: () => void;
  /** Trailing control, e.g. an "Undo" button. */
  action?: React.ReactNode;
  className?: string;
}

export function Toast({
  open,
  message,
  variant = 'info',
  duration = 4000,
  onClose,
  action,
  className,
}: ToastProps) {
  React.useEffect(() => {
    if (!open || !duration || !onClose) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;
  const Icon = ICONS[variant ?? 'info'] ?? AlertTriangle;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-20">
      <div role="status" aria-live="polite" className={cn(toastVariants({ variant }), className)}>
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        <span className="min-w-0 flex-1">{message}</span>
        {action}
      </div>
    </div>
  );
}

export { toastVariants };
