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

      {/* Bottom 50% — content */}
      <div className="flex flex-1 flex-col rounded-t-xl border-t border-border p-5">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Please enter your phone number</p>

        <div className="mt-5 flex h-12 items-center rounded-md border border-border bg-input-background px-3">
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
          className="mt-5 w-full"
          disabled={!valid}
          onClick={() => onSubmit(phone)}
        >
          Get OTP
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <a className="text-primary">Terms of Service</a> and{' '}
          <a className="text-primary">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
