import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import { authService, authStore } from '../../api/services/auth.service';
import './auth.css';

const OTP_SECONDS = 600;

/** Port of OtpComponent (spec 00 §8): 6 boxes, 10:00 countdown, Resend after expiry, verify flow. */
export default function OtpPage() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(OTP_SECONDS);
  const [timerDone, setTimerDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const mobile = authStore.getMobileNumber();

  const startTimer = () => {
    window.clearInterval(timer.current);
    setTimeLeft(OTP_SECONDS);
    setTimerDone(false);
    timer.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(timer.current);
          setTimerDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/orders');
      return;
    }
    startTimer();
    if (!mobile) {
      navigate('/auth/login');
      return;
    }
    queueMicrotask(() => refs.current[0]?.focus());
    return () => window.clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valid = digits.every((d) => /^[0-9]$/.test(d));
  const display = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`;

  const setFrom = (start: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    const next = [...digits];
    for (let i = 0; i < clean.length && start + i < 6; i++) next[start + i] = clean[i];
    setDigits(next);
    const firstEmpty = next.findIndex((d) => !d);
    refs.current[firstEmpty === -1 ? 5 : firstEmpty]?.focus();
  };

  const onInput = (i: number, value: string) => {
    if (value.length > 1) return setFrom(i, value);
    const v = value.replace(/\D/g, '');
    const next = [...digits];
    next[i] = v.length === 1 ? v : '';
    setDigits(next);
    if (v.length === 1 && i < 5) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      const next = [...digits];
      next[i] = '';
      setDigits(next);
      if (i > 0) {
        refs.current[i - 1]?.focus();
        refs.current[i - 1]?.select();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
      refs.current[i - 1]?.select();
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus();
      refs.current[i + 1]?.select();
    }
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setFrom(i, e.clipboardData.getData('text'));
  };

  const sessionExpired = () =>
    Swal.fire({ icon: 'error', title: 'Session Expired', text: 'Your session has expired. Please login again.', confirmButtonText: 'OK' }).then(() => navigate('/auth/login'));

  const verify = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrorMessage('');
    if (!valid) {
      Swal.fire({ icon: 'warning', title: 'Invalid OTP', text: 'Please enter a valid 6-digit OTP code.', confirmButtonText: 'OK' });
      return;
    }
    if (!mobile) return sessionExpired();
    Swal.fire({ title: 'Verifying OTP', text: 'Please wait...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await authService.verifyOtp(mobile, digits.join(''));
      Swal.close();
      await Swal.fire({ icon: 'success', title: 'Success!', text: 'OTP verified successfully!', showConfirmButton: false, timer: 1500 });
      navigate('/orders');
    } catch (e: any) {
      console.error('OTP verification failed:', e);
      setDigits(['', '', '', '', '', '']);
      let message = 'Failed to verify OTP. Please try again.';
      if (typeof e?.error?.details === 'string' && e.error.details.includes('400')) message = 'Invalid OTP. Please check and try again.';
      else if (e?.error?.message) message = e.error.message;
      await Swal.fire({ icon: 'error', title: 'Verification Failed', text: message, confirmButtonText: 'Try Again' });
      // SweetAlert restores focus to the previously focused box after closing; focus the first box after that.
      window.setTimeout(() => refs.current[0]?.focus(), 50);
    }
  };

  const resend = async () => {
    if (!timerDone) return;
    if (!mobile) return sessionExpired();
    Swal.fire({ title: 'Sending New OTP', text: 'Please wait...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await authService.sendOtp(mobile, false);
      startTimer();
      Swal.fire({ icon: 'success', title: 'OTP Sent!', text: 'A new OTP has been sent to your mobile number.', showConfirmButton: false, timer: 1500 });
    } catch (e: any) {
      console.error('Resend OTP failed', e);
      Swal.fire({ icon: 'error', title: 'Failed to Resend', text: e?.error?.error?.message || 'Failed to resend OTP. Please try again.', confirmButtonText: 'OK' });
    }
  };

  return (
    <div className="split-container auth-segoe otp-page">
      <div className="left-side">
        <div className="welcome-content">
          <h1>Welcome to</h1>
          <h1><span>Logistics Buyer</span></h1>
          <p>Secure verification ensures your account safety</p>
        </div>
      </div>
      <div className="right-side">
        <div className="auth-card otp-container">
          <div className="logo"><h1>Logistics <span>Buyer</span></h1></div>
          <h2>Verification Code</h2>
          <p className="otp-text">
            We have sent a verification code to your mobile number <strong>{authStore.formatMobileNumber(mobile)}</strong>. Please enter the code below.
          </p>
          <form onSubmit={verify}>
            <div className="otp-inputs">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={i === 0 ? 6 : 1}
                  autoComplete={i === 0 ? 'one-time-code' : undefined}
                  required
                  value={d}
                  onChange={(e) => onInput(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  onPaste={(e) => onPaste(i, e)}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <div className="timer">Code expires in: <span>{display}</span></div>
            <div className="auth-error-message">{errorMessage}</div>
            <button type="submit" className="auth-btn" disabled={!valid}>Verify</button>
            {timerDone && (
              <button type="button" className="auth-btn resend" onClick={resend}>Resend Code</button>
            )}
            <div className="back"><Link to="/auth/login">Change phone number</Link></div>
          </form>
        </div>
      </div>
    </div>
  );
}
