import { useState } from 'react';
import { Loader2, Network, Phone, ShieldCheck } from 'lucide-react';
import { Button, FieldError, Input } from '@mockups/ui';
import { DEMO_RETAILER, login } from '../lib/retailer-session';

/**
 * Retailer sign-in — mobile number and OTP, because that's how a shop owner
 * actually authenticates in this market.
 *
 * In production this page rarely appears: the buyer app opens the WebView
 * already signed in. It exists so the mockup can be demoed standalone, and so
 * the identity the retailer is about to attach IDs to is explicit.
 */
export function Login() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = () => {
    if (mobile.length !== 10) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(true);
    }, 700);
  };

  const verify = () => {
    setBusy(true);
    setError(null);
    setTimeout(() => {
      setBusy(false);
      if (otp !== '1234') {
        setError('That OTP is not right. Try 1234.');
        return;
      }
      login({ ...DEMO_RETAILER, mobile });
    }, 700);
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-10">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Network className="h-7 w-7 text-primary-foreground" />
        </span>
        <h1 className="mt-4 type-h2 text-foreground">Your shop, one identity</h1>
        <p className="mx-auto mt-2 max-w-xs type-body text-foreground-secondary">
          Link your customer IDs once. Every company and buyer app then knows it&apos;s the
          same shop.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="space-y-2">
          <label htmlFor="mobile" className="type-label block text-foreground">
            Mobile number
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
            <Input
              id="mobile"
              type="tel"
              inputMode="numeric"
              value={mobile}
              maxLength={10}
              disabled={sent}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              className="h-12 pl-9 text-base"
            />
          </div>
        </div>

        {sent && (
          <div className="space-y-2">
            <label htmlFor="otp" className="type-label block text-foreground">
              OTP
            </label>
            <Input
              id="otp"
              inputMode="numeric"
              value={otp}
              maxLength={4}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit OTP"
              className="h-12 text-center font-mono text-lg tracking-[0.4em]"
            />
            {error && <FieldError>{error}</FieldError>}
            <p className="type-caption text-foreground-secondary">
              Sent to {mobile}. For this demo the OTP is <strong>1234</strong>.
            </p>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={sent ? verify : sendOtp}
          disabled={busy || (sent ? otp.length < 4 : mobile.length !== 10)}
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {sent ? 'Verify and continue' : 'Send OTP'}
        </Button>

        {!sent && (
          <button
            type="button"
            onClick={() => setMobile(DEMO_RETAILER.mobile)}
            className="w-full rounded-xl border border-border bg-card p-3 text-left active:bg-muted"
          >
            <span className="type-label block text-foreground">
              {DEMO_RETAILER.businessName}
            </span>
            <span className="type-caption text-foreground-secondary">
              Demo shop · tap to fill {DEMO_RETAILER.mobile}
            </span>
          </button>
        )}
      </div>

      <p className="mt-8 flex items-start justify-center gap-2 type-caption text-foreground-secondary">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
        Qwipo never shares your phone number with companies.
      </p>
    </div>
  );
}
