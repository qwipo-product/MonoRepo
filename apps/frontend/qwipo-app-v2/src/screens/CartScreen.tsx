import { useMemo, useState } from 'react';
import { ChevronLeft, Plus, Truck } from 'lucide-react';
import { Button, cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { buildCart, type CartSeller } from '../data/cart';

/* Cart Summary — one card per seller, grouped "From Distributors" /
   "From Wholesalers". Each card shows the seller's MOV state, a thumbnail rail
   of its items, and a delivery-by radio group. Self-contained mock data (the
   Shop add-to-cart flow is owned by another dev). */
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
  const { sellers, grandTotal, totalItems } = useMemo(() => buildCart(), []);
  const [deliveryIndex, setDeliveryIndex] = useState<Record<string, number>>({});

  const distributors = sellers.filter((s) => s.type === 'distributor');
  const wholesalers = sellers.filter((s) => s.type === 'wholesaler');

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
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-3">
            {distributors.length > 0 && (
              <SellerGroup
                title="From Distributors"
                sellers={distributors}
                deliveryIndex={deliveryIndex}
                onPickDelivery={(id, i) => setDeliveryIndex((prev) => ({ ...prev, [id]: i }))}
                onViewItems={onViewItems}
                onAddMore={onAddMore}
              />
            )}
            {wholesalers.length > 0 && (
              <SellerGroup
                title="From Wholesalers"
                sellers={wholesalers}
                deliveryIndex={deliveryIndex}
                onPickDelivery={(id, i) => setDeliveryIndex((prev) => ({ ...prev, [id]: i }))}
                onViewItems={onViewItems}
                onAddMore={onAddMore}
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-wide text-foreground-secondary">
                Total Cart Value
              </div>
              <div className="text-lg font-bold tabular-nums">{formatInr(grandTotal)}</div>
            </div>
            <Button className="px-8" onClick={onCheckout}>
              Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function SellerGroup({
  title,
  sellers,
  deliveryIndex,
  onPickDelivery,
  onViewItems,
  onAddMore,
}: {
  title: string;
  sellers: CartSeller[];
  deliveryIndex: Record<string, number>;
  onPickDelivery: (id: string, i: number) => void;
  onViewItems: (id: string) => void;
  onAddMore: (id: string) => void;
}) {
  return (
    <section className="space-y-2.5">
      <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">
        {title}
      </div>
      {sellers.map((s) => (
        <SellerCard
          key={s.id}
          seller={s}
          activeIndex={deliveryIndex[s.id] ?? 0}
          onPickDelivery={(i) => onPickDelivery(s.id, i)}
          onViewItems={() => onViewItems(s.id)}
          onAddMore={() => onAddMore(s.id)}
        />
      ))}
    </section>
  );
}

function SellerCard({
  seller,
  activeIndex,
  onPickDelivery,
  onViewItems,
  onAddMore,
}: {
  seller: CartSeller;
  activeIndex: number;
  onPickDelivery: (i: number) => void;
  onViewItems: () => void;
  onAddMore: () => void;
}) {
  const fixed = seller.type === 'wholesaler'; // wholesaler window is fixed

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-foreground-secondary">Buying from</div>
          <div className="truncate text-sm font-semibold text-foreground">{seller.name}</div>
          <div className="text-xs text-foreground-secondary">Total items: {seller.items.length}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm text-foreground">
            Total: <span className="font-bold tabular-nums">{formatInr(seller.subtotal)}</span>
          </div>
          <div className="mt-1 flex flex-col items-end gap-0.5 text-xs">
            {seller.savings > 0 && (
              <span className="text-success-foreground">You save {formatInr(seller.savings)}</span>
            )}
            <span className={seller.deliveryFee > 0 ? 'text-warning-foreground' : 'text-success-foreground'}>
              {seller.deliveryFee > 0 ? `Delivery ${formatInr(seller.deliveryFee)}` : 'Free Delivery'}
            </span>
          </div>
        </div>
      </div>

      {/* MOV requirement */}
      {!seller.met && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-warning-subtle p-2 text-xs text-warning-foreground">
          <Truck className="h-3.5 w-3.5 shrink-0" />
          <span>
            Min. order {formatInr(seller.mov)} — <strong>add {formatInr(seller.remaining)} more</strong>
          </span>
        </div>
      )}

      {/* actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={onAddMore}
          className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" /> Add more
        </button>
        <button
          onClick={onViewItems}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground active:scale-[0.98]"
        >
          View items
        </button>
      </div>

      {/* item thumbnail rail */}
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
        {seller.items.map((item) => (
          <div key={item.product.id} className="flex w-16 shrink-0 flex-col items-center">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-muted text-2xl">
              {item.product.image}
            </div>
            <div className="mt-1 text-[11px] text-foreground-secondary">×{item.quantity}</div>
            <div className="text-[11px] font-medium tabular-nums text-foreground">
              {formatInr(item.lineTotal)}
            </div>
          </div>
        ))}
      </div>

      {/* delivery window */}
      <div className="mt-3">
        <div className="mb-1.5 text-xs text-foreground-secondary">Delivery by</div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Delivery window">
          {seller.windows.map((day, i) => {
            const active = fixed ? i === 0 : i === activeIndex;
            return (
              <button
                key={day}
                role="radio"
                aria-checked={active}
                disabled={fixed}
                onClick={() => !fixed && onPickDelivery(i)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs',
                  active ? 'border-primary bg-primary-soft text-primary' : 'border-border text-foreground-secondary',
                  fixed && 'disabled:opacity-100'
                )}
              >
                <span
                  className={cn(
                    'grid h-3.5 w-3.5 place-items-center rounded-full border',
                    active ? 'border-primary' : 'border-foreground-tertiary'
                  )}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </span>
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
