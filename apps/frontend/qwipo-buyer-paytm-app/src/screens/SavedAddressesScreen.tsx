
import { ChevronLeft, MapPin, Truck, Clock } from 'lucide-react';
import { cn } from '@mockups/ui';
import { isDeliverable, type Address } from '../data/addresses';

/* Select an approved delivery address. Pending addresses remain unavailable. */
export function SavedAddressesScreen({
  onBack,
  selectedId,
  onSelect,
  addresses,
}: {
  onBack: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
  addresses: Address[];
}) {
  // Approved first, pending at the bottom. A pending address can't be selected
  // at all until ops verifies it — it sits in the list, disabled, so the buyer
  // can see it's on its way without it becoming the delivery location.
  const approved = addresses.filter(isDeliverable);
  const pending = addresses.filter((a) => !isDeliverable(a));
  const ordered = [...approved, ...pending];

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
          <h1 className="truncate text-base font-semibold leading-tight">Saved addresses</h1>
          <p className="text-xs text-foreground-secondary">
            {approved.length} delivery {approved.length === 1 ? 'location' : 'locations'}
            {pending.length > 0 && ` · ${pending.length} pending approval`}
          </p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-4">
        {ordered.map((a) => {
          const awaiting = !isDeliverable(a);
          const selected = !awaiting && a.id === selectedId;
          return (
            <div
              key={a.id}
              className={cn(
                'rounded-lg border bg-card',
                selected ? 'border-primary' : 'border-border',
                // Reads as present but not yet usable.
                awaiting && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-lg">
                  {a.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{a.title}</div>
                  <div className="mt-0.5 text-xs text-foreground-secondary">{a.locality}</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-4 py-2.5">
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-foreground-secondary">
                  <MapPin size={14} className="shrink-0" />
                  {a.pincode}
                </span>
                {awaiting ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-warning-subtle px-2.5 py-1 text-xs font-medium text-warning-foreground">
                    <Clock size={14} className="shrink-0" />
                    Approval pending
                  </span>
                ) : selected ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1 text-xs font-medium text-success-foreground">
                    <Truck size={14} className="shrink-0" />
                    Delivering here
                  </span>
                ) : (
                  <button
                    onClick={() => onSelect(a.id)}
                    className="rounded-md px-1 text-sm font-medium text-primary active:scale-[0.98]"
                  >
                    Deliver here
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
