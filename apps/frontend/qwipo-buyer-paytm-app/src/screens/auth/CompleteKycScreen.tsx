import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@mockups/ui';
import { Field, controlClass } from '../../components/formbits';
import { BusinessTypeField } from '../../components/BusinessTypeField';
import { KycDocsStep } from '../../kyc/KycDocsStep';
import type { KycFlow } from '../../kyc/useKycFlow';
import { TermsAgree } from '../../components/TermsAgree';

/* Complete KYC — one flow from login to the home screen, in three steps:

     1. Customer information — name, email, photo ID
     2. Business information — name, location, type
     3. ID Proofs           — both shop photos, and two optional certificates

   There is no separate On Boarding screen any more. It asked for the business
   name, type and a delivery location, which is the same ground step 2 covers,
   so a new buyer answered the same questions twice before seeing the app.

   Steps 1 and 2 have to be finished. Step 3 can be left for later: skipping it
   lands on the home screen, where the Complete KYC prompt stays until the shop
   photos are in — the buyer can look round the catalogue, just not order. */

export type KycStep = 1 | 2 | 3;

const TITLES: Record<KycStep, string> = {
  1: 'Customer information',
  2: 'Business information',
  3: 'ID Proofs',
};

export function CompleteKycScreen({
  step,
  flow,
  onCancel,
  onStep,
  onRegister,
  onSkip,
  onManualReview,
}: {
  step: KycStep;
  flow: KycFlow;
  onCancel: () => void;
  onStep: (s: KycStep) => void;
  onRegister: () => void;
  /** Leave step 3 for later — straight to Home, KYC still outstanding. */
  onSkip: () => void;
  onManualReview: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [agreed, setAgreed] = useState(false);

  /* What each step is waiting for. The document fields carry their own AI
     verdict, so a step is done when its typed fields are filled and whatever
     it uploaded has come back accepted. */
  const step1Valid = name.trim() !== '' && flow.customerReady;
  const step2Valid = businessName.trim() !== '' && businessType !== '' && flow.locationReady;

  return (
    <div className="relative flex h-full flex-col bg-background text-foreground">
      <div className="flex h-14 items-center gap-3 px-3">
        <button
          onClick={() => (step === 1 ? onCancel() : onStep((step - 1) as KycStep))}
          className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground"
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-semibold leading-tight">Complete KYC</h1>
          <p className="text-xs text-foreground-secondary">{TITLES[step]}</p>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3">
        {([1, 2, 3] as KycStep[]).map((n) => (
          <span key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="no-scrollbar flex flex-1 flex-col space-y-5 overflow-y-auto px-4 pb-4 pt-1">
        {step === 1 && (
          <>
            <Field label="Customer Name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={`${controlClass} placeholder:text-foreground-secondary`}
              />
            </Field>
            <Field label="Customer Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`${controlClass} placeholder:text-foreground-secondary`}
              />
            </Field>
            <KycDocsStep flow={flow} section="customer" onManualReview={onManualReview} />
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Business Name" required>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter business name"
                className={`${controlClass} placeholder:text-foreground-secondary`}
              />
            </Field>
            <KycDocsStep flow={flow} section="business" onManualReview={onManualReview} />
            <BusinessTypeField required value={businessType} onChange={setBusinessType} />
          </>
        )}

        {step === 3 && <KycDocsStep flow={flow} section="documents" onManualReview={onManualReview} />}
      </div>

      <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* No running commentary above the buttons: the fields are marked
            required and the action is disabled until they are filled, which
            says the same thing without a line that changes on every keystroke.

            The terms sit here rather than at the end of the form — they gate
            Register, so they belong next to it. */}
        {step === 3 && <TermsAgree agreed={agreed} onChange={setAgreed} className="mb-3" />}
        <div className="flex gap-3">
          {step === 1 && (
            <>
              <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button size="lg" className="flex-1" disabled={!step1Valid} onClick={() => onStep(2)}>
                Next
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => onStep(1)}>
                Back
              </Button>
              <Button size="lg" className="flex-1" disabled={!step2Valid} onClick={() => onStep(3)}>
                Next
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => onStep(2)}>
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!flow.documentsReady || !agreed}
                onClick={onRegister}
              >
                Register
              </Button>
            </>
          )}
        </div>
        {/* Only the last step can be put off, and it says so plainly rather
            than pretending the whole thing is optional. */}
        {step === 3 && (
          <button
            onClick={onSkip}
            className="mt-3 block w-full text-center text-sm font-semibold text-primary active:scale-[0.99]"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
