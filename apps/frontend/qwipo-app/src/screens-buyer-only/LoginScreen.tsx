import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@mockups/ui';
import StatusBar from '../components/StatusBar';
import AuthBrand from '../components/AuthBrand';

export default function LoginScreen({ onSubmit }: { onSubmit: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  const valid = /^\d{10}$/.test(phone);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Top 50% — brand */}
      <div className="flex flex-1 flex-col">
        <StatusBar />
        <div className="flex flex-1 items-center justify-center">
          <AuthBrand />
        </div>
      </div>

      {/* Bottom 50% — elevated sheet raised above the tinted app bg */}
      <div className="flex flex-1 flex-col rounded-t-[24px] border-t border-border bg-background p-6 pb-8 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Please enter your phone number</p>

        <div className="mt-5 flex h-[52px] items-center rounded-xl border border-border bg-background px-3">
          <button className="flex items-center gap-1 text-sm font-medium" type="button">
            +91
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="mx-3 h-6 w-px bg-border" />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Phone number"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Button
          size="lg"
          className={`mt-5 w-full rounded-[14px] disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 ${
            valid ? 'shadow-[0_6px_18px_rgba(37,99,235,0.3)]' : ''
          }`}
          disabled={!valid}
          onClick={() => onSubmit(phone)}
        >
          Get OTP
        </Button>

        <p className="mt-auto pt-[18px] text-center text-xs text-gray-600">
          By continuing, you agree to our{' '}
          <a className="font-semibold text-primary underline underline-offset-2">Terms of Service</a>{' '}
          and{' '}
          <a className="font-semibold text-primary underline underline-offset-2">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
