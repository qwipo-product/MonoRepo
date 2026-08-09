import { useEffect, useState } from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@mockups/ui';
import { Field, controlClass } from '../../components/formbits';
import { BusinessTypeField } from '../../components/BusinessTypeField';

export function OnboardingScreen({ onBack, onProceed }: { onBack: () => void; onProceed: () => void }) {
  const [location, setLocation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // GPS resolves on load (mirrors the source flow).
  useEffect(() => {
    setLocation('Rai Durg, Hitech City, Hyderabad');
  }, []);

  const valid = location.trim() && businessName.trim() && businessType;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex h-14 items-center gap-3 px-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold">On Boarding</h1>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pt-2">
        <Field label="Shop Location" required>
          <div className={controlClass}>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Fetch using GPS"
              className="h-full flex-1 bg-transparent outline-none placeholder:text-foreground-secondary"
            />
            <button onClick={() => setLocation('Rai Durg, Hitech City, Hyderabad')} aria-label="Use GPS" className="text-primary">
              <MapPin className="h-5 w-5" />
            </button>
          </div>
        </Field>

        <Field label="Business Name" required>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter Business name"
            className={`${controlClass} placeholder:text-foreground-secondary`}
          />
        </Field>

        <BusinessTypeField required value={businessType} onChange={setBusinessType} />

        <img src="/onboarding-illustration.png" alt="" className="mx-auto max-h-52 object-contain" />
      </div>

      <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Button size="lg" className="w-full" disabled={!valid} onClick={onProceed}>
          Proceed
        </Button>
      </div>
    </div>
  );
}
