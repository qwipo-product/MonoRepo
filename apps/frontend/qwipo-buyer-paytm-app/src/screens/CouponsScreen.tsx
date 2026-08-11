import { useState } from 'react';
import { ChevronLeft, Ticket, Percent, Truck, Wallet } from 'lucide-react';
import { Button, Input, SelectableCard, cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { COUPONS, savingsText, type Coupon, type CouponType } from '../data/coupons';
import { buildCart } from '../data/cart';

const ICONS: Record<CouponType, typeof Ticket> = {
  flat: Ticket,
  percent: Percent,
  free: Truck,
  cashback: Wallet,
};

/* Apply Coupon — enter a code or pick from Available offers. Eligibility is
   derived against the cart's grand total; ineligible offers dim and show the
   shortfall. Sticky Apply reflects the selection. */
export function CouponsScreen({ onBack, onApply }: { onBack: () => void; onApply: () => void }) {
  const { grandTotal } = buildCart();
  const [code, setCode] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = COUPONS.find((c) => c.id === selectedId) ?? null;
  const canApply = !!selected && grandTotal >= selected.minOrder;

  const check = () => {
    const match = COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (match) setSelectedId(match.id);
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
        <h2 className="mb-2 mt-5 text-sm font-semibold text-foreground">Available offers</h2>
        <div className="space-y-3">
          {COUPONS.map((c) => (
            <OfferCard
              key={c.id}
              coupon={c}
              eligible={grandTotal >= c.minOrder}
              shortfall={c.minOrder - grandTotal}
              selected={selectedId === c.id}
              onSelect={() => setSelectedId(c.id)}
            />
          ))}
        </div>
      </div>

      {/* sticky apply */}
      <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
        {selected ? (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-foreground">{selected.code}</div>
            <div className="truncate text-xs text-foreground-secondary">
              You save <span className="font-medium text-success-foreground">{savingsText(selected)}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-foreground-secondary">Select a coupon to apply</div>
        )}
        <Button className="px-8" disabled={!canApply} onClick={onApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}

function OfferCard({
  coupon,
  eligible,
  shortfall,
  selected,
  onSelect,
}: {
  coupon: Coupon;
  eligible: boolean;
  shortfall: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = ICONS[coupon.type];
  return (
    <SelectableCard
      selected={selected}
      radio
      disabled={!eligible}
      onClick={onSelect}
      className={cn('p-3', !eligible && 'opacity-60')}
    >
      <div className="flex gap-3 pr-7">
        <div className="flex w-10 shrink-0 flex-col items-center gap-1">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-5 w-5" />
          </span>
          {coupon.tag && (
            <span className="rounded bg-warning-subtle px-1 py-0.5 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-warning-foreground">
              {coupon.tag}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">{coupon.title}</div>
          <div className="text-xs text-foreground-secondary">{coupon.sub}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded border border-dashed border-border px-1.5 py-0.5 text-xs font-medium text-foreground">
              {coupon.code}
            </span>
            <span className="text-xs text-foreground-secondary">Expires {coupon.expires}</span>
          </div>
          {!eligible && (
            <div className="mt-1 text-xs font-medium text-warning-foreground">
              Add {formatInr(shortfall)} more to use
            </div>
          )}
        </div>
      </div>
    </SelectableCard>
  );
}
