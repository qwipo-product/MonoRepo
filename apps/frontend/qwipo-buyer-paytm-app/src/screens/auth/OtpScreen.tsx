import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button, FieldError, InlineMessage } from '@mockups/ui';
import { AuthBrand } from '../../components/formbits';

/* OTP verification. 123456 is the happy path; any other code fails and burns
   an attempt. At zero attempts the screen locks and only Resend recovers it.

   `demoError` opens the screen already failed, for the review gallery. */

const CORRECT = '123456';
const MAX_ATTEMPTS = 3;

export function OtpScreen({
  onBack,
  onVerify,
  demoError = false,
}: {
  onBack: () => void;
  onVerify: () => void;
  demoError?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(
    demoError ? ['9', '8', '7', '6', '5', '4'] : ['', '', '', '', '', '']
  );
  const [secs, setSecs] = useState(demoError ? 0 : 23);
  const [error, setError] = useState(demoError ? 'Incorrect OTP. 2 attempts left' : '');
  const [left, setLeft] = useState(demoError ? 2 : MAX_ATTEMPTS);
  const [expired, setExpired] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(
      () =>
        setSecs((s) => {
          // Counting down to zero expires the code — Resend is the way back.
          if (s - 1 <= 0) setExpired(true);
          return s - 1;
        }),
      1000
    );
    return () => clearInterval(t);
  }, [secs]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const setAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(-1);
    setDigits((d) => d.map((x, j) => (j === i ? clean : x)));
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };
  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const filled = digits.join('').length === 6;
  const locked = left <= 0;

  const verify = () => {
    if (digits.join('') === CORRECT) {
      onVerify();
      return;
    }
    const remaining = left - 1;
    setLeft(remaining);
    setError(
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} left`
        : 'Too many incorrect attempts'
    );
  };

  const resend = () => {
    setSecs(23);
    setLeft(MAX_ATTEMPTS);
    setError('');
    setExpired(false);
    setDigits(['', '', '', '', '', '']);
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* top half — back + brand */}
      <div className="flex flex-1 flex-col">
        <div className="px-3 pt-3">
          <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground" aria-label="Back">
            <ChevronLeft size={18} />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <AuthBrand />
        </div>
      </div>

      {/* bottom half — content */}
      <div className="flex flex-1 flex-col rounded-t-2xl border-t border-border bg-background p-6 shadow-[var(--shadow-bar-top)]">
        <h1 className="text-xl font-semibold">OTP Verification</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Enter the verification code we just sent on your phone number.
        </p>

        {locked && (
          <InlineMessage
            className="mt-4"
            variant="error"
            title="Too many attempts"
            description="For your security, request a new OTP to try again."
          />
        )}
        {expired && !locked && (
          <InlineMessage
            className="mt-4"
            variant="warning"
            title="This OTP has expired"
            description="Request a new one to continue."
          />
        )}

        <div className="mt-5 flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              disabled={locked}
              aria-invalid={!!error || undefined}
              className={
                'h-12 w-12 rounded-md border bg-card text-center text-lg font-semibold outline-none focus:border-primary disabled:opacity-60 ' +
                (error
                  ? 'border-error text-error-foreground'
                  : d
                    ? 'border-primary text-foreground'
                    : 'border-border text-foreground-secondary')
              }
            />
          ))}
        </div>
        <FieldError>{error}</FieldError>

        <Button size="lg" className="mt-5 w-full" disabled={!filled || locked} onClick={verify}>
          Verify
        </Button>

        <p className="mt-4 text-center text-sm text-foreground-secondary">
          {secs > 0 ? (
            <>
              Resend OTP in <span className="font-semibold">{secs}s</span>
            </>
          ) : (
            <button onClick={resend} className="font-semibold text-primary">
              Resend OTP
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
