import { useEffect, useState } from 'react';
import { ChevronLeft, Plus, Truck, X, ShoppingCart } from 'lucide-react';
import { Button, EmptyState } from '@mockups/ui';
import { ProductImage, QtyPill, formatInr } from '@mockups/components';
import { itemWeight, type CartSeller } from '../data/cart';
import { PriceChangeBanner, PriceChangeTag } from '../components/PriceChange';
import { useEmptyable } from '../review/demoState';

const kg = (n: number) => `${Number(n.toFixed(2))} kg`;

/* Cart · View Items — the per-seller line list reached from a Cart Summary
   card's "View items". Edit quantities or remove lines; tapping a line opens
   the selling-units sheet (screen 20). Local item state keeps the mock
   interactive without touching the Shop add-to-cart flow.

   Lines the offer added for free are read-only — see `remove`. */
export function ViewItemsScreen({
  seller,
  onBack,
  onAddMore,
  onItemTap,
}: {
  seller: CartSeller;
  onBack: () => void;
  onAddMore: () => void;
  onItemTap: (productId: string) => void;
}) {
  const [rawItems, setItems] = useState(seller.items);
  // The buyer's own removals (via `remove` below) live only in this local
  // state — but if the underlying cart changes seller.items while this
  // screen stays mounted (e.g. a scheme's free line appears because a
  // quantity changed elsewhere), pick that up too, instead of showing a
  // stale snapshot from whenever the screen first opened.
  useEffect(() => setItems(seller.items), [seller.items]);
  // Totals derive from this too, so the empty demo zeroes them out as well.
  const items = useEmptyable(rawItems);

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const savings = items.reduce(
    (s, i) => s + (i.free ? 0 : Math.max(0, (i.product.mrp - i.product.price) * i.quantity)),
    0
  );
  const met = subtotal >= seller.mov;
  const remaining = Math.max(0, seller.mov - subtotal);
  // MOW — recomputed live from the remaining items.
  const weight = items.reduce((s, i) => s + itemWeight(i), 0);
  const weightMet = seller.mow === 0 || weight >= seller.mow;
  const weightRemaining = Math.max(0, seller.mow - weight);

  // Same summary the Cart Summary shows, scoped to this seller's lines — so
  // the per-product deltas and the net effect sit on one screen.
  const moved = items.filter((i) => !!i.priceDelta);
  const priceChanges = {
    changed: moved.length,
    up: moved.filter((i) => (i.priceDelta ?? 0) > 0).length,
    down: moved.filter((i) => (i.priceDelta ?? 0) < 0).length,
    net: moved.reduce((n, i) => n + (i.lineDelta ?? 0), 0),
  };

  /* A free line belongs to the paid line that earned it — the buyer never put
     it there, so they can't take it away either. Removing the paid units takes
     the offer's free units with them. */
  const remove = (index: number) =>
    setItems((list) => {
      const target = list[index];
      if (!target || target.free) return list;
      return list.filter(
        (it, i) => i !== index && !(it.free && it.product.id === target.product.id)
      );
    });

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">View items</h1>
      </header>

      {/* seller summary */}
      <div className="flex items-start justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs text-foreground-secondary">Buying from</div>
          <div className="truncate text-sm font-semibold text-foreground">{seller.name}</div>
          <div className="text-xs text-foreground-secondary">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="text-sm text-foreground">
            Total: <span className="font-bold tabular-nums">{formatInr(subtotal)}</span>
          </div>
          {savings > 0 && (
            <span className="text-xs font-medium text-success-foreground">You save {formatInr(savings)}</span>
          )}
          <Button size="sm" variant="secondary" onClick={onAddMore}>
            <Plus size={14} /> Add more
          </Button>
        </div>
      </div>

      {/* below minimum-order-value strip */}
      {items.length > 0 && !met && (
        <div className="flex items-center gap-1.5 border-b border-border bg-warning-subtle px-4 py-2 text-xs text-warning-foreground">
          <Truck className="h-3.5 w-3.5 shrink-0" />
          <span>
            Add <strong>{formatInr(remaining)}</strong> to reach the {formatInr(seller.mov)} minimum order value
          </span>
        </div>
      )}

      {/* below minimum-order-weight strip */}
      {items.length > 0 && !weightMet && (
        <div className="flex items-center gap-1.5 border-b border-border bg-warning-subtle px-4 py-2 text-xs text-warning-foreground">
          <Truck className="h-3.5 w-3.5 shrink-0" />
          <span>
            Add <strong>{kg(weightRemaining)}</strong> to reach the {kg(seller.mow)} minimum order weight
          </span>
        </div>
      )}

      {/* item list */}
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        <PriceChangeBanner summary={priceChanges} />
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart strokeWidth={1.75} />}
            title="No items from this seller"
            description="Everything you added from this seller has been removed."
            action={<Button onClick={onAddMore}>Add more items</Button>}
          />
        ) : (
          items.map((item, idx) => (
            <div
              key={`${item.product.id}-${idx}`}
              className="relative flex gap-3 rounded-lg border border-border bg-card p-3 shadow-sm"
            >
              {/* a free line has no controls at all — it isn't the buyer's to
                  change, so there is nothing here to tap */}
              {!item.free && (
                <button
                  onClick={() => remove(idx)}
                  aria-label={`Remove ${item.product.shortName}`}
                  className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-muted text-foreground-secondary active:scale-[0.98]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {item.free ? (
                <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card text-2xl">
                  <ProductImage image={item.product.image} alt={item.product.name} />
                  <span className="absolute inset-x-0 top-0 bg-success py-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                    Free
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => onItemTap(item.product.id)}
                  aria-label={`Edit ${item.product.shortName}`}
                  className="relative grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-border bg-card text-2xl active:scale-[0.98]"
                >
                  <ProductImage image={item.product.image} alt={item.product.name} />
                </button>
              )}

              <div className="min-w-0 flex-1">
                {item.free ? (
                  <div className="truncate text-sm font-medium text-foreground">
                    {item.product.shortName}
                  </div>
                ) : (
                  <button
                    onClick={() => onItemTap(item.product.id)}
                    className="block truncate pr-6 text-left text-sm font-medium text-foreground"
                  >
                    {item.product.shortName}
                  </button>
                )}
                <div className="mt-1 flex items-center gap-2">
                  {item.free ? (
                    <span className="text-xs font-semibold text-success-foreground">Free item</span>
                  ) : (
                    <>
                      {item.product.mrp > item.product.price && (
                        <span className="text-xs text-foreground-secondary">
                          MRP{' '}
                          <span className="tabular-nums line-through">
                            {formatInr(item.product.mrp)}
                          </span>
                        </span>
                      )}
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatInr(item.product.price)}
                      </span>
                    </>
                  )}
                </div>
                {/* what this line's unit price did since it was added */}
                <PriceChangeTag
                  className="mt-1"
                  priceWhenAdded={item.priceWhenAdded}
                  delta={item.priceDelta}
                />
                {/* a Slab/Combo scheme that's live on this line — the ₹
                    amount, not just the % label, so it's the same thing the
                    total actually reflects */}
                {item.offerTags?.map((t) => (
                  <div key={t.label} className="mt-1 text-xs font-medium text-success-foreground">
                    {t.label} · −{formatInr(t.amount)}
                  </div>
                ))}
                {/* A paid line carries its count in the control itself, so the
                    separate Qty badge would say it twice. A free line has no
                    control — the buyer didn't put it there — so it keeps the
                    badge as the only place its count appears.

                    Beside the control sits what the line is actually worth:
                    the unit price above answers "what does one cost", and
                    this answers "what am I spending on this product" — the
                    figure the seller's total is built from. */}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  {item.free ? (
                    <>
                      <span className="inline-flex items-center rounded-md bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                        Qty ×{item.quantity}
                      </span>
                      <span className="text-right text-xs text-foreground-secondary">
                        Added by the offer
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-foreground">
                        Total:{' '}
                        <span className="font-bold tabular-nums">{formatInr(item.lineTotal)}</span>
                      </span>
                      <QtyPill
                        qty={item.quantity}
                        onEdit={() => onItemTap(item.product.id)}
                        label={item.product.shortName}
                        className="h-9"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
