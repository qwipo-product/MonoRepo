import { useState } from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Button, FieldError, Input } from '@mockups/ui';
import { Field } from '../components/formbits';
import { formatPlace, type Place } from '../data/places';
import type { Address } from '../data/addresses';

/* Confirm address — step two of the location flow, after the map.

   City, state and pincode come from the pin and are read-only: they're what
   the map already resolved, and letting them be retyped is how an address ends
   up not matching its own coordinates. Only the street lines are the buyer's
   to write — line 1 required, line 2 optional. */

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
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    if (!line1.trim()) {
      setError('Enter a house, flat or shop number');
      return;
    }
    onSave({
      id: `addr-${place.id}-${Date.now()}`,
      emoji: '📍',
      title: line1.trim(),
      locality: [line2.trim(), place.locality, place.city, place.state].filter(Boolean).join(', '),
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
          City, state and pincode come from the location you picked on the map.
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
