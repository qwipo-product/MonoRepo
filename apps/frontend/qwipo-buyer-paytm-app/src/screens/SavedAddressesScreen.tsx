
import { ChevronLeft, ChevronRight, Plus, MapPin, Truck } from 'lucide-react';
import { cn } from '@mockups/ui';
import { type Address } from '../data/addresses';

/* Account · Saved Addresses (from the Home "Deliver to" bar). A dashed
   add-new tile over the saved list; the delivering address is outlined and
   carries a green "Delivering here" pill.

   "Add new address" opens the map rather than a blank form — same two-step
   flow as onboarding (pin → address details), so a saved address always has
   coordinates behind it. The list and the selection both live in App, since
   adding one leaves this screen. */
export function SavedAddressesScreen({
  onBack,
  selectedId,
  onSelect,
  addresses,
  onAddNew,
}: {
  onBack: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
  addresses: Address[];
  /** Opens the location picker. */
  onAddNew: () => void;
}) {

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
            {addresses.length} delivery {addresses.length === 1 ? 'location' : 'locations'}
          </p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-4">
        {/* Add new address */}
        <button
          onClick={onAddNew}
          className="flex w-full items-center gap-3 rounded-lg border border-dashed border-primary bg-primary-soft px-4 py-3 text-left active:scale-[0.98]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plus size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">Add new address</span>
            <span className="block text-xs text-foreground-secondary">Pick it on the map</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-foreground-secondary" />
        </button>

        {addresses.map((a) => {
          const selected = a.id === selectedId;
          return (
            <div
              key={a.id}
              className={cn(
                'rounded-lg border bg-card',
                selected ? 'border-primary' : 'border-border'
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
              <div className="flex items-center justify-between border-t border-border-subtle px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                  <MapPin size={14} className="shrink-0" />
                  {a.pincode}
                </span>
                {selected ? (
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
