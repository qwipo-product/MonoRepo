import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@mockups/ui';
import { AuthBrand } from '../../components/formbits';

export function OtpScreen({ onBack, onVerify }: { onBack: () => void; onVerify: () => void }) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [secs, setSecs] = useState(23);
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
      <div className="flex flex-1 flex-col rounded-t-xl border-t border-border p-5 shadow-[var(--shadow-bar-top)]">
        <h1 className="text-xl font-semibold">OTP Verification</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Enter the verification code we just sent on your phone number.
        </p>

        <div className="mt-5 flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className={
                'h-12 w-12 rounded-md border bg-card text-center text-lg font-semibold outline-none focus:border-primary ' +
                (d ? 'border-primary text-foreground' : 'border-border text-foreground-secondary')
              }
            />
          ))}
        </div>

        <Button
          size="lg"
          className="mt-5 w-full disabled:bg-muted disabled:text-foreground-secondary disabled:opacity-100"
          disabled={!filled}
          onClick={onVerify}
        >
          Verify
        </Button>

        <p className="mt-4 text-center text-sm text-foreground-secondary">
          Resend OTP in {secs}s{' '}
          <button
            disabled={secs !== 0}
            onClick={() => setSecs(23)}
            className={secs === 0 ? 'font-medium text-primary' : 'text-foreground-secondary'}
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}
