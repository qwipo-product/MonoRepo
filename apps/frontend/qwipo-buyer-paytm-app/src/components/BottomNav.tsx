import { Home, RotateCcw, Headset, ShoppingCart, CalendarDays } from 'lucide-react';
import { cn } from '@mockups/ui';
import type { ScreenId } from '../review/screenIndex';

/* Buyer-shell bottom tab bar (Home · Reorder · Contact us · Cart). Shown only
   on root screens; pushed/detail screens carry their own header instead.
   A salesperson gets Beat Day Delivery Time Table in place of Contact us: the
   delivery days of whichever customer they have switched to. */
const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'reorder', icon: RotateCcw, label: 'Reorder' },
  { id: 'sub:help', icon: Headset, label: 'Contact us' },
  { id: 'cart', icon: ShoppingCart, label: 'Cart' },
] as const;

const SP_TABS = [
  TABS[0],
  TABS[1],
  { id: 'sp:beat-schedule', icon: CalendarDays, label: 'Beat Day Delivery Time Table' },
  TABS[3],
] as const;

export function BottomNav({
  active,
  cartCount = 0,
  onNavigate,
  salesperson = false,
}: {
  active: ScreenId;
  cartCount?: number;
  onNavigate: (id: ScreenId) => void;
  /** Salesperson persona: Beat Schedule after Reorder, no Contact us. */
  salesperson?: boolean;
}) {
  const tabs = salesperson ? SP_TABS : TABS;
  return (
    <nav className="grid flex-shrink-0 grid-cols-4 border-t border-border bg-card pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={cn(
            // The colour eases rather than snapping, and the tab dips under
            // the thumb — the only feedback a tap on a flat icon can give.
            // Icons sit at the same height in every tab (top-aligned), so a
            // two-line label doesn't knock the bar out of line.
            'relative flex min-h-14 flex-col items-center justify-start gap-1 pt-2 transition-colors active:scale-95',
            active === id ? 'text-primary' : 'text-foreground-secondary'
          )}
        >
          <span className="relative">
            <Icon className="h-5 w-5" />
            {id === 'cart' && cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-2xs font-semibold text-white">
                {cartCount}
              </span>
            )}
          </span>
          {/* A long label (Beat Day Delivery Time Table) is a size smaller and
              wraps onto two centred lines; the rest stay on one. */}
          <span
            className={cn(
              'font-medium',
              label.length > 12 ? 'max-w-[86px] text-center text-[9px] leading-[11px] tracking-tight' : 'whitespace-nowrap text-2xs'
            )}
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
