import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@mockups/ui';
import StatusBar from '../components/StatusBar';
import Field, { controlClass } from '../components/Field';
import BusinessTypeSheet from '../components/BusinessTypeSheet';
import ScreenFooter from '../components/ScreenFooter';

type OnboardingData = { location: string; businessName: string; businessType: string };

export default function OnboardingScreen({
  onBack,
  onProceed,
}: {
  onBack: () => void;
  onProceed: (data: OnboardingData) => void;
}) {
  const [location, setLocation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);

  // GPS resolves in the background as soon as onboarding loads (mirrors the ref flow).
  useEffect(() => {
    setLocation('Rai Durg, Hitech City, Hyderabad');
  }, []);

  const valid = location.trim() && businessName.trim() && businessType;

  return (
    <div className="relative flex h-full flex-col bg-background text-foreground">
      <StatusBar />
      <div className="flex h-14 items-center gap-2 px-2">
        <button onClick={onBack} aria-label="Back" className="grid h-11 w-11 place-items-center">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-base font-semibold">On Boarding</h1>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pt-2">
        <Field label="Shop Location" required>
          <div className={controlClass}>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Fetch using GPS"
              className="h-full flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => setLocation('Rai Durg, Hitech City, Hyderabad')}
              aria-label="Use GPS"
              className="text-primary"
            >
              <MapPin className="h-5 w-5" />
            </button>
          </div>
        </Field>

        <Field label="Business Name" required>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter Business name"
            className={`${controlClass} bg-transparent outline-none placeholder:text-muted-foreground`}
          />
        </Field>

        <Field label="Business Type" required>
          <button onClick={() => setTypeOpen(true)} className={`${controlClass} justify-between`}>
            <span className={businessType ? 'text-foreground' : 'text-muted-foreground'}>
              {businessType || 'Select business type'}
            </span>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </button>
        </Field>

        <img
          src="/onboarding-illustration.png"
          alt=""
          className="mx-auto max-h-52 object-contain"
        />
      </div>

      <ScreenFooter>
        <Button
          size="lg"
          className="w-full"
          disabled={!valid}
          onClick={() => onProceed({ location, businessName, businessType })}
        >
          Proceed
        </Button>
      </ScreenFooter>

      {typeOpen && (
        <BusinessTypeSheet
          value={businessType}
          onClose={() => setTypeOpen(false)}
          onSelect={(t) => {
            setBusinessType(t);
            setTypeOpen(false);
          }}
        />
      )}
    </div>
  );
}
