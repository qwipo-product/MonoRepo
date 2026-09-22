import { Banknote, ChevronLeft, MapPin } from 'lucide-react';
import { Button, InlineMessage } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { buildCart, CartSeller } from '../data/cart';
import { ADDRESSES, DEFAULT_ADDRESS_ID } from '../data/addresses';

/* Order Summary — read-only review before Place Order. One bill card per
   seller (brand · item summary + chosen delivery window), then the overall
   bill and delivery address. Colour is restrained: neutral for data, primary
   reserved for links and the Place Order action. */

const brandOf = (name: string) => name.split(' ')[0];

export function OrderSummaryScreen({
  cart,
  onBack,
  onPlaceOrder,
  onViewItems,
  kycPending = false,
  onCompleteKyc,
}: {
  /** The live cart App.tsx built from the buyer's actual picked quantities. */
  cart: ReturnType<typeof buildCart>;
  onBack: () => void;
  onPlaceOrder: () => void;
  onViewItems: (sellerId: string) => void;
  /** First order waits on account verification. */
  kycPending?: boolean;
  onCompleteKyc?: () => void;
}) {
  const { sellers, grandTotal } = cart;
  const deliveryFee = sellers.reduce((n, s) => n + s.deliveryFee, 0);
  const totalItems = sellers.reduce((n, s) => n + s.items.reduce((a, i) => a + i.quantity, 0), 0);
  const grandSavings = sellers.reduce((n, s) => n + s.savings, 0);
  const toPay = grandTotal + deliveryFee;
  const address = ADDRESSES.find((a) => a.id === DEFAULT_ADDRESS_ID) ?? ADDRESSES[0];

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Order Summary</h1>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {sellers.map((s) => (
          <SellerBill key={s.id} seller={s} onViewItems={() => onViewItems(s.id)} />
        ))}

        {/* Bill details */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Bill details</h2>
          <BillRow label="Total items" value={String(totalItems)} />
          <BillRow label="Item total" value={formatInr(grandTotal)} />
          {grandSavings > 0 && <BillRow label="You save" value={`− ${formatInr(grandSavings)}`} good />}
          <BillRow label="Delivery fee" value={deliveryFee === 0 ? 'Free' : formatInr(deliveryFee)} />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2.5">
            <span className="text-sm font-semibold text-foreground">To pay</span>
            <span className="text-lg font-bold tabular-nums text-foreground">{formatInr(toPay)}</span>
          </div>
        </div>

        {/* Payment mode — COD is the only mode, pre-selected and locked */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Payment mode</h2>
          <div className="flex items-center gap-3 rounded-md border border-primary bg-primary-soft p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card text-primary">
              <Banknote className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Cash on Delivery (COD)</div>
              <div className="text-xs text-foreground-secondary">
                Pay {formatInr(toPay)} in cash when your order is delivered
              </div>
            </div>
            {/* selected radio — filled, since COD is the default and only option */}
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-primary">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          </div>
          <p className="mt-2 text-xs text-foreground-secondary">
            COD is currently the only payment mode. Online payment options are coming soon.
          </p>
        </div>

        {/* Delivery address */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Delivery address</h2>
          <div className="flex gap-2.5">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">{address.title}</div>
              <div className="text-xs text-foreground-secondary">
                {address.locality} – {address.pincode}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
        {kycPending && (
          <InlineMessage
            className="mb-3"
            variant="warning"
            title="Complete KYC to place this order"
            description="Your account needs to be verified before your first order."
            action={
              onCompleteKyc ? (
                <Button size="sm" variant="soft" onClick={onCompleteKyc}>
                  Complete KYC
                </Button>
              ) : undefined
            }
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wide text-foreground-secondary">To pay</div>
            <div className="text-lg font-bold tabular-nums text-foreground">{formatInr(toPay)}</div>
            <div className="text-[11px] font-medium text-primary">Cash on Delivery</div>
          </div>
          <Button className="px-8" disabled={kycPending} onClick={onPlaceOrder}>
            Place order
          </Button>
        </div>
      </div>
    </div>
  );
}

function SellerBill({ seller, onViewItems }: { seller: CartSeller; onViewItems: () => void }) {
  // One fixed-height summary line — brands capped so the card never grows.
  const brands = [...new Set(seller.items.map((i) => brandOf(i.product.shortName)))];
  const CAP = 3;
  const summary =
    brands.length > CAP ? `${brands.slice(0, CAP).join(', ')} +${brands.length - CAP} more` : brands.join(', ');
  const products = `${seller.items.length} ${seller.items.length === 1 ? 'product' : 'products'}`;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{seller.name}</div>
          <div className="text-xs text-foreground-secondary">{products}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm text-foreground">
            <span className="text-foreground-secondary">Total: </span>
            <span className="font-bold tabular-nums">{formatInr(seller.subtotal)}</span>
          </div>
          {seller.savings > 0 && (
            <div className="text-xs font-medium text-success-foreground">
              You save {formatInr(seller.savings)}
            </div>
          )}
        </div>
      </div>

      {/* brand summary — single line, capped */}
      <div className="mt-2.5 flex items-center justify-between gap-3 rounded-md bg-background-subtle p-2.5">
        <span className="min-w-0 truncate text-xs text-foreground">{summary}</span>
        <button
          onClick={onViewItems}
          className="shrink-0 text-sm font-semibold text-primary active:scale-[0.98]"
        >
          View items
        </button>
      </div>

      {/* delivery window */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-sm">
        <span className="text-foreground-secondary">Delivery by</span>
        <span className="font-semibold text-foreground">{seller.windows[0]}</span>
      </div>
    </div>
  );
}

function BillRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-foreground-secondary">{label}</span>
      <span className={good ? 'font-medium tabular-nums text-success-foreground' : 'tabular-nums text-foreground'}>
        {value}
      </span>
    </div>
  );
}
