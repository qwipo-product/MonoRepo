import type { ReactNode } from 'react';

/* Label + control, DS form rhythm (space-y-2). Used by Onboarding and KYC. */
export default function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  );
}

/* Shared control chrome: 48px min (mobile touch, §6.6), token border + surface. */
export const controlClass =
  'flex h-12 w-full items-center rounded-md border border-border bg-input-background px-3 text-sm';
