import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import { buyerService } from '../../api/services/buyer.service';
import { BusinessTypes } from '../../types/enums';
import './auth.css';

type Field = 'businessName' | 'name' | 'email' | 'phone' | 'businessTypeId' | 'gstNumber' | 'panNumber' | 'aadharNumber' | 'terms';
type Form = Record<Exclude<Field, 'terms'>, string> & { terms: boolean };

const EMPTY: Form = { businessName: '', name: '', email: '', phone: '', businessTypeId: '', gstNumber: '', panNumber: '', aadharNumber: '', terms: false };
const LETTERS = /^[A-Za-z\s]+$/;
const GST = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1,3}Z[0-9A-Z]{1,2}$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
// Angular Validators.email (allows "a@b").
const EMAIL = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validate(f: Form, k: Field): { required?: boolean; pattern?: boolean; email?: boolean; maxlength?: boolean } | null {
  const v = f[k] as any;
  switch (k) {
    case 'businessName':
    case 'name':
      if (!v) return { required: true };
      if (!LETTERS.test(v)) return { pattern: true };
      if (v.length > 50) return { maxlength: true };
      return null;
    case 'email':
      return v && !EMAIL.test(v) ? { email: true } : null;
    case 'phone':
      if (!v) return { required: true };
      return /^[0-9]{10}$/.test(v) ? null : { pattern: true };
    case 'businessTypeId':
      return v ? null : { required: true };
    case 'gstNumber':
      return v && !GST.test(v) ? { pattern: true } : null;
    case 'panNumber':
      return v && !PAN.test(v) ? { pattern: true } : null;
    case 'aadharNumber':
      return v && !/^[0-9]{12}$/.test(v) ? { pattern: true } : null;
    case 'terms':
      return v === true ? null : { required: true };
  }
}

function message(k: Field, e: ReturnType<typeof validate>): string {
  if (!e) return '';
  if (e.required) return k === 'terms' ? 'You must accept the terms and conditions' : 'This field is required';
  if (e.pattern) {
    if (k === 'businessName' || k === 'name') return 'Please enter only letters and spaces';
    if (k === 'phone') return 'Please enter a valid 10-digit phone number';
    if (k === 'gstNumber') return 'Please enter a valid GST number';
    if (k === 'panNumber') return 'Please enter a valid PAN (5 letters + 4 numbers + 1 letter)';
    if (k === 'aadharNumber') return 'Please enter a valid 12-digit Aadhar number';
    return 'Invalid format';
  }
  if (e.email) return 'Please enter a valid email address';
  if (e.maxlength) return 'Cannot exceed 50 characters';
  return '';
}

/** GST live filter: chars 1–2 digits; 3–12 A-Z0-9; 13 A-Z0-9; 14 only "Z"; 15 A-Z0-9 (filtered per slice). */
function filterGst(raw: string) {
  const v = raw.toUpperCase();
  const a = v.slice(0, 2).replace(/[^0-9]/g, '');
  const b = v.slice(2, 12).replace(/[^A-Z0-9]/g, '');
  const c = v.slice(12, 13).replace(/[^A-Z0-9]/g, '');
  const d = v.slice(13, 14) === 'Z' ? 'Z' : '';
  const e = v.slice(14, 15).replace(/[^A-Z0-9]/g, '');
  return (a + b + c + d + e).slice(0, 15);
}
function filterPan(raw: string) {
  const v = raw.toUpperCase();
  return (v.slice(0, 5).replace(/[^A-Z]/g, '') + v.slice(5, 9).replace(/[^0-9]/g, '') + v.slice(9, 10).replace(/[^A-Z]/g, '')).slice(0, 10);
}

/** Port of RegisterComponent (spec 00 §9). */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [f, setF] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fields: Field[] = ['businessName', 'name', 'email', 'phone', 'businessTypeId', 'gstNumber', 'panNumber', 'aadharNumber', 'terms'];
  const formInvalid = fields.some((k) => validate(f, k));
  const set = (k: Field, v: any) => setF((p) => ({ ...p, [k]: v }));
  const touch = (k: Field) => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k: Field) => (touched[k] ? message(k, validate(f, k)) : '');
  const cls = (k: Field) => (touched[k] && validate(f, k) ? 'invalid touched' : '');

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (formInvalid) {
      setTouched(Object.fromEntries(fields.map((k) => [k, true])));
      Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please fill in all required fields correctly.', confirmButtonText: 'OK' });
      return;
    }
    Swal.fire({ title: 'Registering...', text: 'Please wait while we create your account...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    setIsLoading(true);
    setErrorMessage('');
    const { phone, terms, ...rest } = f;
    const body = { ...rest, status: false, mobileNumber: phone };
    try {
      await buyerService.register(body);
      setIsLoading(false);
      await Swal.fire({ icon: 'success', title: 'Registration Successful!', text: 'Your account has been created successfully. Redirecting to login...', showConfirmButton: false, timer: 2000 });
      navigate('/auth/login?registered=true');
    } catch (e: any) {
      setIsLoading(false);
      console.error('Registration failed:', e);
      const text = e?.error?.message || (e?.status === 0 ? 'Unable to connect to the server. Please check your connection and try again.' : 'Registration failed. Please try again.');
      Swal.fire({ icon: 'error', title: 'Registration Failed', text, confirmButtonText: 'OK' });
    }
  };

  const input = (k: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, filter?: (v: string) => string, hint?: string) => (
    <div className="input-group">
      <label htmlFor={k}>{label}</label>
      <input id={k} name={k} className={cls(k)} value={f[k] as string} onChange={(e) => set(k, filter ? filter(e.target.value) : e.target.value)} onBlur={() => touch(k)} {...props} />
      {hint && <div className="hint">{hint}</div>}
      {err(k) && <div className="reg-error">{err(k)}</div>}
    </div>
  );

  return (
    <div className="split-container">
      <div className="left-side">
        <div className="welcome-content">
          <h1>Join</h1>
          <h1><span>Logistics Buyer</span></h1>
          <p>Start managing your logistics operations efficiently</p>
        </div>
      </div>
      <div className="right-side">
        <div className="auth-card register-container">
          <div className="logo"><h1>Logistics <span>Buyer</span></h1></div>
          <h2>Create an Account</h2>
          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              {input('businessName', 'Business Name *', { type: 'text', placeholder: 'Enter your business name' })}
              {input('name', 'Name *', { type: 'text', placeholder: 'Enter your name', maxLength: 50 }, (v) => v.replace(/[^A-Za-z\s]/g, ''))}
              {input('email', 'Email Address ', { type: 'email', placeholder: 'Enter your email (optional)' })}
              {input('phone', 'Phone Number *', { type: 'tel', placeholder: 'Enter your phone number', maxLength: 10 }, (v) => v.replace(/\D/g, ''))}
              <div className="input-group">
                <label htmlFor="businessTypeId">Business Type *</label>
                <select id="businessTypeId" className={`form-control ${cls('businessTypeId')}`} value={f.businessTypeId} onChange={(e) => set('businessTypeId', e.target.value)} onBlur={() => touch('businessTypeId')}>
                  <option value="" disabled>Select Business Type</option>
                  {Object.entries(BusinessTypes).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
                {err('businessTypeId') && <div className="reg-error">{err('businessTypeId')}</div>}
              </div>
              {input('gstNumber', 'GST Number', { type: 'text', placeholder: '22AAAAA0000A1Z5', maxLength: 15 }, filterGst, 'Format: 22AAAAA0000A1Z5')}
              {input('panNumber', 'PAN Number', { type: 'text', placeholder: 'AAAAA0000A', maxLength: 10 }, filterPan, 'Format: AAAAA0000A')}
              {input('aadharNumber', 'Aadhar Number', { type: 'text', placeholder: '123456789012', maxLength: 12 }, (v) => v.replace(/\D/g, '').slice(0, 12), '12-digit Aadhar number')}
              <div className="input-group terms full-width">
                <label>
                  <input type="checkbox" checked={f.terms} onChange={(e) => set('terms', e.target.checked)} onBlur={() => touch('terms')} />
                  <span>
                    I agree to the <Link to="/auth/terms-of-service" target="_blank" rel="noreferrer">Terms of Service</Link> and{' '}
                    <Link to="/auth/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</Link> of LogisticsHub. *
                  </span>
                </label>
                {err('terms') && <div className="reg-error">{err('terms')}</div>}
              </div>
              <div className="full-width">
                <button type="submit" className="reg-btn" disabled={formInvalid || isLoading}>{isLoading ? 'Creating Account...' : 'Create Account'}</button>
              </div>
              {errorMessage && <div className="auth-error-message full-width">{errorMessage}</div>}
              <div className="login full-width">
                <p>Already have an account? <Link to="/auth/login">Login</Link></p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
