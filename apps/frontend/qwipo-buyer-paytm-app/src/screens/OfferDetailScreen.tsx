import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, MapPin, ReceiptText } from 'lucide-react';
import { Badge, Button, cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { offerNeighbours, type Offer } from '../data/offers';
import {
  OfferIconChip,
  OfferMetaChips,
  SchemeProgressBar,
  SlabTable,
} from '../components/OfferBits';

/* Offer Detail — one full page per scheme, for walking through the offers one
   by one in review. Everything the ONDC offer object carries, laid out:
   what you get (benefit + worked example), who qualifies (qualifier), when
   (validity), the slab tiers / scheme progress where present, how the offer
   lands on the bill (sample quote-breakup line), and where in the app the
   retailer meets it. Prev/next walks the catalog in sidebar order. */

export function OfferDetailScreen({
  offer,
  onBack,
  onOpenOffer,
}: {
  offer: Offer;
  onBack: () => void;
  onOpenOffer: (id: string) => void;
}) {
  const { prev, next } = offerNeighbours(offer.id);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back to all offers"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">{offer.framework}</h1>
          <p className="text-xs text-foreground-secondary">Offers &amp; Schemes · one scheme in detail</p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {/* hero — identity of the scheme */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <OfferIconChip offer={offer} />
            <div className="min-w-0 flex-1">
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
              <h2 className="mt-1.5 text-base font-bold leading-snug text-foreground">{offer.title}</h2>
              <p className="text-xs text-foreground-secondary">{offer.seller}</p>
            </div>
          </div>
          <div className="mt-3">
            <OfferMetaChips offer={offer} />
          </div>
        </div>

        {/* what you get — benefit + worked example */}
        <div className="rounded-lg border border-success-border bg-success-subtle p-4">
          <h3 className="text-sm font-semibold text-success-foreground">What you get</h3>
          <p className="mt-1 text-sm font-medium text-success-foreground">{offer.benefit}</p>
          <p className="mt-2 border-t border-success-border pt-2 text-xs leading-relaxed text-foreground">
            <span className="font-semibold">Example: </span>
            {offer.example}
          </p>
        </div>

        {/* who qualifies + when */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
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
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Slab tiers</h3>
            <SlabTable offer={offer} />
            <p className="mt-1.5 text-[11px] text-foreground-secondary">
              Each band is published as its own offer — only the band your order lands in applies.
            </p>
          </div>
        )}

        {/* retailer-specific progress */}
        {offer.progress && (
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Your progress</h3>
            <SchemeProgressBar progress={offer.progress} />
          </div>
        )}

        {/* how it lands on the bill */}
        {offer.quote && (
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
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
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
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

      {/* prev / next — walk the catalog one offer at a time */}
      <div className="grid grid-cols-2 gap-2 border-t border-border bg-card px-3 py-3 shadow-[var(--shadow-bar-top)]">
        <Button
          variant="secondary"
          fullWidth
          disabled={!prev}
          onClick={() => prev && onOpenOffer(prev.id)}
          className={cn(!prev && 'opacity-40')}
        >
          <ChevronLeft size={16} />
          <span className="truncate">{prev ? prev.menuLabel : 'First offer'}</span>
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={!next}
          onClick={() => next && onOpenOffer(next.id)}
          className={cn(!next && 'opacity-40')}
        >
          <span className="truncate">{next ? next.menuLabel : 'Last offer'}</span>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
