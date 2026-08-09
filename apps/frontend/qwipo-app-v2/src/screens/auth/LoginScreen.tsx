import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@mockups/ui';
import { AuthBrand } from '../../components/formbits';

export function LoginScreen({ onNext }: { onNext: () => void }) {
  const [phone, setPhone] = useState('');
  const valid = /^\d{10}$/.test(phone);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* top half — brand */}
      <div className="flex flex-1 items-center justify-center">
        <AuthBrand />
      </div>

      {/* bottom half — elevated sheet */}
      <div className="flex flex-1 flex-col rounded-t-[24px] border-t border-border bg-background p-6 pb-8 shadow-[var(--shadow-bar-top)]">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-foreground-secondary">Please enter your phone number</p>

        <div className="mt-5 flex h-[52px] items-center rounded-xl border border-border bg-card px-3">
          <button type="button" className="flex items-center gap-1 text-sm font-medium">
            +91
            <ChevronDown className="h-4 w-4 text-foreground-secondary" />
          </button>
          <div className="mx-3 h-6 w-px bg-border" />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Phone number"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-secondary"
          />
        </div>

        <Button
          size="lg"
          className="mt-5 w-full disabled:bg-muted disabled:text-foreground-secondary disabled:opacity-100"
          disabled={!valid}
          onClick={onNext}
        >
          Get OTP
        </Button>

        <p className="mt-auto pt-[18px] text-center text-xs text-foreground-secondary">
          By continuing, you agree to our{' '}
          <a className="font-semibold text-primary underline underline-offset-2">Terms of Service</a> and{' '}
          <a className="font-semibold text-primary underline underline-offset-2">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
