import type { ReactNode } from 'react';

/* The tinted block that carries the facts a distributor plans deliveries
   around — beat, date, area, mobile. Order cards, the order page and the
   customer pages all use it, so those facts look the same everywhere. */
export function InfoBlock({ children }: { children: ReactNode }) {
  return <div className="space-y-2 rounded-md bg-primary-soft p-2.5 text-foreground">{children}</div>;
}

/** Two facts side by side. */
export function InfoPair({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

/* `href` makes the value a link — a mobile number dials on tap. */
export function InfoRow({ icon, label, value, href }: { icon: ReactNode; label: string; value: ReactNode; href?: string }) {
  return (
    <div className="flex min-w-0 gap-1.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] text-foreground-secondary">{label}</div>
        {href ? (
          <a href={href} className="text-sm font-semibold leading-snug text-primary underline-offset-2 active:underline">
            {value}
          </a>
        ) : (
          <div className="text-sm font-semibold leading-snug">{value}</div>
        )}
      </div>
    </div>
  );
}
