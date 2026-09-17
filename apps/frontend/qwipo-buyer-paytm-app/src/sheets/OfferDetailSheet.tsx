import { CalendarDays, CheckCircle2, MapPin, ReceiptText } from 'lucide-react';
import { Badge, Sheet } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { Offer } from '../data/offers';
import {
  OFFER_ICON,
  OFFER_TINT,
  OfferMetaChips,
  SchemeProgressBar,
  SlabTable,
} from '../components/OfferBits';

/* Offer Detail sheet — one scheme in full, opened as a bottom pop-up from the
   Offers & Schemes list (and anywhere else a scheme is tapped). Same shell as
   the product Discounts sheet, so offers behave one way across the app.
   Everything the ONDC offer object carries: what you get (benefit + worked
   example), who qualifies, when, slab tiers / scheme progress where present,
   how the offer lands on the bill, and where in the app the retailer meets it. */

export function OfferDetailSheet({
  offer,
  onClose,
}: {
  offer: Offer | null;
  onClose: () => void;
}) {
  if (!offer) return null;
  const Icon = OFFER_ICON[offer.type];

  return (
    <Sheet
      open
      onClose={onClose}
      icon={<Icon className="h-5 w-5" />}
      iconClassName={OFFER_TINT[offer.type]}
      title={offer.title}
      subtitle={`${offer.framework} · ${offer.seller}`}
    >
      <div className="space-y-3">
        {/* identity — level + ONDC type code + auto/stacking chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={offer.level === 'primary' ? 'info' : 'warning'}>
            {offer.level === 'primary' ? 'Primary scheme' : 'Secondary scheme'}
          </Badge>
          {offer.specRef !== '—' && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground-secondary">
              {offer.type} · {offer.specRef}
            </span>
          )}
        </div>
        <OfferMetaChips offer={offer} />

        {/* what you get — benefit + worked example */}
        <div className="rounded-lg border border-success-border bg-success-subtle p-3.5">
          <h3 className="text-sm font-semibold text-success-foreground">What you get</h3>
          <p className="mt-1 text-sm font-medium text-success-foreground">{offer.benefit}</p>
          <p className="mt-2 border-t border-success-border pt-2 text-xs leading-relaxed text-foreground">
            <span className="font-semibold">Example: </span>
            {offer.example}
          </p>
        </div>

        {/* who qualifies + when */}
        <div className="rounded-lg border border-border bg-card p-3.5">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Eligibility &amp; validity</h3>
          <div className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground">{offer.eligibility}</span>
          </div>
          <div className="mt-2 flex items-start gap-2.5 text-sm">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground">{offer.period}</span>
          </div>
          {offer.category && (
            <div className="mt-2 text-xs text-foreground-secondary">Applies within: {offer.category}</div>
          )}
        </div>

        {/* slab tiers */}
        {offer.slabs && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Slab tiers</h3>
            <SlabTable offer={offer} />
            <p className="mt-1.5 text-[11px] text-foreground-secondary">
              Each band is published as its own offer — only the band your order lands in applies.
            </p>
          </div>
        )}

        {/* retailer-specific progress */}
        {offer.progress && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Your progress</h3>
            <SchemeProgressBar progress={offer.progress} />
          </div>
        )}

        {/* how it lands on the bill */}
        {offer.quote && (
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ReceiptText className="h-4 w-4 text-foreground-secondary" /> On your bill
            </h3>
            <div className="flex items-center justify-between gap-2 rounded-md bg-background-subtle px-3 py-2.5 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-foreground">{offer.quote.title}</span>
                <span className="block font-mono text-[10px] text-foreground-secondary">{offer.id}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-success-foreground">
                {offer.quote.freeQty
                  ? `${offer.quote.freeQty} FREE (${formatInr(offer.quote.freeValue ?? 0)})`
                  : `− ${formatInr(Math.abs(offer.quote.amount))}`}
              </span>
            </div>
          </div>
        )}

        {/* where the retailer meets it */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Where it appears</h3>
          <div className="space-y-1.5">
            {offer.surfaces.map((s) => (
              <div key={s} className="flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
