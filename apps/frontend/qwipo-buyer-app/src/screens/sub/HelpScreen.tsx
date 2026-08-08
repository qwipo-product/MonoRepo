import { Icon, StatusBar } from '../../components/Icons';

const OFFICE_TIMING = '09:00 AM to 6:00 PM - IST';
const SUPPORT_EMAIL = 'info@qwipo.com';
const SUPPORT_PHONE = '9121222836';
const ADVISOR_NAME = 'Vinodkumar Musku';
const ADVISOR_PHONE = '9100466765';

export default function HelpScreen({ onBack }: any) {
  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>Contact Us</h1>
          </div>
        </div>

        <div className="contact-body">
          <p className="contact-intro">If you have any query or need any further help</p>

          <ContactIllustration />

          <div className="contact-brand-row">
            <img className="contact-brand-word" src="/brand/qwipo-logo.svg" alt="Qwipo" />
          </div>

          <div className="contact-info-list">
            <div className="contact-info-row">
              <span className="contact-info-icon">
                <Icon.Clock size={18} />
              </span>
              <span className="contact-info-text">
                <span className="contact-info-label">Office Timing</span>
                <span className="contact-info-value">{OFFICE_TIMING}</span>
              </span>
            </div>
            <div className="contact-info-row">
              <span className="contact-info-icon">
                <Icon.Mail size={18} />
              </span>
              <span className="contact-info-text">
                <span className="contact-info-label">Email Address</span>
                <span className="contact-info-value">{SUPPORT_EMAIL}</span>
              </span>
            </div>
            <div className="contact-info-row">
              <span className="contact-info-icon">
                <Icon.Phone size={18} />
              </span>
              <span className="contact-info-text">
                <span className="contact-info-label">Customer Care Number</span>
                <span className="contact-info-value">{SUPPORT_PHONE}</span>
              </span>
            </div>
          </div>

          <div className="advisor-card">
            <div className="advisor-card-title">Your Business Advisor</div>
            <div className="advisor-card-row">
              <span className="advisor-card-icon">
                <Icon.MapPin size={16} />
              </span>
              <span className="advisor-card-text">
                <span className="advisor-card-name">{ADVISOR_NAME}</span>
                <span className="advisor-card-phone">{ADVISOR_PHONE}</span>
              </span>
              <a className="advisor-call-btn" href={`tel:${ADVISOR_PHONE}`} aria-label="Call business advisor">
                <Icon.Phone size={16} color="#ffffff" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ContactIllustration() {
  return (
    <svg
      className="contact-illustration"
      viewBox="0 0 260 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="10" y="20" width="120" height="86" rx="4" fill="#F3F4F6" />
      <rect x="20" y="30" width="100" height="8" rx="2" fill="#E5E7EB" />
      <rect x="20" y="44" width="70" height="6" rx="2" fill="#E5E7EB" />
      <circle cx="220" cy="46" r="8" fill="#EDE9FE" />
      <ellipse cx="150" cy="182" rx="80" ry="8" fill="#F3F4F6" />
      <rect x="120" y="90" width="80" height="60" rx="4" fill="#1F2937" />
      <rect x="128" y="98" width="64" height="40" rx="2" fill="#EDE9FE" />
      <rect x="150" y="150" width="20" height="14" fill="#1F2937" />
      <rect x="136" y="164" width="48" height="6" rx="2" fill="#1F2937" />
      <path d="M100 178 Q160 150 160 110 L160 96 Q160 84 148 84 L128 84 Q116 84 116 96 L116 130 Q116 160 100 178 Z" fill="#BC77FF" />
      <circle cx="138" cy="66" r="18" fill="#F3D5B5" />
      <path d="M120 62 Q138 46 156 62 L156 54 Q138 40 120 54 Z" fill="#2A2F3A" />
      <path d="M126 100 L100 178 M150 100 L172 178" stroke="#3F2D6B" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="160" cy="78" r="4" fill="#3F2D6B" />
      <path d="M160 78 Q172 70 174 58" stroke="#3F2D6B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="176" cy="54" r="6" fill="#F3D5B5" />
      <path d="M118 60 Q112 66 116 76" stroke="#3F2D6B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="30" y="150" width="16" height="20" rx="3" fill="#EDE9FE" />
      <ellipse cx="38" cy="148" rx="10" ry="6" fill="#86EFAC" />
    </svg>
  );
}
