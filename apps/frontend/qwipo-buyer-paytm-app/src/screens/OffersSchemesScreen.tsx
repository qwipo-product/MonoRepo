import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OFFERS, type Offer } from '../data/offers';
import { OfferIconChip, SchemeProgressBar } from '../components/OfferBits';
import { OfferDetailSheet } from '../sheets/OfferDetailSheet';

/* Offers — every running offer from the retailer's sellers, grouped by
   seller (that's how a kirana owner thinks about them: "what is Sri Sai
   giving me?"). Each card keeps to two lines — what you get, what to buy —
   plus a progress bar when the seller tracks a target. Tap for the detail
   sheet. Framework levels, spec refs and validity live in the backend. */

export function OffersSchemesScreen({
  onBack,
  onOpenOffer,
  openOffer = null,
  onCloseOffer,
}: {
  onBack: () => void;
  /** Tap on an offer card — opens that offer's detail sheet. */
  onOpenOffer: (id: string) => void;
  /** Offer whose detail sheet is open over the list (bottom pop-up). */
  openOffer?: Offer | null;
  onCloseOffer: () => void;
}) {
  const sellers = [...new Set(OFFERS.map((o) => o.seller))];

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
          <h1 className="text-base font-semibold leading-tight">Offers</h1>
          <p className="text-xs text-foreground-secondary">{OFFERS.length} offers from your sellers</p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-3">
        {sellers.map((seller) => (
          <section key={seller}>
            <h2 className="mb-2 px-1 text-sm font-semibold text-foreground">{seller}</h2>
            <div className="space-y-2.5">
              {OFFERS.filter((o) => o.seller === seller).map((o) => (
                <OfferCard key={o.id} offer={o} onOpen={() => onOpenOffer(o.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* one offer in full — bottom pop-up, same shell as the Discounts sheet */}
      <OfferDetailSheet offer={openOffer} onClose={onCloseOffer} />
    </div>
  );
}

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-lg border border-border bg-card p-3 text-left shadow-sm active:scale-[0.99]"
    >
      <span className="flex items-start gap-3">
        <OfferIconChip offer={offer} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">{offer.title}</span>
          <span className="mt-0.5 block text-sm font-medium text-success-foreground">{offer.benefit}</span>
          <span className="mt-0.5 block text-xs text-foreground-secondary">{offer.eligibility}</span>
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-foreground-secondary" />
      </span>

      {offer.progress && (
        <span className="mt-2.5 block">
          <SchemeProgressBar progress={offer.progress} />
        </span>
      )}
    </button>
  );
}
