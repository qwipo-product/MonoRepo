import { useState } from 'react';
import { ChevronLeft, Search, MapPin, Navigation, Repeat, Store } from 'lucide-react';
import { Button, EmptyState, cn } from '@mockups/ui';
import { SWITCH_CUSTOMERS, NEARBY_RADIUS_M, type SwitchCustomer } from '../../data/salesperson';

/* Salesperson · Switch Customer — find a retailer by mobile or nearby, then
   switch into their account to place an order on their behalf. Switching lands
   on the customer Home (acting-as that retailer). */
export function SwitchCustomerScreen({ onBack, onSwitch }: { onBack: () => void; onSwitch: () => void }) {
  const [mobile, setMobile] = useState('');
  const [selected, setSelected] = useState<SwitchCustomer | null>(null);
  const [nearby, setNearby] = useState<SwitchCustomer[]>([]);

  // Exact 10-digit match auto-selects; typing a new number clears the result.
  const onMobile = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
    const hit = digits.length === 10 ? SWITCH_CUSTOMERS.find((c) => c.mobile === digits) ?? null : null;
    setSelected(hit);
  };

  const locate = () => setNearby(SWITCH_CUSTOMERS.filter((c) => c.distanceM <= NEARBY_RADIUS_M));

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Switch Customer</h1>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        {/* search by mobile */}
        <div className="space-y-1.5">
          <label htmlFor="switch-mobile" className="text-sm font-medium text-foreground">Retailer mobile</label>
          <div className="flex h-11 items-center gap-2 rounded-md border border-border bg-card px-3 focus-within:border-primary">
            <Search className="h-4 w-4 text-foreground-secondary" />
            <input
              id="switch-mobile"
              inputMode="numeric"
              value={mobile}
              onChange={(e) => onMobile(e.target.value)}
              placeholder="10-digit mobile number"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-secondary"
            />
            <span className="text-xs tabular-nums text-foreground-secondary">{mobile.length}/10</span>
          </div>
          {mobile.length === 10 && !selected && (
            <p className="text-xs font-medium text-warning-foreground">No customer found for this number.</p>
          )}
        </div>

        <Button fullWidth variant="secondary" onClick={locate}>
          <Navigation size={16} /> Locate retailers nearby ({NEARBY_RADIUS_M} m)
        </Button>

        {selected && <CustomerResult c={selected} selected onPick={() => setSelected(selected)} />}

        {/* nearby results */}
        {nearby.length > 0 && !selected && (
          <div className="space-y-2">
            <div className="px-1 text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Nearby retailers
            </div>
            {nearby.map((c) => (
              <CustomerResult key={c.id} c={c} selected={false} onPick={() => setSelected(c)} />
            ))}
          </div>
        )}

        {!selected && nearby.length === 0 && mobile.length < 10 && (
          <div className="pt-6">
            <EmptyState
              icon={<Store strokeWidth={1.75} />}
              title="Find a retailer"
              description="Search a mobile number or locate shops nearby to switch."
            />
          </div>
        )}
      </div>

      {selected && (
        <div className="border-t border-border bg-card p-3">
          <Button fullWidth onClick={onSwitch}>
            <Repeat size={16} /> Switch to {selected.businessName}
          </Button>
        </div>
      )}
    </div>
  );
}

function CustomerResult({ c, selected, onPick }: { c: SwitchCustomer; selected: boolean; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className={cn(
        'w-full rounded-lg border bg-card p-3 text-left shadow-sm active:scale-[0.99]',
        selected ? 'border-primary bg-primary-soft' : 'border-border'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">{c.businessName}</span>
        <span className="shrink-0 text-xs font-medium text-foreground-secondary">{c.distanceM} m</span>
      </div>
      <div className="mt-0.5 text-xs text-foreground-secondary">{c.ownerName} · {c.mobile}</div>
      <div className="mt-1 flex items-start gap-1.5 text-xs text-foreground-secondary">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {c.address}
      </div>
    </button>
  );
}
