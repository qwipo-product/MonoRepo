import type { ReactNode } from 'react';

/* Sticky bottom action bar with consistent spacing across screens. Keeps a
   minimum 1.5rem gap above the frame edge and grows to the device safe-area
   inset when larger (§6.2). Use for every bottom-aligned CTA. */
export default function ScreenFooter({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
