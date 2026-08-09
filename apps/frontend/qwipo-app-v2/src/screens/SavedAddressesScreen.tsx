import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Truck } from 'lucide-react';
import { Button, Input, Sheet, cn } from '@mockups/ui';
import { ADDRESSES, type Address } from '../data/addresses';

/* Account · Saved Addresses (from the Home "Deliver to" bar). A dashed
   add-new tile over the saved list; the delivering address is outlined and
   carries a green "Delivering here" pill. Selection is lifted to App so the
   Home tabs follow the chosen location. */
export function SavedAddressesScreen({
  onBack,
  selectedId,
  onSelect,
}: {
  onBack: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>(ADDRESSES);
  const [adding, setAdding] = useState(false);

  const addAddress = (a: Address) => {
    setAddresses((list) => [a, ...list]);
    onSelect(a.id);
    setAdding(false);
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
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-3 rounded-lg border border-dashed border-primary bg-primary-soft px-4 py-3 text-left active:scale-[0.98]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plus size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">Add new address</span>
            <span className="block text-xs text-foreground-secondary">Save a new delivery location</span>
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

      <AddAddressSheet open={adding} onClose={() => setAdding(false)} onSave={addAddress} />
    </div>
  );
}

/* Bottom sheet — collect a new delivery address. Save is disabled until the
   required fields are filled (line 2 is optional, per the mockup). */
function AddAddressSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (a: Address) => void;
}) {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Enable (colour) Save as soon as the user starts typing in any field.
  const touched = [line1, line2, city, state, pincode].some((v) => v.trim() !== '');

  const save = () => {
    const locality = [line2.trim(), city.trim(), state.trim()].filter(Boolean).join(', ');
    onSave({
      id: `addr-${line1.trim().toLowerCase().replace(/\s+/g, '-')}-${pincode.trim()}`,
      emoji: '📍',
      title: line1.trim(),
      locality,
      pincode: pincode.trim(),
    });
    setLine1('');
    setLine2('');
    setCity('');
    setState('');
    setPincode('');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add new address"
      footer={
        <Button fullWidth disabled={!touched} onClick={save}>
          Save address
        </Button>
      }
    >
      <div className="space-y-3">
        <Input
          aria-label="Address line 1"
          placeholder="Address line 1"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
        />
        <Input
          aria-label="Address line 2 (optional)"
          placeholder="Address line 2 (optional)"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
        />
        <div className="flex gap-3">
          <Input
            aria-label="City"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            aria-label="State"
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
        <Input
          aria-label="Pincode"
          placeholder="Pincode"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
        />
      </div>
    </Sheet>
  );
}
