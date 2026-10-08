import type { ComponentType } from 'react';
import { ChevronDown, Check, Gift, Layers, Percent, Repeat, Tag } from 'lucide-react';
import { Sheet, cn, EmptyState } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { productById, priceSlabsFor } from '../data/products';
import { OFFERS as ALL_OFFERS, resolveOffer } from '../data/coupons';
import { tcplOfferText, tcplSchemeFor } from '../data/tcpl';

/* Offer & Schemes sheet — opened from a product card's "Discounts" button, the
   "visit a SKU, see what offer applies to it" moment. Shows the quantity
   price-slab (margin + unit price per case band) and this SKU's real schemes,
   read live off the cart — the same Offer data data/coupons.ts feeds into the
   cart and the Apply Offer page, so a card here never shows something the
   cart doesn't. A SKU with no scheme says so plainly instead of padding the
   list with generic offers that don't apply to it.

   Tata Consumer Products' products carry a real TCP scheme (see data/tcpl.ts,
   sourced from TCP's own Salesforce export) instead — its real numbers are
   poured into this exact same card shape, not a new one. */

interface CardOffer {
  icon: ComponentType<{ className?: string }>;
  tint: string;
  title: string;
  sub: string;
  detail: string;
  /** Live state, for a scheme sourced from data/coupons.ts — absent on the
   * TCP-detail card, which states its own "once you qualify" caveat inline. */
  state?: 'auto' | 'needs-items';
}

// Icon + tint per scheme label — one small map both the generic schemes below
// and the TCP branch draw from, so a card never invents a new colour.
const ICON: Record<string, ComponentType<{ className?: string }>> = {
  Bogo: Gift,
  Freebie: Gift,
  'Case Bonus': Layers,
  Slab: Percent,
  Discount: Percent,
  Combo: Repeat,
};
const TINT: Record<string, string> = {
  Bogo: 'bg-warning-subtle text-warning-foreground',
  Freebie: 'bg-warning-subtle text-warning-foreground',
  'Case Bonus': 'bg-info-subtle text-info-foreground',
  Slab: 'bg-info-subtle text-info-foreground',
  Discount: 'bg-success-subtle text-success-foreground',
  Combo: 'bg-primary-soft text-primary',
};
const DEFAULT_ICON = Tag;
const DEFAULT_TINT = 'bg-muted text-foreground-secondary';

// Icon + tint per TCP scheme kind — same palette as above, so a TCP card
// never introduces a new colour either.
const TCP_ICON: Record<'slab' | 'bogo' | 'flat', ComponentType<{ className?: string }>> = {
  slab: Layers,
  bogo: Gift,
  flat: Percent,
};
const TCP_TINT: Record<'slab' | 'bogo' | 'flat', string> = {
  slab: 'bg-info-subtle text-info-foreground',
  bogo: 'bg-warning-subtle text-warning-foreground',
  flat: 'bg-primary-soft text-primary',
};

export function DiscountsSheet({
  open,
  onClose,
  productId,
  qty = {},
}: {
  open: boolean;
  onClose: () => void;
  /** Which product's card opened the sheet — picks its real scheme(s), if any. */
  productId?: string | null;
  /** Live cart quantities, so a scheme's card can say "Applied automatically"
   * or "Add N more units" instead of a static description. */
  qty?: Record<string, number>;
}) {
  const slabs = priceSlabsFor(productId);
  const tcpScheme = productId ? tcplSchemeFor(productId) : undefined;
  const product = productId ? productById(productId) : undefined;
  const qtyOf = (id: string) => qty[id] ?? 0;

  // Real SKU data poured into the same {icon, title, sub, detail} shape every
  // card here uses — one card component, no separate one per source.
  const offers: CardOffer[] = tcpScheme
    ? (() => {
        const t = tcplOfferText(tcpScheme, product?.shortName ?? 'this product');
        return [
          {
            icon: TCP_ICON[tcpScheme.kind],
            tint: TCP_TINT[tcpScheme.kind],
            title: t.title,
            sub: t.sub,
            detail: `${t.save} — ${t.detail}`,
          },
        ];
      })()
    : ALL_OFFERS.filter((o) => o.needs?.some((n) => n.productId === productId)).map((o) => {
        const r = resolveOffer(o, qtyOf, 0, null);
        return {
          icon: (o.label && ICON[o.label]) || DEFAULT_ICON,
          tint: (o.label && TINT[o.label]) || DEFAULT_TINT,
          title: o.benefit,
          sub: o.scope,
          detail:
            r.state === 'auto'
              ? 'Applied automatically — already active on this order.'
              : (r.requirement ?? 'Applies automatically once the cart qualifies.'),
          state: r.state === 'auto' ? 'auto' : 'needs-items',
        };
      });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<Percent size={18} />}
      title="Offer & Schemes"
      subtitle="Please review the following before proceeding"
      /* Every SKU opens the same size sheet, whatever it has to show: a floor
         of 40% so a lone offer doesn't produce a stub, a ceiling of 70% so a
         stacked SKU doesn't swallow the screen. Past that the body scrolls,
         expanded accordions included — Sheet's body is the scroller. */
      className="min-h-[40%] max-h-[70%]"
    >
      {/* quantity price slab — always the top section, and dropped entirely
          on a SKU the distributor rates at one flat price */}
      {slabs.length > 0 && (
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Quantity Price Slab</h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-3 bg-muted px-3 py-2.5 text-xs font-medium text-foreground-secondary">
            <span>Quantity</span>
            <span>Margin %</span>
            <span className="text-right">Unit Price</span>
          </div>
          {slabs.map((s) => (
            <div
              key={s.qty}
              className="grid grid-cols-3 items-center border-t border-border px-3 py-3.5 text-sm"
            >
              <span className="font-medium text-foreground">{s.qty}</span>
              <span className="font-semibold text-success-foreground">{s.margin} %</span>
              <span className="text-right font-bold tabular-nums text-foreground">{formatInrExact(s.price)}</span>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* this SKU's own offers — not a generic list, so an item with nothing
          running says that plainly rather than padding the sheet */}
      <section className={slabs.length > 0 ? 'mt-5' : undefined}>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          {slabs.length > 0 ? 'Other Offers' : 'Offers'}
        </h3>
        {offers.length === 0 ? (
          <EmptyState
            icon={<Tag strokeWidth={1.75} />}
            title="No offers on this item"
            description="There's no running scheme on this product right now."
          />
        ) : (
          <div className="space-y-3">
            {offers.map((o) => (
              <details
                key={o.title}
                className="group rounded-lg border border-border bg-card [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', o.tint)}>
                    <o.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{o.title}</span>
                    <span className="block text-xs text-foreground-secondary">{o.sub}</span>
                  </span>
                  {o.state === 'auto' && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-success-subtle px-2 py-1 text-2xs font-semibold text-success-foreground">
                      <Check className="h-3 w-3" /> Applied
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 shrink-0 text-foreground-secondary transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-border p-3 text-sm text-foreground-secondary">{o.detail}</div>
              </details>
            ))}
          </div>
        )}
      </section>
    </Sheet>
  );
}
