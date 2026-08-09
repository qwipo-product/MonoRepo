import { useMemo, useState } from 'react';
import { ChevronLeft, Plus, Truck } from 'lucide-react';
import { Button, SegmentedControl } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { buildCart, type CartSeller } from '../data/cart';

/* Cart Summary — one card per seller (no distributor/wholesaler grouping).
   Each card leads with a plain-language status (free / paid / below minimum) so
   a retailer can see at a glance which sellers are ready to check out. Data is
   self-contained (the Shop add-to-cart flow is owned by another dev). */

export function CartScreen({
  onBack,
  onCheckout,
  onViewItems,
  onAddMore,
}: {
  onBack: () => void;
  onCheckout: () => void;
  onViewItems: (sellerId: string) => void;
  onAddMore: (sellerId: string) => void;
}) {
  const { sellers, grandTotal, totalItems, anyBelow } = useMemo(() => buildCart(), []);

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
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">Cart Summary</h1>
          {sellers.length > 0 && (
            <p className="text-xs text-foreground-secondary">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} · {sellers.length}{' '}
              {sellers.length === 1 ? 'seller' : 'sellers'}
            </p>
          )}
        </div>
      </header>

      {sellers.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle p-8 text-center">
          <div>
            <div className="text-4xl">🛒</div>
            <div className="mt-2 text-base font-semibold text-foreground">Your cart is empty</div>
            <div className="mt-1 text-sm text-foreground-secondary">Add products to see them here.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
            {sellers.map((s) => (
              <SellerCard
                key={s.id}
                seller={s}
                onViewItems={() => onViewItems(s.id)}
                onAddMore={() => onAddMore(s.id)}
              />
            ))}
          </div>

          <div className="border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
            {anyBelow && (
              <p className="mb-2 text-center text-xs text-warning-foreground">
                Meet each seller’s minimum order to check out.
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-wide text-foreground-secondary">
                  Total Cart Value
                </div>
                <div className="text-lg font-bold tabular-nums">{formatInr(grandTotal)}</div>
              </div>
              <Button className="px-8" disabled={anyBelow} onClick={onCheckout}>
                Checkout
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SellerCard({
  seller,
  onViewItems,
  onAddMore,
}: {
  seller: CartSeller;
  onViewItems: () => void;
  onAddMore: () => void;
}) {
  const [win, setWin] = useState(seller.windows[0]);
  const CAP = 3;
  const shown = seller.items.slice(0, CAP);
  const extra = seller.items.length - shown.length;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
        {/* seller + total */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-foreground-secondary">Buying from</div>
            <div className="truncate text-sm font-semibold text-foreground">{seller.name}</div>
            <div className="text-xs text-foreground-secondary">
              {seller.items.length} {seller.items.length === 1 ? 'item' : 'items'}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-wide text-foreground-secondary">Total</div>
            <div className="text-lg font-bold tabular-nums text-foreground">{formatInr(seller.subtotal)}</div>
            {seller.savings > 0 && (
              <div className="text-xs font-medium text-success-foreground">
                You save {formatInr(seller.savings)}
              </div>
            )}
          </div>
        </div>

        {/* delivery pill OR below-minimum progress */}
        {seller.status === 'below' ? (
          <div className="mt-2.5 rounded-lg bg-warning-subtle p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-semibold text-warning-foreground">
                Add {formatInr(seller.unlockRemaining)} to unlock checkout
              </div>
              <div className="shrink-0 text-[11px] tabular-nums text-warning-foreground">
                {formatInr(seller.subtotal)} / {formatInr(seller.mov)}
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-warning-border">
              <div className="h-full rounded-full bg-warning" style={{ width: `${seller.progress}%` }} />
            </div>
            <div className="mt-1.5 text-[11px] text-foreground-secondary">
              Minimum order for this supplier is {formatInr(seller.mov)}
            </div>
          </div>
        ) : (
          <div className="mt-2.5">
            {seller.status === 'free' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1 text-xs font-medium text-success-foreground">
                <Truck className="h-3.5 w-3.5" /> Free delivery
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground-secondary">
                <Truck className="h-3.5 w-3.5" /> Delivery {formatInr(seller.deliveryFee)}
              </span>
            )}
          </div>
        )}

        {/* item thumbnail rail */}
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {shown.map((item, i) => (
            <div key={`${item.product.id}-${i}`} className="flex w-16 shrink-0 flex-col items-center">
              <div className="relative grid h-16 w-16 place-items-center rounded-lg border border-border bg-card text-2xl">
                {item.product.image}
                {item.free && (
                  <span className="absolute -top-1.5 rounded-full bg-success px-1.5 py-0.5 text-[9px] font-bold text-white">
                    FREE
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-foreground-secondary">×{item.quantity}</div>
              <div className="text-[11px] font-medium tabular-nums text-foreground">
                {formatInr(item.lineTotal)}
              </div>
            </div>
          ))}
          {extra > 0 && (
            <button
              onClick={onViewItems}
              className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-dashed border-primary bg-primary-soft text-xs font-semibold text-primary active:scale-[0.98]"
            >
              +{extra} more
            </button>
          )}
        </div>

        {/* delivery window — hidden while blocked below minimum */}
        {seller.status !== 'below' && (
          <div className="mt-3">
            <div className="mb-1.5 text-xs text-foreground-secondary">Delivery by</div>
            <SegmentedControl
              options={seller.windows.map((w) => ({ value: w, label: w }))}
              value={win}
              onChange={setWin}
            />
          </div>
        )}

        {/* actions — same two slots on every card (View items · Add more).
            Only the below-minimum Add-more takes colour emphasis, in its fixed
            slot, so the buttons never reorder between cards. */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button fullWidth onClick={onViewItems}>
            View items
          </Button>
          <Button
            variant={seller.status === 'below' ? 'warning' : 'secondary'}
            fullWidth
            onClick={onAddMore}
          >
            <Plus size={16} /> Add more
          </Button>
        </div>
      </div>
  );
}
