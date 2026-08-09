import type { ReactNode } from 'react';
import StatusBar from '../components/StatusBar';
import BottomNav from '../components/BottomNav';

/* Buyer App shell — owns the fixed chrome: status bar on top, shared bottom tab
   bar below. Screens render their own header inside the scroll area (headers are
   bespoke per screen; only the tab bar is shared). DESIGN-SYSTEM.md §6.4. */
export default function BuyerShell({
  active = 'home',
  cartCount = 0,
  onNavigate = () => {},
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
    <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[38px] bg-background text-foreground shadow-xl">
      <StatusBar />
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      <BottomNav active={active} cartCount={cartCount} onNavigate={onNavigate} />
      {overlay}
    </div>
  );
}
