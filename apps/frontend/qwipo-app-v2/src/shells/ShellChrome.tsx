import type { ReactNode } from 'react';
import { ChevronsLeft, MoreVertical } from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import type { Shell } from '../review/ShellSwitcher';

/* Wraps a screen in the selected surface's chrome:
   • buyer  → the standalone app (iOS status bar; screens carry their own headers)
   • paytm  → the Paytm Mini WebView container bar over the same screen. */
export function ShellChrome({
  shell,
  bottomNav,
  children,
}: {
  shell: Shell;
  bottomNav?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <StatusBar />

      {shell === 'paytm' && (
        <>
          <div className="flex h-12 flex-shrink-0 items-center justify-between bg-card px-4">
            <button className="flex items-center gap-2 text-foreground active:opacity-70" aria-label="Back to Paytm">
              <ChevronsLeft size={22} />
              <span className="text-lg font-medium">Paytm</span>
            </button>
            <button className="grid h-9 w-9 place-items-center text-foreground active:opacity-70" aria-label="More">
              <MoreVertical size={20} />
            </button>
          </div>
          {/* Paytm brand accent line */}
          <div className="h-0.5 flex-shrink-0 bg-[#00BAF2]" />
        </>
      )}

      <div className="min-h-0 flex-1">{children}</div>
      {shell === 'buyer' && bottomNav}
    </>
  );
}
