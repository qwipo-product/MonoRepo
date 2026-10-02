import { useEffect, useRef, useState } from 'react';
import { Button, FieldError } from '@mockups/ui';
import { AuthShell } from '@mockups/components';

/* OTP verification. 123456 is the happy path; any other code fails.

   The failure is field-level only — one line under the boxes, no attempt
   counter and no banner above them.

   Layout comes from AuthShell, shared with Login, so the logo, heading,
   subheading, field row and button sit in the same place on both. The subtitle
   is kept to one line for the same reason.

   `demoError` opens the screen already failed, for the review gallery. */

const CORRECT = '123456';

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
  const [error, setError] = useState(demoError ? 'Incorrect OTP' : '');
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs((s) => s - 1), 1000);
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

  const verify = () => {
    if (digits.join('') === CORRECT) {
      onVerify();
      return;
    }
    setError('Incorrect OTP');
  };

  const resend = () => {
    setSecs(23);
    setError('');
    setDigits(['', '', '', '', '', '']);
  };

  return (
    <AuthShell onBack={onBack} title="OTP Verification" subtitle="Enter the code sent to your phone number">
      {/* same 48px-tall field row as Login's phone input, so the button below
          lands at the same height on both screens */}
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
            aria-invalid={!!error || undefined}
            className={
              'h-12 w-12 rounded-md border bg-card text-center text-lg font-semibold outline-none focus:border-primary ' +
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

      <Button size="lg" className="mt-5 w-full" disabled={!filled} onClick={verify}>
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
    </AuthShell>
  );
}
