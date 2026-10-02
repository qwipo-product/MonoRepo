import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, FieldError, cn } from '@mockups/ui';
import { AuthShell } from '@mockups/components';

/* Login. Validation only fires on submit — typing a 4th digit shouldn't paint
   the field red while the buyer is still mid-number.

   Errors here are field-level only: the message sits under the field it
   describes, with no banner repeating it at the top of the screen.

   Layout comes from AuthShell, shared with OTP Verification, so the logo,
   heading, subheading, field row and button sit in the same place on both.

   `demoError` is review-only: it opens the screen already in its error state so
   the design is reachable from the gallery without typing a bad number. */

export function LoginScreen({
  onNext,
  demoError = false,
}: {
  onNext: (phone: string) => void;
  demoError?: boolean;
}) {
  const [phone, setPhone] = useState(demoError ? '98765' : '');
  const [error, setError] = useState(demoError ? 'Enter a valid 10-digit mobile number' : '');

  const valid = /^\d{10}$/.test(phone);

  const submit = () => {
    if (!valid) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    onNext(phone);
  };

  return (
    <AuthShell
      title="Login"
      subtitle="Please enter your phone number"
      footer={
        <p className="text-center text-xs text-foreground-secondary">
          By continuing, you agree to our{' '}
          <a className="font-medium text-primary underline underline-offset-2">Terms of Service</a> and{' '}
          <a className="font-medium text-primary underline underline-offset-2">Privacy Policy</a>
        </p>
      }
    >
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
          }}
          placeholder="Phone number"
          className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-secondary"
        />
      </div>
      <FieldError>{error}</FieldError>

      <Button size="lg" className="mt-5 w-full" onClick={submit}>
        Get OTP
      </Button>
    </AuthShell>
  );
}
