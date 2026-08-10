import { useState } from 'react';
import { ChevronLeft, Plus, Truck, X } from 'lucide-react';
import { Button } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { itemWeight, type CartSeller } from '../data/cart';

const kg = (n: number) => `${Number(n.toFixed(2))} kg`;

/* Cart · View Items — the per-seller line list reached from a Cart Summary
   card's "View items". Edit quantities or remove lines; tapping a line opens
   the selling-units sheet (screen 20). Local item state keeps the mock
   interactive without touching the Shop add-to-cart flow. */
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
  const [items, setItems] = useState(seller.items);

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

  const remove = (index: number) => setItems((list) => list.filter((_, i) => i !== index));

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
        {items.length === 0 ? (
          <div className="pt-16 text-center">
            <div className="text-4xl">🛒</div>
            <div className="mt-2 text-base font-semibold text-foreground">No items left</div>
            <div className="mt-1 text-sm text-foreground-secondary">
              Everything from this seller has been removed.
            </div>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={`${item.product.id}-${idx}`}
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
                className="relative grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-border bg-card text-2xl active:scale-[0.98]"
              >
                {item.product.image}
                {item.free && (
                  <span className="absolute -top-1.5 rounded-full bg-success px-1.5 py-0.5 text-[10px] font-bold text-white">
                    FREE
                  </span>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <button
                  onClick={() => onItemTap(item.product.id)}
                  className="block truncate pr-6 text-left text-sm font-medium text-foreground"
                >
                  {item.product.shortName}
                </button>
                <div className="mt-1 flex items-center gap-2">
                  {item.free ? (
                    <span className="text-xs font-semibold text-success-foreground">Free item</span>
                  ) : (
                    <>
                      <span className="text-xs tabular-nums text-foreground-secondary line-through">
                        {formatInr(item.product.mrp)}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatInr(item.product.price)}
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-md bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Qty ×{item.quantity}
                  </span>
                  <Button size="sm" onClick={() => onItemTap(item.product.id)}>
                    + Add
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
