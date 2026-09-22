import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Tag, Truck, ShoppingCart } from 'lucide-react';
import { Button, SegmentedControl, EmptyState } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { buildCart, type CartSeller } from '../data/cart';
import { useEmptyable } from '../review/demoState';

/* Cart Summary — one card per seller (no distributor/wholesaler grouping).
   Each card leads with a plain-language status (free / paid / below minimum) so
   a retailer can see at a glance which sellers are ready to check out. Data is
   self-contained (the Shop add-to-cart flow is owned by another dev). */

export function CartScreen({
  onBack,
  onCheckout,
  onViewItems,
  onAddMore,
  onOpenCoupons,
}: {
  onBack: () => void;
  onCheckout: () => void;
  onViewItems: (sellerId: string) => void;
  onAddMore: (sellerId: string) => void;
  onOpenCoupons: () => void;
}) {
  const cart = useMemo(() => buildCart(), []);
  const { grandTotal, totalItems, anyBelow } = cart;
  const sellers = useEmptyable(cart.sellers);
  const deliveryFee = sellers.reduce((n, s) => n + s.deliveryFee, 0);

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
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<ShoppingCart strokeWidth={1.75} />}
            title="Your cart is empty"
            description="Add products from a distributor or wholesaler to see them here."
            action={<Button onClick={() => onAddMore('')}>Browse products</Button>}
          />
        </div>
      ) : (
        <>
          <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
            {/* Apply coupon — first card in the list, so the offers are seen
                before the buyer starts reading totals. */}
            <button
              onClick={onOpenCoupons}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm active:scale-[0.99]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <Tag className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">Apply coupon</span>
                <span className="block text-xs text-foreground-secondary">
                  Offers available — tap to view &amp; apply
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-foreground-secondary" />
            </button>

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
                <div className={deliveryFee > 0 ? 'text-xs text-foreground-secondary' : 'text-xs text-success-foreground'}>
                  {deliveryFee > 0 ? `+ ${formatInr(deliveryFee)} delivery fee` : 'Free delivery'}
                </div>
              </div>
              <Button className="px-8" onClick={onCheckout}>
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
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="text-sm text-foreground">
              Total: <span className="font-bold tabular-nums">{formatInr(seller.subtotal)}</span>
            </div>
            {seller.savings > 0 && (
              <span className="text-xs font-medium text-success-foreground">
                You save {formatInr(seller.savings)}
              </span>
            )}
          </div>
        </div>

        {/* delivery pill — driven by the fee, not the status, so a seller
            charging nothing reads "Free delivery" and matches what the
            totals bar adds up. */}
        <div className="mt-2.5">
          {seller.deliveryFee === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1 text-xs font-medium text-success-foreground">
              <Truck className="h-3.5 w-3.5" /> Free delivery
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground-secondary">
              <Truck className="h-3.5 w-3.5" /> Delivery {formatInr(seller.deliveryFee)}
            </span>
          )}
        </div>

        {/* item thumbnail rail */}
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {shown.map((item, i) => (
            <div key={`${item.product.id}-${i}`} className="flex w-16 shrink-0 flex-col items-center">
              <div className="relative grid h-16 w-16 place-items-center rounded-lg border border-border bg-card text-2xl">
                {item.product.image}
                {item.free && (
                  <span className="absolute -top-1.5 rounded-full bg-success px-1.5 py-0.5 text-[10px] font-bold text-white">
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

        {/* delivery window — beat day + tomorrow options */}
        <div className="mt-3">
          <div className="mb-1.5 text-xs text-foreground-secondary">Delivery by</div>
          <SegmentedControl
            options={seller.windows.map((w) => ({ value: w, label: w }))}
            value={win}
            onChange={setWin}
          />
        </div>

        {/* actions — same two slots on every card (View items · Add more) */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button fullWidth onClick={onViewItems}>
            View items
          </Button>
          <Button variant="secondary" fullWidth onClick={onAddMore}>
            <Plus size={16} /> Add more
          </Button>
        </div>
      </div>
  );
}
