import type { ReactNode } from 'react';
import { ChevronLeft, MoreVertical, X } from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import type { Shell } from '../review/ShellSwitcher';

/* Wraps a screen in the selected surface's chrome:
   • buyer  → the standalone app (iOS status bar; screens carry their own headers)
   • paytm  → the Paytm Mini WebView container bar over the same screen. */
export function ShellChrome({ shell, children }: { shell: Shell; children: ReactNode }) {
  return (
    <>
      <StatusBar />

      {shell === 'paytm' && (
        <>
          <div className="flex h-11 flex-shrink-0 items-center gap-1 border-b border-border bg-card px-1.5">
            <button className="grid h-9 w-9 place-items-center text-foreground" aria-label="Back">
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold leading-none">Qwipo</div>
              <div className="mt-0.5 text-[9px] text-foreground-secondary">Mini app · Paytm</div>
            </div>
            <button className="grid h-9 w-9 place-items-center text-foreground" aria-label="More">
              <MoreVertical size={18} />
            </button>
            <button className="grid h-9 w-9 place-items-center text-foreground" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          {/* Paytm brand accent line */}
          <div className="h-0.5 flex-shrink-0 bg-[#00BAF2]" />
        </>
      )}

      <div className="min-h-0 flex-1">{children}</div>
    </>
  );
}
