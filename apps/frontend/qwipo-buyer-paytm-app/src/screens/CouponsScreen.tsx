import { useMemo, useState } from 'react';
import { BadgePercent, Check, ChevronLeft, Plus } from 'lucide-react';
import { Button, Card, Input } from '@mockups/ui';
import { OFFERS, resolveOffer, type ResolvedOffer } from '../data/coupons';
import { buildCart } from '../data/cart';

/* Apply Coupon — enter a code, or work down the Offers & schemes list.
   Each card carries its own action, because the offers don't all behave the
   same way:

     • a seller's scheme applies itself once the cart qualifies, so the card
       reports "Applied automatically" and there is nothing to tap;
     • a scheme the cart is short of says exactly what's missing and offers
       to add it;
     • a coupon is the buyer's choice, so it shows Apply, and reads "Applied"
       once taken. One coupon at a time — applying a second replaces the first.

   States are derived from the cart, not stored on the fixture, so the
   shortfall on screen always matches the quantities in the cart. */
export function CouponsScreen({ onBack, onApply }: { onBack: () => void; onApply: () => void }) {
  const cart = useMemo(() => buildCart(), []);
  const [code, setCode] = useState('');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  /** Units of a product in the cart, ignoring lines the seller gave free. */
  const qtyOf = (productId: string) =>
    cart.sellers.reduce(
      (n, s) => n + s.items.filter((i) => i.product.id === productId && !i.free).reduce((a, i) => a + i.quantity, 0),
      0
    );

  const resolved = OFFERS.map((o) => resolveOffer(o, qtyOf, cart.grandTotal, appliedId));
  const appliedCount = resolved.filter((r) => r.state === 'auto' || r.state === 'applied').length;

  const check = () => {
    const match = resolved.find((r) => r.offer.code.toUpperCase() === code.trim().toUpperCase());
    if (match && match.state === 'available') setAppliedId(match.offer.id);
  };

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Apply Coupon</h1>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto bg-background-subtle p-4">
        {/* code entry */}
        <label htmlFor="coupon-code" className="mb-2 block text-sm font-medium text-foreground">
          Have a coupon code?
        </label>
        <div className="flex gap-2">
          <Input
            id="coupon-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            aria-label="Coupon code"
          />
          <Button variant={code.trim() ? 'primary' : 'secondary'} disabled={!code.trim()} onClick={check}>
            Check
          </Button>
        </div>

        {/* offers */}
        <h2 className="mb-2 mt-5 text-sm font-semibold text-foreground">Offers &amp; schemes</h2>
        <div className="space-y-3">
          {resolved.map((r) => (
            <OfferCard
              key={r.offer.id}
              resolved={r}
              onApplyCoupon={() => setAppliedId(r.offer.id)}
              onAddItems={onBack}
            />
          ))}
        </div>
      </div>

      {/* sticky summary — the Apply action lives on the cards now, so the bar
          just reports the running state and gets the buyer back to the cart */}
      <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
        <div className="min-w-0 text-sm text-foreground-secondary">
          {appliedCount > 0 ? (
            <>
              <span className="font-semibold text-foreground">{appliedCount}</span>{' '}
              {appliedCount === 1 ? 'offer applied' : 'offers applied'}
            </>
          ) : (
            'No offers applied yet'
          )}
        </div>
        <Button className="px-8" onClick={onApply}>
          Done
        </Button>
      </div>
    </div>
  );
}

/* One card for every offer. The headline is a single sentence built from three
   pieces — the scheme name in quotes, the benefit, and what it applies to —
   so a long combo rule wraps as prose instead of as a stack of labels. */
function OfferCard({
  resolved,
  onApplyCoupon,
  onAddItems,
}: {
  resolved: ResolvedOffer;
  onApplyCoupon: () => void;
  onAddItems: () => void;
}) {
  const { offer, state, requirement } = resolved;
  const done = state === 'auto' || state === 'applied';

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <BadgePercent className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            {offer.label && <span className="font-medium text-primary">“{offer.label}” </span>}
            <span className="font-semibold text-foreground">{offer.benefit}</span>{' '}
            <span className="font-medium text-primary">{offer.scope}</span>
          </p>
          <p className="mt-1 text-xs text-foreground-secondary">Applicable only for eligible products</p>
          {requirement && <p className="mt-1 text-xs font-medium text-warning-foreground">{requirement}</p>}
        </div>
      </div>

      {/* action — centred under the copy, one per state */}
      <div className="mt-3 flex justify-center">
        {done ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-success-subtle px-3 py-1.5 text-xs font-semibold text-success-foreground">
            <Check className="h-3.5 w-3.5" />
            {state === 'auto' ? 'Applied automatically' : 'Applied'}
          </span>
        ) : state === 'needs-items' ? (
          <Button className="px-8" onClick={onAddItems}>
            <Plus className="h-4 w-4" />
            Add Items
          </Button>
        ) : (
          <Button className="px-10" disabled={state === 'locked'} onClick={onApplyCoupon}>
            Apply
          </Button>
        )}
      </div>
    </Card>
  );
}
