import { useState } from 'react';
import { ChevronLeft, Plus, Truck, ShoppingCart } from 'lucide-react';
import { Button, SegmentedControl, EmptyState } from '@mockups/ui';
import { ProductImage, formatInr } from '@mockups/components';
import type { buildCart, CartSeller } from '../data/cart';
import { useEmptyable } from '../review/demoState';
import { BEAT_WINDOW_NOTE, isBeatDay } from '../data/delivery';

/* Cart Summary — one card per seller (no distributor/wholesaler grouping).
   Each card leads with a plain-language status (free / paid / below minimum) so
   a retailer can see at a glance which sellers are ready to check out. Data is
   self-contained (the Shop add-to-cart flow is owned by another dev). */

export function CartScreen({
  cart,
  onBack,
  onCheckout,
  onViewItems,
  onAddMore,
  onItemTap,
}: {
  /** The live cart, built from the same qty the buyer picked on the Product
   * List / Reorder / Wholesaler screens — App.tsx computes it once and shares
   * it here, so this screen and Order Summary can never disagree. */
  cart: ReturnType<typeof buildCart>;
  onBack: () => void;
  onCheckout: () => void;
  onViewItems: (sellerId: string) => void;
  /** The card's seller, so a cross-dock card can ask which one. */
  onAddMore: (seller: CartSeller | null) => void;
  /** Opens one SKU's selling-units sheet from a seller card's strip. */
  onItemTap?: (productId: string) => void;
}) {
  const { grandTotal, totalItems } = cart;
  const sellers = useEmptyable(cart.sellers);
  /* What delivery actually costs: each wholesaler's per-kilo freight, plus
     the flat fee a distributor charges under its free-delivery threshold. */
  const deliveryFee = sellers.reduce((n, s) => n + (s.freight > 0 ? s.freight : s.deliveryFee), 0);

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
            action={<Button onClick={() => onAddMore(null)}>Browse products</Button>}
          />
        </div>
      ) : (
        <>
          <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
            {sellers.map((s) => (
              <SellerCard
                key={s.id}
                seller={s}
                onViewItems={() => onViewItems(s.id)}
                onAddMore={() => onAddMore(s)}
                onItemTap={onItemTap}
              />
            ))}
          </div>

          {/* No blanket warning here: each seller's card now says exactly what
              it is short of, which is the thing the buyer can act on. */}
          <div className="border-t border-border bg-card px-4 py-3 shadow-bar-top">
            <div className="flex items-center justify-between gap-3">
              <div className="leading-tight">
                <div className="text-2xs uppercase tracking-wide text-foreground-secondary">
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

/** Weight the way a seller quotes it: "25 kg", "12.5 kg". */
const kg = (n: number) => `${Number(n.toFixed(2))} kg`;

/* Whole rupees for the minimum bars only. A minimum is a round target, not an
   invoice line — "Add ₹1,520 of ₹2,000" is read at a glance, where
   "₹1,520.00 of ₹2,000.00" is four numbers to wade through. Everything else
   on this screen still shows paise. */
const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/* A minimum this seller has not met yet — value or weight, same shape either
   way. It leads with what is still missing, because that is the number the
   buyer acts on; the threshold follows it for context.

   Amber, not the brand blue: this is a condition standing between the buyer
   and checkout, and blue reads as neutral progress. */
function MinimumBar({
  label,
  have,
  need,
  format,
}: {
  label: string;
  have: number;
  need: number;
  format: (n: number) => string;
}) {
  const pct = Math.min(100, Math.round((have / need) * 100));
  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        {/* Plain black, like the seller name above it: the label only names
            the condition, and the amber beside it is what needs reading. */}
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold text-warning-foreground">Add {format(need - have)}</span>
          <span className="text-foreground-secondary"> of {format(need)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-warning" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SellerCard({
  seller,
  onViewItems,
  onAddMore,
  onItemTap,
}: {
  seller: CartSeller;
  onViewItems: () => void;
  onAddMore: () => void;
  /** Opens one SKU's selling-units sheet, straight from the strip. */
  onItemTap?: (productId: string) => void;
}) {
  const [win, setWin] = useState(seller.windows[0]);

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

        {/* What this seller still needs before they will ship. Only while a
            minimum is unmet — once it's cleared there is no progress left to
            report. Weight only appears for sellers who set one. */}
        {seller.mov > 0 && seller.subtotal < seller.mov && (
          <MinimumBar label="MOV" have={seller.subtotal} need={seller.mov} format={rupees} />
        )}
        {seller.mow > 0 && seller.belowWeight && (
          <MinimumBar label="MOW" have={seller.weight} need={seller.mow} format={kg} />
        )}

        {/* delivery pill — driven by the fee, not the status, so a seller
            charging nothing reads "Free delivery" and matches what the
            totals bar adds up. */}
        <div className="mt-2.5">
          {(seller.freight > 0 ? seller.freight : seller.deliveryFee) === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1 text-xs font-medium text-success-foreground">
              <Truck className="h-3.5 w-3.5" /> Free delivery
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground-secondary">
              <Truck className="h-3.5 w-3.5" /> Delivery{' '}
              {formatInr(seller.freight > 0 ? seller.freight : seller.deliveryFee)}
            </span>
          )}
        </div>

        {/* item thumbnail rail */}
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {seller.items.map((item) => (
            <button
              key={item.product.id}
              onClick={() => onItemTap?.(item.product.id)}
              aria-label={`Edit ${item.product.shortName}`}
              className="flex w-16 shrink-0 flex-col items-center active:scale-[0.98]"
            >
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-border bg-card text-2xl">
                <ProductImage image={item.product.image} alt={item.product.name} />
              </div>
              <div className="mt-1 text-2xs text-foreground-secondary">×{item.quantity}</div>
              <div className="text-2xs font-medium tabular-nums text-foreground">
                {formatInr(item.lineTotal)}
              </div>
            </button>
          ))}
        </div>

        {/* delivery window — beat day + tomorrow options */}
        <div className="mt-3">
          {/* A beat day is the day the van is in the area, not a promise the
              goods arrive that morning — so it carries the window the seller
              actually works to, counted from that day. A "Tomorrow" slot
              means tomorrow and needs nothing said.

              The cross-dock store has no choice to offer: the 3PL collects
              daily and the store packs the same night, so it is tomorrow or
              nothing. A control with one option in it reads as a decision the
              buyer has to make, so the day is simply stated. */}
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="shrink-0 text-xs text-foreground-secondary">Delivery by</span>
            {!seller.cds && isBeatDay(win) && (
              <span className="min-w-0 text-right text-xs font-medium text-foreground-secondary">
                {BEAT_WINDOW_NOTE}
              </span>
            )}
          </div>
          {seller.cds ? (
            <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground">
              {seller.windows[0]}
            </div>
          ) : (
            <SegmentedControl
              options={seller.windows.map((w) => ({ value: w, label: w }))}
              value={win}
              onChange={setWin}
            />
          )}
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
