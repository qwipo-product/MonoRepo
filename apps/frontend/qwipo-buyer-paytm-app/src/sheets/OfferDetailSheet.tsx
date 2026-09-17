import { CheckCircle2 } from 'lucide-react';
import { Sheet } from '@mockups/ui';
import type { Offer } from '../data/offers';
import { OFFER_ICON, OFFER_TINT, SchemeProgressBar, SlabTable } from '../components/OfferBits';

/* Offer Detail sheet — bottom pop-up with just what a retailer needs to know:
   what you get, what to buy to get it, and the price ladder / progress where
   there is one. Offer ids, spec refs, validity windows and the rest of the
   ONDC offer object stay in the backend — it enforces them and only serves
   offers that are live, so the buyer never needs to read them. */

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
      subtitle={offer.seller}
    >
      <div className="space-y-3">
        {/* what you get — the one thing to take away */}
        <div className="rounded-lg bg-success-subtle p-4 text-center">
          <p className="text-base font-bold leading-snug text-success-foreground">{offer.benefit}</p>
        </div>

        {/* what to do to get it */}
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm text-foreground">{offer.eligibility}</span>
        </div>

        {/* the price ladder, when the offer is a slab */}
        {offer.slabs && <SlabTable offer={offer} />}

        {/* how close you are, when the seller tracks it */}
        {offer.progress && <SchemeProgressBar progress={offer.progress} />}

        <p className="pb-1 text-center text-xs text-foreground-secondary">
          {offer.infoOnly
            ? 'Your seller’s salesperson will confirm this with you.'
            : offer.auto
              ? 'Applied automatically in your cart — nothing to do.'
              : 'You can choose this at checkout.'}
        </p>
      </div>
    </Sheet>
  );
}
