import { Home, RotateCcw, Headset, ShoppingCart } from 'lucide-react';
import { cn } from '@mockups/ui';
import type { ScreenId } from '../review/screenIndex';

/* Buyer-shell bottom tab bar (Home · Reorder · Contact us · Cart). Shown only
   on root screens; pushed/detail screens carry their own header instead. */
const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'reorder', icon: RotateCcw, label: 'Reorder' },
  { id: 'sub:help', icon: Headset, label: 'Contact us' },
  { id: 'cart', icon: ShoppingCart, label: 'Cart' },
] as const;

export function BottomNav({
  active,
  cartCount = 0,
  onNavigate,
}: {
  active: ScreenId;
  cartCount?: number;
  onNavigate: (id: ScreenId) => void;
}) {
  return (
    <nav className="grid flex-shrink-0 grid-cols-4 border-t border-border bg-card pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={cn(
            'relative flex min-h-14 flex-col items-center justify-center gap-1',
            active === id ? 'text-primary' : 'text-foreground-secondary'
          )}
        >
          <span className="relative">
            <Icon className="h-5 w-5" />
            {id === 'cart' && cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
