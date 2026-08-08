import { ShoppingCart } from 'lucide-react';

/* Sticky bottom cart summary — total + go-to-cart. Shows when the cart has value. */
export default function CartStrip({ total, onGoToCart }: { total: number; onGoToCart: () => void }) {
  if (total <= 0) return null;
  return (
    <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-card px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div>
        <div className="text-xs text-muted-foreground">Total cart value</div>
        <div className="text-base font-semibold">₹{total.toLocaleString('en-IN')}</div>
      </div>
      <button onClick={onGoToCart} className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
        <ShoppingCart className="h-4 w-4" /> Cart
      </button>
    </div>
  );
}
