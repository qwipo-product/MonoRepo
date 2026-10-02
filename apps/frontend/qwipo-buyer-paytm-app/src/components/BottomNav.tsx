import { Home, RotateCcw, Headset, ShoppingCart } from 'lucide-react';
import { TabBar } from '@mockups/ui';
import type { ScreenId } from '../review/screenIndex';

/* Buyer-shell bottom tab bar (Home · Reorder · Contact us · Cart). Shown only
   on root screens; pushed/detail screens carry their own header instead. */
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
    <TabBar
      tabs={[
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'reorder', icon: RotateCcw, label: 'Reorder' },
        { id: 'sub:help', icon: Headset, label: 'Contact us' },
        { id: 'cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
      ]}
      active={active}
      onSelect={onNavigate}
    />
  );
}
