import type { ReactNode } from 'react';

/* Review-only device bezel: wraps the 390×844 screen frame in an iPhone-style
   black body + notch so the desktop showcase reads as a real phone. Not shipped
   in either surface — purely presentation chrome for the review harness. */
export default function PhoneBezel({ children }: { children: ReactNode }) {
  return (
    <div className="relative shrink-0 rounded-[3rem] bg-neutral-950 p-3 shadow-2xl ring-1 ring-black/10">
      {children}
      {/* Notch — pill cutout centered over the status bar */}
      <div className="pointer-events-none absolute left-1/2 top-5 z-30 h-7 w-28 -translate-x-1/2 rounded-full bg-neutral-950" />
    </div>
  );
}
