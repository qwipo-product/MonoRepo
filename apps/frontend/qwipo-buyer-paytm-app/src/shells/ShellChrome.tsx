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
  paytmHeader = true,
  screenKey,
  children,
}: {
  shell: Shell;
  bottomNav?: ReactNode;
  /** Hide the "« Paytm" mini-app bar on Paytm-native surfaces (launcher/search). */
  paytmHeader?: boolean;
  /** Which screen is in the slot. Changing it replays the arrival animation,
   *  so moving between screens reads as a move rather than a cut. */
  screenKey?: string;
  children: ReactNode;
}) {
  return (
    <>
      <StatusBar />

      {shell === 'paytm' && paytmHeader && (
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
          <div className="h-0.5 flex-shrink-0 bg-paytm-cyan" />
        </>
      )}

      <div key={screenKey} className="animate-screen min-h-0 flex-1">
        {children}
      </div>
      {bottomNav}
    </>
  );
}
