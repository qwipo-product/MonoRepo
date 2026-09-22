import { ChevronLeft, ChevronRight, LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@mockups/ui';
import { Field, controlClass } from '../../components/formbits';
import { BusinessTypeField } from '../../components/BusinessTypeField';

/* On Boarding — delivery location, business name, business type.

   The location isn't typed. It's picked on the map (LocationPickerScreen) and
   confirmed on the address form, so the saved address always matches real
   coordinates. Two entry points sit under the field — "Use current location"
   and "Add location" — because a single map icon read as the only affordance
   and buyers missed it. Both open the same map; the first drops the pin on the
   current position, the second opens it to search.

   Form state lives in App: picking a location leaves this screen, and the
   business name shouldn't be lost on the way back. */

export function OnboardingScreen({
  onBack,
  onProceed,
  location,
  onPickLocation,
  businessName,
  onBusinessName,
  businessType,
  onBusinessType,
}: {
  onBack: () => void;
  onProceed: () => void;
  /** Resolved address, empty until one is picked. */
  location: string;
  /** `useCurrent` opens the map already centred on the current position. */
  onPickLocation: (useCurrent: boolean) => void;
  businessName: string;
  onBusinessName: (v: string) => void;
  businessType: string;
  onBusinessType: (v: string) => void;
}) {
  const valid = location.trim() && businessName.trim() && businessType;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex h-14 items-center gap-3 px-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold">On Boarding</h1>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-2">
        <Field label="Delivery Location" required>
          <button
            type="button"
            onClick={() => onPickLocation(false)}
            aria-label="Choose delivery location on the map"
            className={`${controlClass} justify-between text-left`}
          >
            <span className={`min-w-0 flex-1 truncate ${location ? 'text-foreground' : 'text-foreground-secondary'}`}>
              {location || 'Select on map'}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
          </button>

          {/* two obvious ways in, both landing on the same map */}
          <div className="flex gap-2 pt-1">
            <LocationOption icon={<LocateFixed className="h-4 w-4" />} label="Use current location" onClick={() => onPickLocation(true)} />
            <LocationOption icon={<MapPin className="h-4 w-4" />} label="Add location" onClick={() => onPickLocation(false)} />
          </div>
        </Field>

        <Field label="Business Name" required>
          <input
            value={businessName}
            onChange={(e) => onBusinessName(e.target.value)}
            placeholder="Enter Business name"
            className={`${controlClass} placeholder:text-foreground-secondary`}
          />
        </Field>

        <BusinessTypeField required value={businessType} onChange={onBusinessType} />

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <img src="/onboarding-illustration.png" alt="" className="h-full w-full object-contain" />
        </div>
      </div>

      <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Button size="lg" className="w-full" disabled={!valid} onClick={onProceed}>
          Proceed
        </Button>
      </div>
    </div>
  );
}

function LocationOption({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-2 text-xs font-medium text-primary active:scale-[0.98]"
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
