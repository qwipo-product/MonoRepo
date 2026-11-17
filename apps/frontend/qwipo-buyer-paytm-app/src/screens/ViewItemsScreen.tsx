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
   interactive without touching the Shop add-to-cart flow. */
export function ViewItemsScreen({
  seller,
  onBack,
  onAddMore,
  onAddMoreFrom,
  onItemTap,
}: {
  seller: CartSeller;
  onBack: () => void;
  onAddMore: () => void;
  /** Add more from one named cross-dock distributor, from its own divider. */
  onAddMoreFrom?: (seller: string) => void;
  onItemTap: (productId: string) => void;
}) {
  const [rawItems, setItems] = useState(seller.items);
  // The buyer's own removals (via `remove` below) live only in this local
  // state — but if the underlying cart changes seller.items while this
  // screen stays mounted (e.g. a quantity changes elsewhere), pick that
  // up too, instead of showing a
  // stale snapshot from whenever the screen first opened.
  useEffect(() => setItems(seller.items), [seller.items]);
  // Totals derive from this too, so the empty demo zeroes them out as well.
  const items = useEmptyable(rawItems);

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const savings = items.reduce(
    (s, i) => s + Math.max(0, (i.product.mrp - i.product.price) * i.quantity),
    0
  );
  /* Which seller each line belongs to, and where the list changes hands.
     The cart hands over `groups` already in order, so walking their lengths
     gives both answers without re-grouping the lines here. */
  const groups = seller.groups ?? [];
  const sellerOf = (idx: number): string => {
    let n = 0;
    for (const g of groups) {
      n += g.items.length;
      if (idx < n) return g.seller;
    }
    return seller.name;
  };
  const dividerBefore = (idx: number): boolean => idx === 0 || sellerOf(idx) !== sellerOf(idx - 1);

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

  const remove = (index: number) =>
    setItems((list) => list.filter((_, i) => i !== index));

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
          {/* A cross-dock card has four catalogues behind it, so "Add more"
              sits on each seller's own divider below rather than up here,
              where it could not say which seller it meant. */}
          {!seller.cds && (
            <Button size="sm" variant="secondary" onClick={onAddMore}>
              <Plus size={14} /> Add more
            </Button>
          )}
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
            <div key={`${item.product.id}-${idx}`}>
            {/* On a cross-dock card the lines arrive grouped by seller, so a
                divider goes in wherever the seller changes. The buyer is still
                buying from distributors — the store only consolidates — and
                "Add more" belongs to the seller it sits under. */}
            {seller.cds && dividerBefore(idx) && (
              <div className={`flex items-center justify-between gap-3 ${idx === 0 ? 'pb-2' : 'pb-2 pt-4'}`}>
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                  {sellerOf(idx)}
                </span>
                <Button size="sm" variant="secondary" onClick={() => onAddMoreFrom?.(sellerOf(idx))}>
                  <Plus size={14} /> Add more
                </Button>
              </div>
            )}
            <div
              className="relative flex gap-3 rounded-lg border border-border bg-card p-3 shadow-sm"
            >
              <button
                onClick={() => remove(idx)}
                aria-label={`Remove ${item.product.shortName}`}
                className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-muted text-foreground-secondary active:scale-[0.98]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onItemTap(item.product.id)}
                aria-label={`Edit ${item.product.shortName}`}
                className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-border bg-card text-2xl active:scale-[0.98]"
              >
                <ProductImage image={item.product.image} alt={item.product.name} />
              </button>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => onItemTap(item.product.id)}
                  className="block truncate pr-6 text-left text-sm font-medium text-foreground"
                >
                  {item.product.shortName}
                </button>
                <div className="mt-1 flex items-center gap-2">
                  {item.product.mrp > item.product.price && (
                    <span className="text-xs text-foreground-secondary">
                      MRP <span className="tabular-nums line-through">{formatInr(item.product.mrp)}</span>
                    </span>
                  )}
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatInr(item.product.price)}
                  </span>
                </div>
                <PriceChangeTag
                  className="mt-1"
                  priceWhenAdded={item.priceWhenAdded}
                  delta={item.priceDelta}
                />
                {item.offerTags?.map((t) => (
                  <div key={t.label} className="mt-1 text-xs font-medium text-success-foreground">
                    {t.label} · −{formatInr(t.amount)}
                  </div>
                ))}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground">
                    Total: <span className="font-bold tabular-nums">{formatInr(item.lineTotal)}</span>
                  </span>
                  <QtyPill
                    qty={item.quantity}
                    onEdit={() => onItemTap(item.product.id)}
                    label={item.product.shortName}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
