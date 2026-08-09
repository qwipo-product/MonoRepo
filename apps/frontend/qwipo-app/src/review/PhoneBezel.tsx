import type { ReactNode } from 'react';

/* Review-only device bezel: wraps the 390×844 screen frame in an iPhone-style
   black body + notch so the desktop showcase reads as a real phone. Not shipped
   in either surface — purely presentation chrome for the review harness. */
export default function PhoneBezel({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative shrink-0 rounded-[48px] bg-[#1a1a1a] p-3"
      style={{
        boxShadow:
          '0 50px 100px -20px rgba(50, 50, 93, 0.25), 0 30px 60px -30px rgba(0, 0, 0, 0.3), inset 0 0 0 2px #2d2d2d',
      }}
    >
      {children}
      {/* Notch — pill cutout centered over the status bar */}
      <div className="pointer-events-none absolute left-1/2 top-[14px] z-30 h-7 w-[110px] -translate-x-1/2 rounded-full bg-[#1a1a1a]" />
    </div>
  );
}
