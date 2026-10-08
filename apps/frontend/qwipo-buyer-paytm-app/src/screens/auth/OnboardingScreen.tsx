import { ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@mockups/ui';
import { Field, controlClass } from '../../components/formbits';
import { BusinessTypeField } from '../../components/BusinessTypeField';

/* On Boarding — delivery location, business name, business type.

   The location isn't typed. It's picked on the map (LocationPickerScreen) and
   confirmed on the address form, so the saved address always matches real
   coordinates. One way in: the field itself, marked with a map pin. Two
   separate buttons under it both opened the same map, which read as a choice
   that didn't exist.

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
  /** Opens the map picker. */
  onPickLocation: () => void;
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
            onClick={onPickLocation}
            aria-label="Choose delivery location on the map"
            className={`${controlClass} justify-between text-left`}
          >
            <span className={`min-w-0 flex-1 truncate ${location ? 'text-foreground' : 'text-foreground-secondary'}`}>
              {location || 'Select on map'}
            </span>
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
          </button>
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
          <img src="./onboarding-illustration.png" alt="" className="h-full w-full object-contain" />
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
