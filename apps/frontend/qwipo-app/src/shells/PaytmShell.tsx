import type { ReactNode } from 'react';

/* Paytm mini-app shell — no header, no tab bar. Paytm's container owns the top
   chrome and back button (DESIGN-SYSTEM.md §8). Accepts the shell props for a
   uniform call site but ignores nav — the container provides it. The thin strip
   stands in for Paytm's own header during review only. */
export default function PaytmShell({
  overlay,
  children,
}: {
  active?: string;
  cartCount?: number;
  onNavigate?: (id: string) => void;
  overlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">
      <div className="flex-shrink-0 flex h-10 items-center bg-muted px-4 text-xs text-muted-foreground">
        Paytm container chrome (not ours)
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      {overlay}
    </div>
  );
}
