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
      {/* Illustration — same geometry as the KYC success tick: an 80px circle
          with a 40px glyph. Tinted with the app's icon-chip colours rather than
          `bg-muted`, which sits too close to the surface behind it to read as a
          shape at all. Soft rather than solid: an empty state is neutral
          information, not a success moment. */}
      {icon != null && (
        <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-primary [&>svg]:h-10 [&>svg]:w-10">
          {icon}
        </div>
      )}
      <div className="mt-5 text-lg font-semibold text-foreground">{title}</div>
      {description && (
        <div className="mt-2 max-w-[16rem] text-sm leading-relaxed text-foreground-secondary">
          {description}
        </div>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
