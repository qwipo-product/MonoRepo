// EmptyState — the one empty state. Every "no data" screen in the app is this
// component, so they can't drift apart again.
//
// The shape is fixed and always in this order:
//
//   illustration  — a Lucide line icon in a muted rounded tile
//   heading       — sentence case, no full stop
//   subheading    — one sentence explaining why it's empty / what fills it
//   action        — OPTIONAL. Only when there is a real next step.
//
// It centres itself both ways inside its container: `h-full` fills the parent
// (list containers here are `flex-1`, so they have a definite height) and
// `justify-center` centres vertically. That's what keeps a short empty state
// off the top edge of a tall phone screen.
//
//   <EmptyState icon={<ShoppingCart …/>} title="Your cart is empty"
//     description="Add products to see them here."
//     action={<Button>Browse products</Button>} />

import * as React from 'react';
import { cn } from './cn';

export interface EmptyStateProps {
  /** A Lucide icon element. Sized by the component — don't set h/w yourself. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Omit entirely when there's nothing useful for the user to do here. */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center px-8 py-12 text-center',
        className
      )}
    >
      {icon != null && (
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-muted text-foreground-secondary [&>svg]:h-7 [&>svg]:w-7">
          {icon}
        </div>
      )}
      <div className="text-base font-semibold text-foreground">{title}</div>
      {description && (
        <div className="mt-1.5 max-w-[15rem] text-sm leading-snug text-foreground-secondary">
          {description}
        </div>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
