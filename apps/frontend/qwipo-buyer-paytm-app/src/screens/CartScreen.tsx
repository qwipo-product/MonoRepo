import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Tag, Truck, ShoppingCart } from 'lucide-react';
import { Button, SegmentedControl, EmptyState, cn } from '@mockups/ui';
import { ProductImage, formatInr } from '@mockups/components';
import type { buildCart, CartSeller } from '../data/cart';
import { useEmptyable } from '../review/demoState';
import { isBeatDay } from '../data/delivery';

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
  onOpenCoupons,
  onItemTap,
}: {
  /** The live cart, built from the same qty the buyer picked on the Product
   * List / Reorder / Wholesaler screens — App.tsx computes it once and shares
   * it here, so this screen and Order Summary can never disagree. */
  cart: ReturnType<typeof buildCart>;
  onBack: () => void;
  onCheckout: () => void;
  onViewItems: (sellerId: string) => void;
  onAddMore: (sellerId: string) => void;
  onOpenCoupons: () => void;
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
                onItemTap={onItemTap}
              />
            ))}
          </div>

          {/* No blanket warning here: each seller's card now says exactly what
              it is short of, which is the thing the buyer can act on. */}
          <div className="border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
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

/** Weight the way a seller quotes it: "25 kg", "12.5 kg". */
const kg = (n: number) => `${Number(n.toFixed(2))} kg`;

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
        {/* The label is the brand blue so the condition is legible at a
            glance; the amber is saved for the number still outstanding. */}
        <span className="font-medium text-primary">{label}</span>
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
          <MinimumBar
            label="Minimum order value"
            have={seller.subtotal}
            need={seller.mov}
            format={formatInr}
          />
        )}
        {seller.mow > 0 && seller.belowWeight && (
          <MinimumBar
            label="Minimum order weight"
            have={seller.weight}
            need={seller.mow}
            format={kg}
          />
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
          {seller.items.map((item, i) => {
            /* A free line was put there by an offer, so there is nothing to
               edit — it stays a picture. Everything else opens its own
               selling-units sheet, which is where quantity is changed. */
            const Tile = item.free ? 'div' : 'button';
            return (
              <Tile
                key={`${item.product.id}-${i}`}
                {...(item.free
                  ? {}
                  : {
                      onClick: () => onItemTap?.(item.product.id),
                      'aria-label': `Edit ${item.product.shortName}`,
                    })}
                className={cn(
                  'flex w-16 shrink-0 flex-col items-center',
                  !item.free && 'active:scale-[0.98]'
                )}
              >
                <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-border bg-card text-2xl">
                  <ProductImage image={item.product.image} alt={item.product.name} />
                  {/* Across the top inside the tile, not hanging off it: the
                      rail scrolls sideways and clipped whatever poked out, so
                      the tag was being sliced. A full-width strip also stops
                      it sitting on top of the product. */}
                  {item.free && (
                    <span className="absolute inset-x-0 top-0 bg-success py-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                      Free
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-foreground-secondary">×{item.quantity}</div>
                <div className="text-[11px] font-medium tabular-nums text-foreground">
                  {formatInr(item.lineTotal)}
                </div>
              </Tile>
            );
          })}
        </div>

        {/* delivery window — beat day + tomorrow options */}
        <div className="mt-3">
          {/* A beat day is the day the van is in the area, not a promise the
              goods arrive that morning — so it carries the window the seller
              actually works to. A "Tomorrow" slot means tomorrow and needs
              nothing said. */}
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs text-foreground-secondary">Delivery by</span>
            {isBeatDay(win) && (
              <span className="shrink-0 text-[11px] font-medium text-foreground-secondary">
                Delivered within 24–48 hrs
              </span>
            )}
          </div>
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
