import type { ReactNode } from 'react';
import { Home, Search, ShoppingCart, Package, User } from 'lucide-react';

/* Buyer App shell — owns the chrome: app header + bottom tab bar.
   This chrome is Qwipo's own (native app), unlike the Paytm shell where
   the container owns the top bar and back. See docs/DESIGN-SYSTEM.md §6.4. */
const TABS = [
  { icon: Home, label: 'Home' },
  { icon: Search, label: 'Search' },
  { icon: ShoppingCart, label: 'Cart' },
  { icon: Package, label: 'Orders' },
  { icon: User, label: 'Profile' },
];

export default function BuyerShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-[390px] h-[844px] flex flex-col overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">
      <header className="flex-shrink-0 h-14 flex items-center px-4 border-b border-border">
        <span className="text-base font-semibold">Qwipo</span>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <nav className="flex-shrink-0 grid grid-cols-5 border-t border-border pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            className={`flex flex-col items-center justify-center gap-1 py-2 min-h-14 ${
              i === 0 ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
