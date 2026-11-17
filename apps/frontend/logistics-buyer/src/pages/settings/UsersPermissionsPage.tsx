// /settings/users (spec 07 §9): static "Coming Soon" placeholder (same structure as Payment). No user list / role editor.
import './ComingSoon.css';

export default function UsersPermissionsPage() {
  return (
    <div className="users-permissions-page coming-soon-page">
      <section className="settings-section user-management-section">
        <div className="user-management-container">
          <div className="user-icon-container">
            <i className="fas fa-user-circle" />
          </div>
          <h2 className="user-management-title">User Management Coming Soon</h2>
          <p className="user-management-description">
            {' User management features are currently under development. Contact support for assistance with user access. '}
          </p>
          <button className="contact-support-btn">
            <i className="fas fa-headset" /> Contact Support
          </button>
        </div>
      </section>
    </div>
  );
}
