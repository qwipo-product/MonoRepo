import { useState } from 'react';
import { ChevronDown, MapPin, Check } from 'lucide-react';
import { Button } from '@mockups/ui';
import StatusBar from '../components/StatusBar';
import Field, { controlClass } from '../components/Field';
import BusinessTypeSheet from '../components/BusinessTypeSheet';
import ScreenFooter from '../components/ScreenFooter';
import BackButton from '../components/BackButton';

const DOC_FIELDS = [
  { key: 'shopImage', label: 'Shop Image', required: true },
  { key: 'ownerId', label: 'Shop Owner Photo ID', required: true },
  { key: 'gst', label: 'GST Certificate', required: false },
  { key: 'shopReg', label: 'Shop Registration Certificate', required: false },
];

type KycData = { name: string; email: string; businessType: string; location: string };

export default function CompleteKycScreen({
  initialBusinessType,
  initialLocation,
  onCancel,
  onRegister,
}: {
  initialBusinessType?: string;
  initialLocation?: string;
  onCancel: () => void;
  onRegister: (data: KycData) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState(initialBusinessType || '');
  const [location] = useState(initialLocation || '');
  const [typeOpen, setTypeOpen] = useState(false);
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);

  const step1Valid = name.trim().length > 0 && businessType;
  const step2Valid = docs.shopImage && docs.ownerId && agreed;
  const uploadDoc = (key: string) => setDocs((d) => ({ ...d, [key]: 'uploaded.jpg' }));

  return (
    <div className="relative flex h-full flex-col bg-background text-foreground">
      <StatusBar />
      <div className="flex h-14 items-center gap-3 px-3">
        <BackButton onClick={() => (step === 1 ? onCancel() : setStep(1))} />
        <div>
          <h1 className="text-base font-semibold">Complete KYC</h1>
          <p className="text-xs text-muted-foreground">
            {step === 1 ? 'Basic information' : 'ID Proofs'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3">
        <span className="h-1 flex-1 rounded-full bg-primary" />
        <span className={`h-1 flex-1 rounded-full ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pt-1">
        {step === 1 ? (
          <>
            <Field label="Customer Name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={`${controlClass} bg-transparent outline-none placeholder:text-muted-foreground`}
              />
            </Field>
            <Field label="Customer Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`${controlClass} bg-transparent outline-none placeholder:text-muted-foreground`}
              />
            </Field>
            <Field label="Business Type">
              <button onClick={() => setTypeOpen(true)} className={`${controlClass} justify-between`}>
                <span className={businessType ? 'text-foreground' : 'text-muted-foreground'}>
                  {businessType || 'Select business type'}
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
            </Field>
            <Field label="Shop Location">
              <div className={controlClass}>
                <input
                  value={location}
                  readOnly
                  placeholder="Fetch using GPS"
                  className="h-full flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                />
                <MapPin className="h-5 w-5 text-primary" />
              </div>
            </Field>
          </>
        ) : (
          <>
            {DOC_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} required={f.required}>
                <div className={`${controlClass} justify-between`}>
                  <span className={docs[f.key] ? 'text-foreground' : 'text-muted-foreground'}>
                    {docs[f.key] || 'Upload here'}
                  </span>
                  <button
                    onClick={() => uploadDoc(f.key)}
                    className="text-sm font-medium text-primary"
                  >
                    Upload
                  </button>
                </div>
              </Field>
            ))}

            <button
              type="button"
              onClick={() => setAgreed((a) => !a)}
              aria-pressed={agreed}
              className="flex items-start gap-2 text-left"
            >
              <span
                className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded border ${
                  agreed ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                }`}
              >
                {agreed && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="text-sm text-muted-foreground">
                I have read &amp; agree to the <a className="text-primary">Terms of Use</a> and{' '}
                <a className="text-primary">Privacy Policy</a>
              </span>
            </button>
          </>
        )}
      </div>

      <ScreenFooter>
        <div className="flex gap-3">
          {step === 1 ? (
            <>
              <Button variant="outline" size="lg" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button size="lg" className="flex-1" disabled={!step1Valid} onClick={() => setStep(2)}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!step2Valid}
                onClick={() => onRegister({ name, email, businessType, location })}
              >
                Register
              </Button>
            </>
          )}
        </div>
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
