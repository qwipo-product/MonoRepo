import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { authService } from '../api/services/auth.service';
import { useAuth } from '../hooks/useAuth';
import DataLoading from '../components/DataLoading';
import { profileOf } from '../profiles';
import { sidebarService } from './sidebarService';
import './Layout.css';

function activeMenu(url: string) {
  const has = (...p: string[]) => p.some((x) => url.includes(x));
  if (has('/orders', '/order-details', '/create-order', '/create-single-order')) return 'orders';
  if (has('/delivery-routes', '/delivery-planning', '/customer-orders', '/create-delivery-planning', '/delivery-route-details')) return 'delivery';
  if (has('/trips', '/trip-details', '/trip-order-details')) return 'trips';
  if (has('/issues')) return 'issues';
  if (has('/reports')) return 'reports';
  return '';
}

/**
 * Port of LayoutComponent (spec 00 §11). The menu is intentionally NOT permission-gated (faithful).
 * Logistics Tech keeps the original menu; the two cross-dock users get their own menu (src/profiles.ts).
 */
export default function Layout() {
  const { user } = useAuth();
  const profile = profileOf(user);
  const crossDock = profile.key !== 'LOGISTICS_TECH';
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const active = activeMenu(location.pathname + location.search);

  useEffect(() => sidebarService.setSidebarState(open), [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const toggle = () => setOpen((o) => !o);

  const item = (to: string, icon: string, label: string, isActive?: boolean) => {
    const content = (
      <>
        <i className={`fas ${icon}`} />
        {open && <span>{label}</span>}
      </>
    );
    if (isActive === undefined) {
      return (
        <NavLink to={to} className={({ isActive: a }) => `nav-item${a ? ' active' : ''}`}>
          {content}
        </NavLink>
      );
    }
    return (
      <Link to={to} className={`nav-item${isActive ? ' active' : ''}`}>
        {content}
      </Link>
    );
  };

  return (
    <div className="layout-container">
      <aside className={`sidebar${open ? '' : ' collapsed'}`}>
        <div className="sidebar-header">
          {open && (
            <div className="logo">
              <i className="fas fa-box" />
              <h1>Logistics Buyer</h1>
            </div>
          )}
          <button className="toggle-btn" onClick={toggle} aria-label="Toggle sidebar">
            <i className={`fas ${open ? 'fa-chevron-left' : 'fa-chevron-right'}`} />
          </button>
        </div>
        {crossDock && (
          <div className="profile-chip" title={`${profile.label} · ${user?.businessName ?? profile.businessName}`}>
            <i className={`fas ${profile.icon}`} />
            {open && (
              <span>
                <strong>{profile.label}</strong>
                <small>{user?.businessName ?? profile.businessName}</small>
              </span>
            )}
          </div>
        )}
        <nav className="nav-menu" aria-label={`${profile.label} menu`}>
          {crossDock ? (
            profile.menu.map((m) => <Fragment key={m.to}>{item(m.to, m.icon, m.label)}</Fragment>)
          ) : (
            <>
              {item('/orders', 'fa-box', 'Orders', active === 'orders')}
              {item('/delivery-routes', 'fa-truck', 'Delivery Planning', active === 'delivery')}
              {item('/trips', 'fa-paper-plane', 'Trips', active === 'trips')}
              {item('/reports', 'fa-chart-bar', 'Reports', active === 'reports')}
              {item('/customer-master', 'fa-users', 'Customers')}
              {item('/settings', 'fa-cog', 'Settings')}
            </>
          )}
        </nav>
      </aside>
      <main className="main-content">
        <header className="top-bar">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggle} aria-label="Toggle menu">
              <i className="fas fa-bars" />
            </button>
          </div>
          <div className="header-right">
            <div
              className="user-profile"
              ref={profileRef}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((m) => !m);
              }}
            >
              <i className="fas fa-user" />
              <div className={`user-menu${menuOpen ? ' show' : ''}`}>
                {user && (
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-email">{crossDock ? (user.businessName ?? profile.businessName) : user.email}</span>
                  </div>
                )}
                <a
                  className="menu-item sign-out"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    authService.logout();
                  }}
                >
                  <i className="fas fa-sign-out-alt" /> Sign Out
                </a>
              </div>
            </div>
          </div>
        </header>
        <div className="page-content">
          <Suspense fallback={<DataLoading />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
