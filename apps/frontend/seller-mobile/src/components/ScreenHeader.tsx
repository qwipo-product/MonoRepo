import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

/* The screen title bar — same look as the buyer app's headers. Root (tab)
   screens pass no `onBack`; pushed screens get the back button. */
export function ScreenHeader({ title, onBack, right }: { title: ReactNode; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">{title}</h1>
      {right}
    </header>
  );
}
