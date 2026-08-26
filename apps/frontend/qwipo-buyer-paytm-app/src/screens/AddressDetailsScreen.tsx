import { useState } from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Button, FieldError, Input } from '@mockups/ui';
import { Field, SelectField } from '../components/formbits';
import { formatPlace, suggestedLines, type Place } from '../data/places';
import { ADDRESS_TYPES, emojiForType, type Address } from '../data/addresses';

/* Confirm address — step two of the location flow, after the map.

   City, state and pincode come from the pin and are read-only: they're what
   the map already resolved, and letting them be retyped is how an address ends
   up not matching its own coordinates.

   The street lines are prefilled from the pin too, but stay editable — the map
   gets the buyer to the right street, only they can add the shop number.

   Address type is asked first: a B2B delivery goes to a shop, godown or
   warehouse as often as a home, and it changes what the driver looks for. */

export function AddressDetailsScreen({
  place,
  onBack,
  onChangeLocation,
  onSave,
  saveLabel = 'Save address',
}: {
  place: Place;
  onBack: () => void;
  /** Back to the map to move the pin. */
  onChangeLocation: () => void;
  onSave: (address: Address) => void;
  saveLabel?: string;
}) {
  const [type, setType] = useState<string>('Shop');
  /* Seeded from the pin. Going back to the map unmounts this screen, so
     re-picking always re-seeds from the new pin — which is what "prefilled
     from the location you chose" should mean. Edits stick while you're here. */
  const [line1, setLine1] = useState(() => suggestedLines(place).line1);
  const [line2, setLine2] = useState(() => suggestedLines(place).line2);
  const [error, setError] = useState('');

  const save = () => {
    if (!line1.trim()) {
      setError('Enter a house, flat or shop number');
      return;
    }
    onSave({
      id: `addr-${place.id}-${Date.now()}`,
      emoji: emojiForType(type),
      type,
      title: line1.trim(),
      locality: [line2.trim(), place.city, place.state].filter(Boolean).join(', '),
      pincode: place.pincode,
      // New addresses aren't live until ops verifies them.
      status: 'pending',
    });
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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Address details</h1>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        {/* what the pin resolved to */}
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 shadow-sm">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{place.name}</div>
            <div className="text-xs leading-snug text-foreground-secondary">{formatPlace(place)}</div>
          </div>
          <button
            onClick={onChangeLocation}
            className="shrink-0 text-xs font-semibold text-primary underline underline-offset-2"
          >
            Change
          </button>
        </div>

        <SelectField
          label="Address type"
          required
          placeholder="Select address type"
          value={type}
          options={[...ADDRESS_TYPES]}
          onChange={setType}
        />

        <Field label="Address line 1" required>
          <Input
            placeholder="House / flat / shop number, building"
            aria-label="Address line 1"
            aria-invalid={!!error || undefined}
            value={line1}
            onChange={(e) => {
              setLine1(e.target.value);
              setError('');
            }}
          />
        </Field>
        <FieldError>{error}</FieldError>

        <Field label="Address line 2">
          <Input
            placeholder="Street, area (optional)"
            aria-label="Address line 2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
          />
        </Field>

        {/* filled from the pin — read-only, so the text can't contradict the map */}
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Field label="City">
              <Input readOnly value={place.city} aria-label="City" />
            </Field>
          </div>
          <div className="min-w-0 flex-1">
            <Field label="State">
              <Input readOnly value={place.state} aria-label="State" />
            </Field>
          </div>
        </div>

        <Field label="Pincode">
          <Input readOnly value={place.pincode} aria-label="Pincode" />
        </Field>

        <p className="text-xs text-foreground-secondary">
          Address lines are filled in from the pin — edit them to add your shop or
          building number. City, state and pincode come from the map and can't be changed.
        </p>
      </div>

      <div className="border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button size="lg" className="w-full" onClick={save}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
