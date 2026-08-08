import { useEffect, useRef, useState } from 'react';
import { Button } from '@mockups/ui';
import StatusBar from '../components/StatusBar';
import AuthBrand from '../components/AuthBrand';
import BackButton from '../components/BackButton';

export default function OTPScreen({
  phone,
  onBack,
  onVerify,
}: {
  phone?: string;
  onBack: () => void;
  onVerify: (code: string) => void;
}) {
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
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const code = digits.join('');
  const filled = code.length === 6;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Top 50% — brand */}
      <div className="flex flex-1 flex-col">
        <StatusBar />
        <div className="px-3">
          <BackButton onClick={onBack} />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <AuthBrand />
        </div>
      </div>

      {/* Bottom 50% — content */}
      <div className="flex flex-1 flex-col rounded-t-xl border-t border-border p-5">
        <h1 className="text-xl font-semibold">OTP Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the verification code we just sent on your phone number
          {phone ? ` +91 ${phone}` : ''}.
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
              className={`h-12 w-12 rounded-md border text-center text-lg font-semibold outline-none ${
                d ? 'border-primary text-foreground' : 'border-border text-muted-foreground'
              } focus:border-primary`}
            />
          ))}
        </div>

        <Button
          size="lg"
          className="mt-5 w-full"
          disabled={!filled}
          onClick={() => onVerify(code)}
        >
          Verify
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Resend OTP in {secs}s{' '}
          <button
            disabled={secs !== 0}
            onClick={() => setSecs(23)}
            className={secs === 0 ? 'font-medium text-primary' : 'text-muted-foreground'}
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}
