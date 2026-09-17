import { useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { SegmentedControl, cn } from '@mockups/ui';
import {
  OFFERS,
  type Offer,
  type OfferLevel,
} from '../data/offers';
import {
  OfferIconChip,
  OfferMetaChips,
  SchemeProgressBar,
  SlabTable,
} from '../components/OfferBits';
import { OfferDetailSheet } from '../sheets/OfferDetailSheet';

/* Offers & Schemes — every running scheme from the retailer's sellers, per the
   ONDC eB2B offer catalog (/on_search offers[]) + retailer-specific
   scheme_progress (P2P /on_search). Split by the PRD framework's levels:

     Primary   — QPS + value slabs: price you buy at → product list & cart
     Secondary — BOGO, freebies, off-invoice, combo, loyalty, early-pay →
                 applied on the cart quote, settled at checkout

   Each card: scheme name + type, seller, eligibility (qualifier), benefit,
   validity, auto/opt-in + stacking meta, and progress toward targets. */

type Filter = 'all' | OfferLevel;

export function OffersSchemesScreen({
  onBack,
  onOpenOffer,
  openOffer = null,
  onCloseOffer,
}: {
  onBack: () => void;
  /** Tap on a scheme card — opens that offer's detail sheet. */
  onOpenOffer: (id: string) => void;
  /** Offer whose detail sheet is open over the list (bottom pop-up). */
  openOffer?: Offer | null;
  onCloseOffer: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');

  const visible = OFFERS.filter((o) => filter === 'all' || o.level === filter);
  const primary = visible.filter((o) => o.level === 'primary');
  const secondary = visible.filter((o) => o.level === 'secondary');

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
          <h1 className="text-base font-semibold leading-tight">Offers &amp; Schemes</h1>
          <p className="text-xs text-foreground-secondary">{OFFERS.length} running from your sellers</p>
        </div>
      </header>

      <div className="border-b border-border bg-card px-3 py-2.5">
        <SegmentedControl
          options={[
            { value: 'all', label: 'All' },
            { value: 'primary', label: 'Primary' },
            { value: 'secondary', label: 'Secondary' },
          ]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {/* what primary/secondary means — one glanceable explainer */}
        <div className="flex gap-2.5 rounded-lg border border-info-border bg-info-subtle p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info-foreground" />
          <p className="text-xs leading-relaxed text-info-foreground">
            <span className="font-semibold">Primary schemes</span> set the price you buy at
            (quantity &amp; value slabs) — shown on the product list and in your cart.{' '}
            <span className="font-semibold">Secondary schemes</span> (free goods, off-invoice,
            combos, rebates) apply on the cart and settle at checkout.
          </p>
        </div>

        {primary.length > 0 && (
          <Section label="Primary — your buying price" sub="Applied on the product list & cart">
            {primary.map((o) => (
              <OfferCard key={o.id} offer={o} onOpen={() => onOpenOffer(o.id)} />
            ))}
          </Section>
        )}

        {secondary.length > 0 && (
          <Section label="Secondary — cart & checkout benefits" sub="Applied on the order quote, settled at checkout">
            {secondary.map((o) => (
              <OfferCard key={o.id} offer={o} onOpen={() => onOpenOffer(o.id)} />
            ))}
          </Section>
        )}
      </div>

      {/* one scheme in full — bottom pop-up, same shell as the Discounts sheet */}
      <OfferDetailSheet offer={openOffer} onClose={onCloseOffer} />
    </div>
  );
}

function Section({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 px-1">
        <h2 className="text-sm font-semibold text-foreground">{label}</h2>
        <p className="text-xs text-foreground-secondary">{sub}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      {/* tap → this offer's own review page */}
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 text-left active:scale-[0.99]">
        <OfferIconChip offer={offer} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">{offer.title}</span>
          <span className="block text-xs text-foreground-secondary">
            {offer.framework} · {offer.seller}
          </span>
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-foreground-secondary" />
      </button>

      {/* benefit + eligibility — always visible, per the PRD's PDP/PLP rule
          (name, eligibility, period, savings example) */}
      <div className="mt-2.5 space-y-1 text-xs">
        <Row k="Benefit" v={offer.benefit} highlight />
        <Row k="Eligibility" v={offer.eligibility} />
        <Row k="Valid" v={offer.period} />
      </div>

      {offer.slabs && (
        <div className="mt-2.5">
          <SlabTable offer={offer} />
        </div>
      )}

      {offer.progress && (
        <div className="mt-2.5">
          <SchemeProgressBar progress={offer.progress} />
        </div>
      )}

      <div className="mt-2.5">
        <OfferMetaChips offer={offer} />
      </div>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-foreground-secondary">{k}</span>
      <span className={cn('min-w-0 flex-1', highlight ? 'font-medium text-success-foreground' : 'text-foreground')}>
        {v}
      </span>
    </div>
  );
}
