import './auth.css';

// Structure (headings) mirrors the original legal pages; body copy is placeholder text, not the original.
const TERMS = [
  'General', 'Key Definitions:', 'User Agreement:', 'About Us', 'Account Registration', 'Communications', 'Product Accuracy', 'Pricing & Charges',
  'Pricing & Charges', 'Delivery', 'Mode of Payment', 'Security', 'User Obligations', 'Copyright Policy', 'Copyright Complaints', 'Amendment Policy',
  'Indemnification & Liability Disclaimer', 'Indemnification', 'Warranties & Liabilities', 'Notices & Dispute Resolution', 'Privacy',
  'Miscellaneous Provisions', 'Return, Exchange, Refund, Order Modification & Cancellation Policy', 'Return & Exchange',
  'Order Modification & Cancellation', 'Contact Us',
];
const PRIVACY = [
  'Definitions', 'Overview', 'External Links on the Website/App', 'Our Use of Your Information', 'Cookies', 'Confidentiality',
  'Disclosure of Your Information to Third Parties', 'Accessing, Reviewing, and Changing Your Profile', 'Security', 'Indemnity', 'Severability', 'Amendment',
];
const PLACEHOLDER = 'Placeholder text for the replica. The production page contains the full legal copy for this section.';

export function TermsOfServicePage() {
  return (
    <div className="legal-container terms-container">
      <h1>Terms of Use</h1>
      {TERMS.map((h, i) => (
        <section key={i}>
          <h2>{h}</h2>
          <p>{PLACEHOLDER}</p>
          {h === 'Contact Us' && <p>Email: <a href="mailto:support@example.com">support@example.com</a></p>}
        </section>
      ))}
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="legal-container privacy-policy-container">
      <h1>Privacy Policy</h1>
      <p>{PLACEHOLDER}</p>
      {PRIVACY.map((h, i) => (
        <section key={i}>
          <h2>{h}</h2>
          <p>{PLACEHOLDER}</p>
        </section>
      ))}
      <p className="disclaimer">Last Updated: February 2025</p>
    </div>
  );
}
