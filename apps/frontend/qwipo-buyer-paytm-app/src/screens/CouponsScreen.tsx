import { useState, type ReactNode } from 'react';
import { BadgePercent, CalendarClock, Check, ChevronDown, ChevronLeft, Copy, Plus, Search, Tag, X } from 'lucide-react';
import { Button, Card, Chip, EmptyState, Input } from '@mockups/ui';
import { OFFERS, offerDetails, offerSeller, resolveOffer, type ResolvedOffer } from '../data/coupons';
import type { buildCart } from '../data/cart';

/* Apply Coupon — one list, Offers & schemes. Each card carries its own
   action, because the offers don't all behave the same way:

     • a seller's scheme applies itself once the cart qualifies, so the card
       reports "Applied automatically" and there is nothing to tap;
     • a scheme the cart is short of says exactly what's missing and offers
       to add it;
     • a coupon is the buyer's choice, so it shows Apply, and reads "Applied"
       with a Remove beside it once taken — what the buyer turned on, the
       buyer can turn off. One coupon at a time; applying a second replaces
       the first.

   States are derived from the cart, not stored on the fixture, so the
   shortfall on screen always matches the quantities in the cart.

   The list itself is scoped to the cart too: a scheme only shows up once at
   least one of its SKUs has been added — this is "the offers applicable to
   the SKUs currently in my cart", not the full catalog of every scheme any
   seller runs. A whole-order coupon (not tied to a SKU) isn't scoped by
   product, so it uses cart value instead: it stays off the list until the
   cart is close to (within COUPON_NEAR_MISS) or past its minimum — a coupon
   ₹4,000 out of reach isn't "applicable", so it doesn't clutter the list
   with a permanently-locked card. */
const COUPON_NEAR_MISS = 200;
export function CouponsScreen({
  cart,
  onBack,
  onApply,
}: {
  /** The live cart App.tsx built from the buyer's actual picked quantities. */
  cart: ReturnType<typeof buildCart>;
  onBack: () => void;
  onApply: () => void;
}) {
  const [appliedId, setAppliedId] = useState<string | null>(null);
  /** null = the All chip. Otherwise a seller name. */
  const [sellerFilter, setSellerFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  /** Units of a product in the cart, ignoring lines the seller gave free. */
  const qtyOf = (productId: string) =>
    cart.sellers.reduce(
      (n, s) => n + s.items.filter((i) => i.product.id === productId && !i.free).reduce((a, i) => a + i.quantity, 0),
      0
    );

  // Scoped to the cart: a scheme (`needs`) only shows once at least one of
  // its SKUs is in the cart; a whole-order coupon shows once the cart is
  // within reach of its minimum (or the buyer already applied it — Remove
  // has to stay reachable even if the total dips back below afterwards).
  const relevant = OFFERS.filter((o) => {
    if (o.needs) return o.needs.some((n) => qtyOf(n.productId) > 0);
    if (appliedId === o.id) return true;
    return cart.grandTotal >= (o.minOrder ?? 0) - COUPON_NEAR_MISS;
  });
  const resolved = relevant.map((o) => resolveOffer(o, qtyOf, cart.grandTotal, appliedId));
  const appliedCount = resolved.filter((r) => r.state === 'auto' || r.state === 'applied').length;
  const cartIsEmpty = cart.sellers.length === 0;

  /* Offers split by the seller running them, in the order the cart lists its
     sellers, so the chips read in the same order as the Cart Summary cards.
     A whole-order coupon belongs to no seller, so it sits in its own group
     ahead of them and is left out of the seller chips — filtering by
     "Omkar Enterprises" shouldn't turn up a coupon struck against the order.

     Only sellers that actually have an offer get a chip; one with nothing
     running would filter to an empty list. */
  /* Search runs ahead of the seller split, so the chips and the box compose:
     a query narrows the list, and the chips then narrow it again. Matching
     the headline as well as the code means typing "besan" works when the
     buyer half-remembers the product rather than the code. */
  const q = query.trim().toLowerCase();
  const searched = q
    ? resolved.filter((r) =>
        [r.offer.code, r.offer.label, r.offer.benefit, r.offer.scope]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
    : resolved;

  /* Which seller an offer belongs to is answered by the CART, not the
     catalogue: a wholesale SKU's seller is whichever vendor the buyer picked
     for it, which only the cart knows. The static lookup is the fallback for
     an offer whose SKU isn't in the cart at all. */
  const sellerOf = (r: (typeof resolved)[number]) => {
    const first = r.offer.needs?.[0]?.productId;
    if (!first) return undefined;
    const holder = cart.sellers.find((s) => s.items.some((i) => i.product.id === first));
    return holder?.name ?? offerSeller(r.offer);
  };

  const bySeller = cart.sellers
    .map((s) => ({ seller: s.name, items: searched.filter((r) => sellerOf(r) === s.name) }))
    .filter((g) => g.items.length > 0);
  const orderWide = searched.filter((r) => !sellerOf(r));

  const groups = sellerFilter
    ? bySeller.filter((g) => g.seller === sellerFilter)
    : [...(orderWide.length ? [{ seller: 'Your order', items: orderWide }] : []), ...bySeller];

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
        {cartIsEmpty ? (
          <EmptyState
            icon={<Tag strokeWidth={1.75} />}
            title="Your cart is empty"
            description="Add products to your cart to see the offers that apply to them."
            action={<Button onClick={onBack}>Browse products</Button>}
          />
        ) : resolved.length === 0 ? (
          <EmptyState
            icon={<Tag strokeWidth={1.75} />}
            title="No offers on these items"
            description="None of the products in your cart have a running scheme right now."
          />
        ) : (
          <>
            {/* code search — sits above the chips and narrows what they then
                filter, so the two work together rather than fighting */}
            <div className="relative mb-2.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search coupon code"
                aria-label="Search coupon code"
                className="pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-muted text-foreground-secondary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* seller filter — All, then every seller in the cart that has an
                offer running. Scrolls sideways rather than wrapping, so the
                row stays one line however many sellers the cart has. */}
            <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
              <Chip selected={sellerFilter === null} onClick={() => setSellerFilter(null)}>
                All
              </Chip>
              {bySeller.map((g) => (
                <Chip
                  key={g.seller}
                  selected={sellerFilter === g.seller}
                  onClick={() => setSellerFilter(g.seller)}
                >
                  {g.seller}
                </Chip>
              ))}
            </div>

            {groups.length === 0 ? (
              <EmptyState
                icon={<Search strokeWidth={1.75} />}
                title="No offers match"
                description={`Nothing here matches “${query}”. Try a different code or clear the search.`}
                action={<Button onClick={() => setQuery('')}>Clear search</Button>}
              />
            ) : null}

            {groups.map((g) => (
              <section key={g.seller} className="mb-4 last:mb-0">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                  {g.seller}
                </h2>
                <div className="space-y-3">
                  {g.items.map((r) => (
                    <OfferCard
                      key={r.offer.id}
                      resolved={r}
                      seller={g.seller}
                      onApplyCoupon={() => setAppliedId(r.offer.id)}
                      onRemoveCoupon={() => setAppliedId(null)}
                      onAddItems={onBack}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
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

/* One card per offer, in two halves.

   The top half is an accordion, the same <details> pattern the product
   list's Discounts sheet uses: collapsed it shows only what the offer is —
   the scheme name, the benefit, what it applies to, and anything still
   missing. Expanded it adds the conditions and the date it runs out, which
   nobody needs while scanning a list.

   The action sits UNDER the accordion, outside <details>, because everything
   after a <summary> is hidden when collapsed — and Apply / Remove / Applied
   has to stay reachable without opening the card first. */
function OfferCard({
  resolved,
  seller,
  onApplyCoupon,
  onRemoveCoupon,
  onAddItems,
}: {
  resolved: ResolvedOffer;
  /** The seller heading this card sits under — repeated on the card itself
   * so it still reads correctly scrolled mid-list, away from its heading. */
  seller: string;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onAddItems: () => void;
}) {
  const { offer, state, requirement } = resolved;
  const details = offerDetails(offer);
  const [copied, setCopied] = useState(false);
  /* Nothing configured beyond the headline and no end date → nothing to open,
     so the card doesn't pretend to be an accordion. */
  const expandable = !!offer.expires || details.length > 0;

  const copyCode = async (e: React.MouseEvent) => {
    // inside <summary>, so stop the click toggling the accordion open
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(offer.code);
    } catch {
      // clipboard blocked (no permission, insecure context) — the code is on
      // screen either way, so say it copied rather than failing loudly
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Card className="overflow-hidden">
      <details className="group [&_summary::-webkit-details-marker]:hidden">
        <summary
          className={`flex list-none items-start gap-2.5 p-3 ${expandable ? 'cursor-pointer' : ''}`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <BadgePercent className="h-4 w-4" />
          </span>

          <span className="min-w-0 flex-1">
            {/* which seller this offer belongs to — same name as the section
                heading above, repeated here so the card still reads correctly
                once you've scrolled past the heading */}
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-foreground-secondary">
              {seller}
            </span>

            {/* the seller's published code — tap to copy */}
            <span
              role="button"
              tabIndex={0}
              onClick={copyCode}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') copyCode(e as unknown as React.MouseEvent);
              }}
              aria-label={`Copy coupon code ${offer.code}`}
              className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded border border-dashed border-primary bg-primary-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary"
            >
              {offer.code}
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </span>

            <span className="block text-sm leading-snug">
              {offer.label && <span className="font-medium text-primary">“{offer.label}” </span>}
              <span className="font-semibold text-foreground">{offer.benefit}</span>{' '}
              <span className="font-medium text-primary">{offer.scope}</span>
            </span>
            {requirement && (
              <span className="mt-1 block text-xs font-medium text-warning-foreground">{requirement}</span>
            )}
          </span>

          {expandable && (
            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-foreground-secondary transition-transform group-open:rotate-180" />
          )}
        </summary>

        {/* what the seller configured for this offer, and nothing else — no
            heading over it, because these are the offer's own details rather
            than a block of terms */}
        <div className="border-t border-border px-3 py-2.5">
          {offer.expires && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-foreground-secondary" />
              Valid till {offer.expires}
            </p>
          )}
          {details.length > 0 && (
            <ul className={offer.expires ? 'mt-2 space-y-1' : 'space-y-1'}>
              {details.map((d) => (
                <li key={d} className="flex gap-1.5 text-xs leading-relaxed text-foreground-secondary">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-border" />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      {/* action — one per state, on its own row so it reads the same whether
          the card above it is open or shut. A scheme the seller applied is
          stated, not offered; a coupon the buyer chose can be taken back off,
          so it carries Remove beside it. */}
      <div className="flex items-center justify-center gap-2 border-t border-border px-3 py-2">
        {state === 'auto' ? (
          <AppliedPill>Applied automatically</AppliedPill>
        ) : state === 'applied' ? (
          <>
            <AppliedPill>Applied</AppliedPill>
            <Button variant="ghost" size="sm" className="text-error-foreground" onClick={onRemoveCoupon}>
              Remove
            </Button>
          </>
        ) : state === 'needs-items' ? (
          <Button size="sm" className="px-8" onClick={onAddItems}>
            <Plus className="h-4 w-4" />
            Add Items
          </Button>
        ) : (
          <Button size="sm" className="px-10" disabled={state === 'locked'} onClick={onApplyCoupon}>
            Apply
          </Button>
        )}
      </div>
    </Card>
  );
}

/** The green "this is on" chip, shared by both applied states. */
function AppliedPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-success-subtle px-2.5 py-1 text-xs font-semibold text-success-foreground">
      <Check className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}
