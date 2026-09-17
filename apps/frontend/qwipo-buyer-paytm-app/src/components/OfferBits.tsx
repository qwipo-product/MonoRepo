import type { ComponentType } from 'react';
import { BadgePercent, Boxes, Gift, Layers, PackagePlus, Tag } from 'lucide-react';
import { cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { offerChipLabel, type Offer, type OfferType, type SchemeProgress } from '../data/offers';

/* Shared offer rendering bits — one look for a scheme everywhere it appears
   (Offers & Schemes screen, product Discounts sheet, cart, checkout). */

export const OFFER_ICON: Record<OfferType, ComponentType<{ className?: string }>> = {
  discount: BadgePercent,
  buyXgetY: Gift,
  freebie: PackagePlus,
  slab: Layers,
  combo: Boxes,
};

export const OFFER_TINT: Record<OfferType, string> = {
  discount: 'bg-primary-soft text-primary',
  buyXgetY: 'bg-warning-subtle text-warning-foreground',
  freebie: 'bg-success-subtle text-success-foreground',
  slab: 'bg-info-subtle text-info-foreground',
  combo: 'bg-muted text-foreground',
};

export function OfferIconChip({ offer, size = 'md' }: { offer: Offer; size?: 'sm' | 'md' }) {
  const Icon = OFFER_ICON[offer.type];
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-lg',
        size === 'md' ? 'h-10 w-10' : 'h-8 w-8',
        OFFER_TINT[offer.type]
      )}
    >
      <Icon className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} />
    </span>
  );
}

/** meta chips: auto/opt-in + additive, plus the ONDC type code. */
export function OfferMetaChips({ offer, showType = false }: { offer: Offer; showType?: boolean }) {
  const chip = 'rounded-full px-2 py-0.5 text-[10px] font-semibold';
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showType && (
        <span className={cn(chip, 'bg-muted font-mono text-foreground-secondary')}>
          {offer.type}{offer.specRef !== '—' ? ` · ${offer.specRef}` : ''}
        </span>
      )}
      <span className={cn(chip, offer.auto ? 'bg-success-subtle text-success-foreground' : 'bg-warning-subtle text-warning-foreground')}>
        {offer.auto ? 'Auto-applied' : 'Select at cart'}
      </span>
      <span className={cn(chip, 'bg-muted text-foreground-secondary')}>
        {offer.additive ? 'Stacks with other offers' : 'Best offer applies'}
      </span>
    </div>
  );
}

/** scheme_progress bar — target vs remaining, with tier + valid-till. */
export function SchemeProgressBar({ progress }: { progress: SchemeProgress }) {
  const done = progress.target - progress.remaining;
  const pct = Math.min(100, Math.round((done / progress.target) * 100));
  const fmt = (n: number) => (progress.unit === '₹' ? formatInr(n) : `${n} units`);
  const gold = progress.tier === 'gold';
  return (
    <div className="rounded-lg bg-background-subtle p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-foreground">
          Your progress: {fmt(done)} of {fmt(progress.target)}
        </span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            gold ? 'bg-warning-subtle text-warning-foreground' : 'bg-muted text-foreground-secondary'
          )}
        >
          {progress.tier}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-foreground-secondary">{fmt(progress.remaining)} to go</div>
    </div>
  );
}

/** Slab tier table — one row per published slab offer. */
export function SlabTable({ offer, unitPrice }: { offer: Offer; unitPrice?: number }) {
  if (!offer.slabs) return null;
  const showPrice = unitPrice != null;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className={cn('grid bg-muted px-3 py-2 text-xs font-medium text-foreground-secondary', showPrice ? 'grid-cols-3' : 'grid-cols-2')}>
        <span>Quantity / Value</span>
        <span className={showPrice ? '' : 'text-right'}>Extra Off</span>
        {showPrice && <span className="text-right">Unit Price</span>}
      </div>
      {offer.slabs.map((s) => (
        <div
          key={s.offerId}
          className={cn('grid items-center border-t border-border px-3 py-2.5 text-sm', showPrice ? 'grid-cols-3' : 'grid-cols-2')}
        >
          <span className="font-medium text-foreground">{s.band}</span>
          <span className={cn('font-semibold', showPrice ? '' : 'text-right', s.percent > 0 ? 'text-success-foreground' : 'text-foreground-secondary')}>
            {s.percent > 0 ? `${s.percent}%` : '—'}
            {s.cap ? <span className="ml-1 font-normal text-[11px] text-foreground-secondary">max {formatInr(s.cap)}</span> : null}
          </span>
          {showPrice && (
            <span className="text-right font-bold tabular-nums text-foreground">
              {formatInr(Math.round(unitPrice! * (1 - s.percent / 100) * 100) / 100)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Compact scheme strip for a product card (PLP mention) — tap opens the sheet. */
export function OfferStrip({ offers, onOpen }: { offers: Offer[]; onOpen?: () => void }) {
  if (offers.length === 0) return null;
  const shown = offers.slice(0, 2);
  const extra = offers.length - shown.length;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-2.5 flex w-full items-center gap-2 rounded-md bg-warning-subtle px-2.5 py-1.5 text-left active:scale-[0.99]"
    >
      <Tag className="h-3.5 w-3.5 shrink-0 text-warning-foreground" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-warning-foreground">
        {shown.map(offerChipLabel).join(' · ')}
      </span>
      {extra > 0 && (
        <span className="shrink-0 rounded-full bg-card px-1.5 py-0.5 text-[10px] font-bold text-warning-foreground">
          +{extra}
        </span>
      )}
    </button>
  );
}
