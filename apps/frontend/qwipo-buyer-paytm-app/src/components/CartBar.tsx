import { Button } from '@mockups/ui';
import { formatInr } from '@mockups/components';

/* The bar that sits under any list of products while the cart has something in
   it: what the cart is worth, where delivery stands, and the way to it.

   It says "Total cart value" rather than a count of items. On a screen full of
   products the number that decides whether to keep shopping is the money, and
   "78 items" was the one figure on the bar that nobody was acting on.

   Lives here because five screens show it and they have to agree. */
export function CartBar({
  count,
  total,
  freight = 0,
  onGoToCart,
}: {
  /** Pieces in the cart. The bar hides itself at zero. */
  count: number;
  total: number;
  /* Delivery across the cart: each wholesale vendor's per-kilo rate over the
     kilos ordered. When there is any, it replaces the free-delivery line —
     that is the figure the buyer is actually going to be charged. */
  freight?: number;
  onGoToCart: () => void;
}) {
  if (count <= 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-bar-top">
      <div className="leading-tight">
        <div className="text-2xs uppercase tracking-wide text-foreground-secondary">
          Total cart value
        </div>
        <div className="text-lg font-bold tabular-nums">{formatInr(total)}</div>
        {freight > 0 ? (
          <div className="text-xs text-foreground-secondary">
            + {formatInr(freight)} delivery fee
          </div>
        ) : (
          <div className={total >= 3000 ? 'text-xs text-success-foreground' : 'text-xs text-foreground-secondary'}>
            {total >= 3000 ? 'Free delivery' : `+ ${formatInr(30)} delivery fee`}
          </div>
        )}
      </div>
      <Button className="px-8" onClick={onGoToCart}>
        Go to cart
      </Button>
    </div>
  );
}
