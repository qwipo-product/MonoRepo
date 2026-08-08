import { ShoppingCart } from 'lucide-react';

/* Sticky bottom cart summary — total + go-to-cart. Shows when the cart has value. */
export default function CartStrip({ total, onGoToCart }: { total: number; onGoToCart: () => void }) {
  if (total <= 0) return null;
  return (
    <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-card px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="leading-tight">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total cart value</div>
        <div className="text-lg font-bold tabular-nums tracking-tight">₹{total.toLocaleString('en-IN')}</div>
      </div>
      <button onClick={onGoToCart} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]">
        <ShoppingCart className="h-4 w-4" /> Cart
      </button>
    </div>
  );
}
