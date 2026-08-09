// EmptyState — the one empty state. Replaces the ~4 ad-hoc patterns (emoji
// block, lucide-icon block, one-line text) scattered across cart, search,
// orders, notifications. Icon can be an emoji string or any node.
//
//   <EmptyState icon="🛒" title="Your cart is empty"
//     description="Add products to see them here." action={<Button>Browse</Button>} />

import * as React from 'react';
import { cn } from './cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      {icon != null && (
        <div className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-muted text-3xl">
          {icon}
        </div>
      )}
      <div className="text-base font-semibold text-foreground">{title}</div>
      {description && (
        <div className="mt-1 max-w-xs text-sm text-foreground-secondary">{description}</div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
