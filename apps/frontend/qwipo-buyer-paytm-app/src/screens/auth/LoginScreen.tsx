import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, FieldError, InlineMessage, cn } from '@mockups/ui';
import { AuthBrand } from '../../components/formbits';

/* Login. Validation only fires on submit — typing a 4th digit shouldn't paint
   the field red while the buyer is still mid-number.

   `demoError` is review-only: it opens the screen already in its error state so
   the design is reachable from the gallery without typing a bad number. */

const NOT_REGISTERED = '9999999999';

export function LoginScreen({
  onNext,
  demoError = false,
}: {
  onNext: (phone: string) => void;
  demoError?: boolean;
}) {
  const [phone, setPhone] = useState(demoError ? '98765' : '');
  const [error, setError] = useState(demoError ? 'Enter a valid 10-digit mobile number' : '');
  const [banner, setBanner] = useState(demoError);

  const valid = /^\d{10}$/.test(phone);

  const submit = () => {
    if (!valid) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (phone === NOT_REGISTERED) {
      setError('');
      setBanner(true);
      return;
    }
    onNext(phone);
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* top half — brand */}
      <div className="flex flex-1 items-center justify-center">
        <AuthBrand />
      </div>

      {/* bottom half — elevated sheet */}
      <div className="flex flex-1 flex-col rounded-t-2xl border-t border-border bg-background p-6 pb-8 shadow-[var(--shadow-bar-top)]">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-foreground-secondary">Please enter your phone number</p>

        {banner && (
          <InlineMessage
            className="mt-4"
            variant="error"
            title="This number isn't registered"
            description="Check the number, or sign up to create an account."
            action={
              <Button size="sm" variant="outline">
                Sign up
              </Button>
            }
            onDismiss={() => setBanner(false)}
          />
        )}

        <div
          className={cn(
            'mt-5 flex h-12 items-center rounded-md border bg-card px-3',
            error ? 'border-error' : 'border-border focus-within:border-primary'
          )}
        >
          <button type="button" aria-label="Country code +91" className="flex items-center gap-1 text-sm font-medium">
            +91
            <ChevronDown className="h-4 w-4 text-foreground-secondary" />
          </button>
          <div className="mx-3 h-6 w-px bg-border" />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            aria-label="Phone number"
            aria-invalid={!!error || undefined}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''));
              setError('');
              setBanner(false);
            }}
            placeholder="Phone number"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-secondary"
          />
        </div>
        <FieldError>{error}</FieldError>

        <Button size="lg" className="mt-5 w-full" onClick={submit}>
          Get OTP
        </Button>

        <p className="mt-auto pt-5 text-center text-xs text-foreground-secondary">
          By continuing, you agree to our{' '}
          <a className="font-medium text-primary underline underline-offset-2">Terms of Service</a> and{' '}
          <a className="font-medium text-primary underline underline-offset-2">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
