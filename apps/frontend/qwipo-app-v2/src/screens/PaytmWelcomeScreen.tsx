import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@mockups/ui';

/* Paytm mini-app consent gate — shown once before the app, after Paytm launches
   the mini. Brand lockup + "Powered by ONDC DigiDukaan" + a Terms checkbox that
   unlocks Proceed. Only used in the Paytm shell (the Qwipo app has its own auth). */
export function PaytmWelcomeScreen({ onProceed }: { onProceed: () => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex h-full flex-col bg-background px-6 pb-6 text-foreground">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-2xl font-bold">Welcome to</div>
        <img src="/brand/qwipo-primary.svg" alt="Qwipo" className="mt-5 h-64 w-auto dark:hidden" />
        <img src="/brand/qwipo-primary-white.svg" alt="Qwipo" aria-hidden className="mt-5 hidden h-64 w-auto dark:block" />
      </div>

      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-secondary">Powered by</div>
        <img src="/brand/digidukaan-logo.svg" alt="ONDC DigiDukaan" className="h-7 w-auto" />
      </div>

      <button
        type="button"
        onClick={() => setAgreed((a) => !a)}
        aria-pressed={agreed}
        className="mb-4 flex items-start gap-2 text-left"
      >
        <span
          className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded border ${
            agreed ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
          }`}
        >
          {agreed && <Check className="h-3.5 w-3.5" />}
        </span>
        <span className="text-sm text-foreground-secondary">
          I have read &amp; agree to the{' '}
          <a className="font-medium text-primary underline underline-offset-2">Terms of Use</a> and{' '}
          <a className="font-medium text-primary underline underline-offset-2">Privacy Policy</a>
        </span>
      </button>

      <Button size="lg" className="w-full" disabled={!agreed} onClick={onProceed}>
        Proceed
      </Button>
    </div>
  );
}
