import { Icon, StatusBar } from '../../components/Icons';

const NAV_LINKS = [
  ['Home', 'About Us'],
  ['Services', 'Blogs'],
  ['Career', 'Partners'],
];

const SOCIAL = ['in', 'f', 'ig', 'X', 'P', ''];

export default function TermsConditionsScreen({ onBack }: any) {
  return (
    <>
      <StatusBar />
      <div className="screen-body terms-webview">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>Terms & Conditions</h1>
          </div>
        </div>

        <div className="terms-site-header">
          <img className="terms-site-logo" src="/brand/qwipo-primary.svg" alt="" />
          <img className="terms-site-word" src="/brand/qwipo-logo.svg" alt="Qwipo" />
          <button className="terms-site-menu" aria-label="Menu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>

        <div className="terms-dark-body">
          <div className="terms-brand-block">
            <img className="terms-brand-logo" src="/brand/qwipo-primary-white.svg" alt="" />
            <img className="terms-brand-word" src="/brand/qwipo-logo-dark.svg" alt="Qwipo" />
          </div>

          <div className="terms-phone-row">
            <Icon.Phone size={16} color="#e5e7eb" />
            <span>+91 9121222836</span>
          </div>

          <div className="terms-nav-grid">
            {NAV_LINKS.map((pair, i) => (
              <div className="terms-nav-row" key={i}>
                {pair.map((label) => (
                  <span className="terms-nav-link" key={label}>
                    {label}
                  </span>
                ))}
              </div>
            ))}
            <div className="terms-nav-row">
              <span className="terms-nav-link">Contact Us</span>
            </div>
            <div className="terms-nav-row" style={{ marginTop: 8 }}>
              <span className="terms-nav-link">Privacy Policy</span>
              <span className="terms-nav-link">Terms of Use</span>
            </div>
          </div>

          <div className="terms-divider" />

          <div className="terms-lets-talk">Let's Talk →</div>

          <div className="terms-copyright">© 2024 Qwipo. All rights reserved</div>
          <div className="terms-legal-line">
            Cookie Settings, Anti-Spam, Privacy, User agreement, Legal Notice and Responsible Disclosure
          </div>

          <div className="terms-address-block">
            <div className="terms-address-head">
              <Icon.MapPin size={18} color="#ffffff" />
              <span>Address</span>
            </div>
            <div className="terms-address-label">Corporate Office:</div>
            <div className="terms-address-text">
              Divyasree Trinity, Isprout Co-working Space,
              <br />
              7th Floor, A-Wing, Plot No.5, at Hitech City Layout,
              <br />
              Survey No 64(Part) Madhapur Village,
              <br />
              Serilingampally Mandal, R R District.
              <br />
              Hyderabad Telangana, 500081
            </div>
          </div>

          <div className="terms-social-row">
            {SOCIAL.map((s, i) => (
              <span className="terms-social-icon" key={i}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
