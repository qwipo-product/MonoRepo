import { Home, RotateCcw, ShoppingCart } from 'lucide-react';
import { useI18n } from '@mockups/i18n';

/* Shared bottom tab bar (Home · Reorder · Cart). Mirrors qwipo-buyer-app's
   BottomNav. Owned by BuyerShell; the Paytm shell has none (container chrome). */
const TABS = [
  { id: 'home', icon: Home, key: 'nav.home' },
  { id: 'reorder', icon: RotateCcw, key: 'nav.reorder' },
  { id: 'cart', icon: ShoppingCart, key: 'nav.cart' },
];

export default function BottomNav({
  active,
  cartCount = 0,
  onNavigate,
}: {
  active: string;
  cartCount?: number;
  onNavigate: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <nav className="flex-shrink-0 grid grid-cols-3 border-t border-border bg-card pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      {TABS.map(({ id, icon: Icon, key }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`relative flex min-h-14 flex-col items-center justify-center gap-1 ${
            active === id ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span className="relative">
            <Icon className="h-5 w-5" />
            {id === 'cart' && cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {cartCount}
              </span>
            )}
          </span>
          <span className="text-[10px]">{t(key)}</span>
        </button>
      ))}
    </nav>
  );
}
