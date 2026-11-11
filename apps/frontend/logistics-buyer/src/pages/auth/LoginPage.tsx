import { useEffect, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import { authService, authStore } from '../../api/services/auth.service';
import { buyerService } from '../../api/services/buyer.service';
import './auth.css';

const PATTERN = /^[6-9][0-9]{9}$/;

/** Port of LoginComponent (spec 00 §7). */
export default function LoginPage() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [dirty, setDirty] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authService.isAuthenticated()) navigate('/orders');
  }, [navigate]);

  const required = !mobile;
  const patternErr = !!mobile && !PATTERN.test(mobile);
  const invalid = required || patternErr;

  /** Blocks non-digits; the first digit must be 6–9. */
  const onlyNumbers = (e: KeyboardEvent<HTMLInputElement>) => {
    const code = e.key.length === 1 ? e.key.charCodeAt(0) : 0;
    if (code <= 31) return;
    const t = e.currentTarget;
    if (code < 48 || code > 57) return e.preventDefault();
    if (t.selectionStart === 0 && !(code >= 54 && code <= 57)) e.preventDefault();
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!mobile || mobile.length !== 10) {
      Swal.fire({ icon: 'warning', title: 'Invalid Mobile Number', text: 'Please enter a valid 10-digit mobile number.', confirmButtonText: 'OK' });
      return;
    }
    try {
      const res = await buyerService.verifyMobileNumber(mobile);
      if (!res.success) {
        Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to verify mobile number', confirmButtonText: 'OK' });
        return;
      }
      Swal.fire({ title: 'Sending OTP', text: 'Please wait while we send an OTP to your mobile number...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    } catch (e) {
      console.error('Error during mobile verification:', e);
      Swal.fire({ icon: 'error', title: 'Error', text: 'An unexpected error occurred. Please try again.', confirmButtonText: 'OK' });
    }
    try {
      await authService.sendOtp(mobile, false);
      setErrorMessage('');
      authStore.setMobileNumber(mobile);
      Swal.close();
      navigate('/auth/otp');
    } catch (e: any) {
      console.error('Send OTP failed', e);
      Swal.fire({ icon: 'error', title: 'Error', text: e?.error?.error?.message || 'Failed to send OTP. Please try again.', confirmButtonText: 'OK' });
    }
  };

  return (
    <div className="split-container auth-segoe">
      <div className="left-side">
        <div className="welcome-content">
          <h1>Welcome to</h1>
          <h1><span>Logistics Buyer</span></h1>
          <p>Your complete logistics management solution</p>
        </div>
      </div>
      <div className="right-side">
        <div className="auth-card login-container">
          <div className="logo"><h1>Logistics <span>Buyer</span></h1></div>
          <h2>Sign In</h2>
          <p className="subtitle">Enter your mobile number to continue</p>
          <form noValidate onSubmit={onSubmit}>
            <div className="input-group">
              <label htmlFor="mobile">Mobile Number</label>
              <div className="mobile-input">
                <span className="country-code">+91</span>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  placeholder="Enter your mobile number"
                  maxLength={10}
                  value={mobile}
                  className={`${invalid ? 'invalid' : ''} ${touched ? 'touched' : ''}`}
                  onKeyDown={onlyNumbers}
                  onChange={(e) => {
                    setMobile(e.target.value.slice(0, 10));
                    setDirty(true);
                  }}
                  onBlur={() => setTouched(true)}
                  autoFocus
                />
              </div>
              {invalid && (dirty || touched) && (
                <div className="field-error">
                  {required && <span>Mobile number is required</span>}
                  {patternErr && <span>Please enter a valid 10-digit number</span>}
                </div>
              )}
            </div>
            <button type="submit" className="auth-btn" disabled={invalid}>Continue</button>
          </form>
          {errorMessage && <div className="auth-error-message">{errorMessage}</div>}
          <div className="register">
            <p>
              Don't have an account? <Link to="/auth/register">Register</Link>
            </p>
          </div>
          <div className="demo-hint">Demo: any valid number · OTP from the <i className="fas fa-flask" /> panel (default 123456)</div>
        </div>
      </div>
    </div>
  );
}
