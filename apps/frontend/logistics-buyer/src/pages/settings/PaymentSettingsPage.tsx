// /settings/payment (spec 07 §8): static "Coming Soon" placeholder. "Contact Support" has no click handler.
import './ComingSoon.css';

export default function PaymentSettingsPage() {
  return (
    <div className="payment-settings-page coming-soon-page">
      <section className="settings-section user-management-section">
        <div className="user-management-container">
          <div className="user-icon-container">
            <i className="fas fa-user-circle" />
          </div>
          <h2 className="user-management-title">Payment Settings Coming Soon</h2>
          <p className="user-management-description">
            {' Payment settings are currently disabled for POC (Proof of Concept). This feature will be available in the next release. '}
          </p>
          <button className="contact-support-btn">
            <i className="fas fa-headset" /> Contact Support
          </button>
        </div>
      </section>
    </div>
  );
}
