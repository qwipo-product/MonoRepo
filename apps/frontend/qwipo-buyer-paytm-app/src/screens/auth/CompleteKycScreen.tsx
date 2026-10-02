import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@mockups/ui';
import { Field, controlClass } from '@mockups/components';
import { BusinessTypeField } from '../../components/BusinessTypeField';
import { KycDocsStep } from '../../kyc/KycDocsStep';
import type { KycFlow } from '../../kyc/useKycFlow';
import { TermsAgree } from '../../components/TermsAgree';

/* Complete KYC — the same two steps as before:
     1. Basic information
     2. ID Proofs — Shop Image, Shop Location and Owner ID are mandatory and
        checked by AI the moment they're added (see KycDocsStep).
   Register unlocks once all three are accepted (or sent to manual review)
   and the terms are ticked. Shop Location moved here from step 1: it's one
   of the three things KYC needs, so it sits with the other two. */

export function CompleteKycScreen({
  step,
  flow,
  onCancel,
  onStep,
  onRegister,
  onManualReview,
}: {
  step: 1 | 2;
  flow: KycFlow;
  onCancel: () => void;
  onStep: (s: 1 | 2) => void;
  onRegister: () => void;
  onManualReview: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [agreed, setAgreed] = useState(false);
  // Customer Name and Business Type are both required to move on.
  const step1Valid = name.trim() !== '' && businessType !== '';

  return (
    <div className="relative flex h-full flex-col bg-background text-foreground">
      <div className="flex h-14 items-center gap-3 px-3">
        <button
          onClick={() => (step === 1 ? onCancel() : onStep(1))}
          className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground"
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-semibold leading-tight">Complete KYC</h1>
          <p className="text-xs text-foreground-secondary">{step === 1 ? 'Basic information' : 'ID Proofs'}</p>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3">
        <span className="h-1 flex-1 rounded-full bg-primary" />
        <span className={`h-1 flex-1 rounded-full ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      <div className="no-scrollbar flex flex-1 flex-col space-y-5 overflow-y-auto px-4 pb-4 pt-1">
        {step === 1 ? (
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
            <BusinessTypeField required value={businessType} onChange={setBusinessType} />
          </>
        ) : (
          <KycDocsStep flow={flow} onManualReview={onManualReview} />
        )}
      </div>

      <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* No running commentary above the buttons: the fields are marked
            required and the action is disabled until they are filled, which
            says the same thing without a line that changes on every keystroke.

            The terms sit here rather than at the end of the form — they gate
            Register, so they belong next to it. */}
        {step === 2 && <TermsAgree agreed={agreed} onChange={setAgreed} className="mb-3" />}
        <div className="flex gap-3">
          {step === 1 ? (
            <>
              <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button size="lg" className="flex-1" disabled={!step1Valid} onClick={() => onStep(2)}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => onStep(1)}>
                Back
              </Button>
              <Button size="lg" className="flex-1" disabled={!flow.ready || !agreed} onClick={onRegister}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
