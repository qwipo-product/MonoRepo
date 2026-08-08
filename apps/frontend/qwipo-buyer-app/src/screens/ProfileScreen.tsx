import { Icon, StatusBar } from '../components/Icons';
import BottomNav from '../components/BottomNav';
import { userProfile, notifications } from '@mockups/mock-data';

export default function ProfileScreen({ cartCount, onNavigate, onOpenSubPage, onSignOut }: any) {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      <StatusBar />
      <div className="screen-body profile-screen-v2">
        <div className="profile-topbar">
          <img className="profile-topbar-word" src="/brand/qwipo-logo.svg" alt="Qwipo" />
        </div>

        <button className="profile-person-row" onClick={() => onOpenSubPage('business-details')}>
          <span className="profile-person-icon">
            <Icon.UserCircle size={30} />
          </span>
          <span className="profile-person-text">
            <span className="profile-person-name">{userProfile.name}</span>
            <span className="profile-person-phone">{userProfile.phone.replace(/^\+91\s?/, '')}</span>
          </span>
          <Icon.ChevronRight />
        </button>

        <div className="profile-menu-list-v2">
          <button className="profile-menu-item-v2" onClick={() => onOpenSubPage('my-orders')}>
            <span className="profile-menu-icon-v2">
              <Icon.Briefcase />
            </span>
            <span className="profile-menu-label-v2">My Orders</span>
            <Icon.ChevronRight />
          </button>
          <button className="profile-menu-item-v2" onClick={() => onOpenSubPage('payment')}>
            <span className="profile-menu-icon-v2">
              <Icon.CreditCard />
            </span>
            <span className="profile-menu-label-v2">Payments</span>
            <Icon.ChevronRight />
          </button>
          <button className="profile-menu-item-v2" onClick={() => onOpenSubPage('credit')}>
            <span className="profile-menu-icon-v2">
              <Icon.Users />
            </span>
            <span className="profile-menu-label-v2">Credit Partners</span>
            <Icon.ChevronRight />
          </button>
          <button className="profile-menu-item-v2" onClick={() => onNavigate('notifications')}>
            <span className="profile-menu-icon-v2">
              <Icon.Bell />
            </span>
            <span className="profile-menu-label-v2">Notifications</span>
            {unreadCount > 0 && <span className="profile-menu-badge">{unreadCount}</span>}
            <Icon.ChevronRight />
          </button>
        </div>

        <div className="profile-footer-links">
          <button className="profile-footer-link" onClick={() => onOpenSubPage('help')}>
            Contact Us
          </button>
          <button className="profile-footer-link" onClick={() => onOpenSubPage('terms')}>
            Terms and Conditions
          </button>
          <button className="profile-footer-link danger" onClick={onSignOut}>
            <Icon.LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <BottomNav active="profile" cartCount={cartCount} onNavigate={onNavigate} />
    </>
  );
}
