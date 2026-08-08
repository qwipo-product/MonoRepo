import type { ReactNode } from 'react';

/* Paytm mini-app shell — no header, no tab bar. Paytm's container owns the
   top chrome and the back button, so we render none. See DESIGN-SYSTEM.md §8
   ("You do not own the top chrome"). The thin strip stands in for Paytm's
   own header during review only. */
export default function PaytmShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-[390px] h-[844px] flex flex-col overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">
      <div className="flex-shrink-0 h-10 flex items-center px-4 bg-muted text-muted-foreground text-xs">
        Paytm container chrome (not ours)
      </div>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
