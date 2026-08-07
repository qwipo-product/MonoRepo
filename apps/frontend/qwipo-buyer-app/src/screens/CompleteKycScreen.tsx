import { useState } from 'react';
import { Icon, StatusBar } from '../components/Icons';

const BUSINESS_TYPES = [
  'Kirana',
  'Restaurant',
  'Caterers',
  'Tiffin Centers',
  'PG/Hostel',
  'Wholesale',
  'Bakery',
  'Sweet House',
  'Medicals',
  'Supermarket',
];

const DOC_FIELDS = [
  { key: 'shopImage', label: 'Shop Image', required: true },
  { key: 'ownerId', label: 'Shop Owner Photo ID', required: true },
  { key: 'gst', label: 'GST Certificate', required: false },
  { key: 'shopReg', label: 'Shop Registration Certificate', required: false },
];

export default function CompleteKycScreen({ initialBusinessType, initialLocation, onCancel, onRegister }: any) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState(initialBusinessType || '');
  const [location] = useState(initialLocation || '');
  const [typeOpen, setTypeOpen] = useState(false);
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);

  const step1Valid = name.trim().length > 0 && businessType;
  const step2Valid = docs.shopImage && docs.ownerId && agreed;

  const uploadDoc = (key: string) => setDocs((d) => ({ ...d, [key]: 'uploaded.jpg' }));

  return (
    <div className="screen-body kyc-form-screen">
      <StatusBar />
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={() => (step === 1 ? onCancel() : setStep(1))}
          aria-label="Back"
        >
          <Icon.Back />
        </button>
        <div className="top-title">
          <h1>Complete KYC</h1>
          <p>{step === 1 ? 'Basic information' : 'ID Proofs'}</p>
        </div>
      </div>

      <div className="kyc-progress">
        <span className="kyc-progress-seg on" />
        <span className={`kyc-progress-seg ${step === 2 ? 'on' : ''}`} />
      </div>

      {step === 1 && (
        <div className="kyc-form-body">
          <div className="ob-field">
            <label className="ob-label">
              Customer Name<span className="ob-req">*</span>
            </label>
            <div className="ob-input">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
            </div>
          </div>

          <div className="ob-field">
            <label className="ob-label">Customer Email</label>
            <div className="ob-input">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="ob-field">
            <label className="ob-label">Business Type</label>
            <button className="ob-input ob-select" onClick={() => setTypeOpen(true)}>
              <span className={businessType ? 'on' : 'placeholder'}>
                {businessType || 'Select business type'}
              </span>
              <Icon.ChevronDown />
            </button>
          </div>

          <div className="ob-field">
            <label className="ob-label">Shop Location</label>
            <div className="ob-input">
              <input value={location} readOnly placeholder="Fetch using GPS" />
              <button className="ob-suffix" aria-label="Shop location">
                <Icon.MapPin />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="kyc-form-body">
          {DOC_FIELDS.map((f) => (
            <div className="ob-field" key={f.key}>
              <label className="ob-label">
                {f.label}
                {f.required && <span className="ob-req">*</span>}
              </label>
              <div className="kyc-upload-row">
                <span className={`kyc-upload-name ${docs[f.key] ? 'on' : ''}`}>
                  {docs[f.key] || 'Upload here'}
                </span>
                <button className="kyc-upload-btn" onClick={() => uploadDoc(f.key)}>
                  Upload
                </button>
              </div>
            </div>
          ))}

          <label className="kyc-agree-row">
            <button
              type="button"
              className={`kyc-checkbox ${agreed ? 'on' : ''}`}
              onClick={() => setAgreed((a) => !a)}
              aria-pressed={agreed}
            >
              {agreed && <Icon.Check />}
            </button>
            <span className="kyc-agree-text">
              I have read &amp; agree to the <a>Terms of Use</a> and <a>Privacy Policy</a>
            </span>
          </label>
        </div>
      )}

      <div className="ob-footer kyc-form-footer">
        {step === 1 ? (
          <>
            <button className="kyc-secondary-btn" onClick={onCancel}>
              Cancel
            </button>
            <button
              className={`auth-cta ${step1Valid ? 'on' : ''}`}
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </>
        ) : (
          <>
            <button className="kyc-secondary-btn" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className={`auth-cta ${step2Valid ? 'on' : ''}`}
              disabled={!step2Valid}
              onClick={() => onRegister({ name, email, businessType, location })}
            >
              Register
            </button>
          </>
        )}
      </div>

      {typeOpen && (
        <div className="sheet-backdrop" onClick={() => setTypeOpen(false)}>
          <div className="sheet bt-sheet sheet-tall" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div className="sheet-header-text">
                <div className="sheet-title">Business Type</div>
              </div>
              <button className="sheet-close-btn" onClick={() => setTypeOpen(false)} aria-label="Close">
                <Icon.Close />
              </button>
            </div>
            <div className="sheet-body bt-sheet-body">
              {BUSINESS_TYPES.map((t) => (
                <button
                  key={t}
                  className={`bt-option ${t === businessType ? 'on' : ''}`}
                  onClick={() => {
                    setBusinessType(t);
                    setTypeOpen(false);
                  }}
                >
                  <span className="bt-option-label">{t}</span>
                  <span className="bt-option-dot" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
