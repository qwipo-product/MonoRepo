// CDS sign-in — separate from the Logistics Buyer login (own session, own users and roles), same look.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { cdsApi, cdsAuth, cdsErrorText } from '../../api/services/cds.service';
import { CDS_DEMO_USERS } from '../../cds/seed';
import '../auth/auth.css';
import type { CdsPage } from '../../cds/types';
import './cds.css';

/** Pages a /cds URL may belong to (shared paths such as Orders exist for both roles). */
function pagesOf(url: string): CdsPage[] {
  const path = url.split('?')[0];
  const map: [string, CdsPage[]][] = [
    ['/cds/orders', ['sc-orders', 'cu-orders']], ['/cds/pickup-planning', ['sc-pickup']], ['/cds/deliver-to-cds', ['sc-deliver']], ['/cds/return-planning', ['sc-returns']],
    ['/cds/trips', ['sc-trips', 'cu-trips']], ['/cds/reports', ['sc-reports', 'cu-reports']], ['/cds/settings', ['sc-settings', 'cu-settings']], ['/cds/stores', ['sc-stores']],
    ['/cds/grn', ['cu-grn']], ['/cds/delivery-planning', ['cu-delivery']], ['/cds/collections', ['cu-collections']], ['/cds/returns', ['cu-returns']], ['/cds/retailers', ['cu-retailers']], ['/cds/customers', ['cu-retailers']],
  ];
  return map.find(([p]) => path.startsWith(p))?.[1] ?? [];
}

/** Six OTP digit boxes, like the app's Verification Code screen (type, paste, Backspace moves back). */
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');
  const put = (start: number, text: string) => {
    const clean = text.replace(/\D/g, '');
    if (!clean) return;
    const next = [...digits];
    for (let k = 0; k < clean.length && start + k < 6; k++) next[start + k] = clean[k];
    onChange(next.join('').slice(0, 6));
    refs.current[Math.min(5, start + clean.length)]?.focus();
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Backspace') return;
    e.preventDefault();
    const next = [...digits];
    if (next[i]) next[i] = '';
    else if (i > 0) { next[i - 1] = ''; refs.current[i - 1]?.focus(); }
    onChange(next.join(''));
  };
  return (
    <div className="otp-inputs">
      {digits.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={i === 0 ? 6 : 1} autoFocus={i === 0}
          autoComplete={i === 0 ? 'one-time-code' : undefined} aria-label={`Digit ${i + 1}`} value={d}
          onChange={(e) => put(i, e.target.value.slice(-6))} onKeyDown={(e) => onKey(i, e)}
          onPaste={(e) => { e.preventDefault(); put(i, e.clipboardData.getData('text')); }} />
      ))}
    </div>
  );
}

export default function CdsLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const back = params.get('returnUrl');
  /** Return link only to a list page the signed-in role can open (detail pages may belong to another store); otherwise home. */
  const targetFor = (pages: CdsPage[], home: string) => {
    const path = back?.split('?')[0] ?? '';
    const isDetail = path.split('/').filter(Boolean).length > 2;
    return back && path.startsWith('/cds/') && !isDetail && pagesOf(back).some((p) => pages.includes(p)) ? back : home;
  };
  const target = targetFor(cdsAuth.user?.pages ?? [], cdsAuth.home());
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cdsAuth.isSignedIn()) navigate(target, { replace: true });
  }, [navigate, target]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await cdsApi.sendOtp(mobile);
      setStep('otp');
    } catch (err) {
      setError(cdsErrorText(err));
    } finally {
      setBusy(false);
    }
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await cdsApi.verifyOtp(mobile, otp);
      cdsAuth.set(r.token, r.user);
      navigate(targetFor(r.user.pages, r.user.role === 'SERVICE_CENTRE' ? '/cds/orders' : '/cds/grn'), { replace: true });
    } catch (err) {
      setError(cdsErrorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="split-container auth-segoe">
      <div className="left-side">
        <div className="welcome-content">
          <h1>Welcome to</h1>
          <h1><span>Cross Dock Store</span></h1>
          <p>CDS Service Centre &amp; CDS operations</p>
        </div>
      </div>
      <div className="right-side">
        <div className="auth-card login-container">
          <div className="logo"><h1>CDS <span>Management</span></h1></div>
          <h2>Sign In</h2>
          {step === 'mobile' ? (
            <>
              <p className="subtitle">Enter your registered mobile number</p>
              <form noValidate onSubmit={send}>
                <div className="input-group">
                  <label htmlFor="cds-mobile">Mobile Number</label>
                  <div className="mobile-input">
                    <span className="country-code">+91</span>
                    <input id="cds-mobile" type="tel" maxLength={10} placeholder="Enter your mobile number" value={mobile} autoFocus
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                </div>
                <button type="submit" className="auth-btn" disabled={busy || !/^[6-9]\d{9}$/.test(mobile)}>{busy ? 'Sending OTP…' : 'Continue'}</button>
              </form>
            </>
          ) : (
            <>
              <p className="subtitle">Enter the 6-digit OTP sent to +91 {mobile}</p>
              <form noValidate onSubmit={verify}>
                <OtpBoxes value={otp} onChange={setOtp} />
                <button type="submit" className="auth-btn" disabled={busy || otp.length !== 6}>{busy ? 'Verifying…' : 'Verify & Sign In'}</button>
              </form>
              <div className="register"><p><a href="#" onClick={(e) => { e.preventDefault(); setStep('mobile'); setOtp(''); setError(''); }}>Change number</a></p></div>
            </>
          )}
          {error && <div className="auth-error-message">{error}</div>}
          <div className="demo-hint mt-3 text-center" style={{ fontSize: 12, color: '#7f8c8d' }}>
            Demo logins (OTP 123456):
            {CDS_DEMO_USERS.map((u) => (
              <div key={u.mobile}><a href="#" onClick={(e) => { e.preventDefault(); setMobile(u.mobile); setStep('mobile'); }}>{u.mobile}</a> · {u.label}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
