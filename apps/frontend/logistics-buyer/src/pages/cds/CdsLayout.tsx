// CDS shell: the existing sidebar / top-bar layout with a role-based menu. Each role sees (and can open) only its
// own modules; the API checks the same role and the CDS store on every call.
import { Suspense, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import DataLoading from '../../components/DataLoading';
import { cdsApi, cdsAuth } from '../../api/services/cds.service';
import type { CdsPage } from '../../cds/types';
import { alertError, refreshMeta, useCdsSession, useMeta } from './ui';
import '../../layout/Layout.css';
import './cds.css';

interface MenuItem { page: CdsPage; to: string; icon: string; label: string }
const MENU: Record<'SERVICE_CENTRE' | 'CDS_USER', MenuItem[]> = {
  SERVICE_CENTRE: [
    { page: 'sc-orders', to: '/cds/orders', icon: 'fa-box', label: 'Orders' },
    { page: 'sc-pickup', to: '/cds/planning', icon: 'fa-truck-ramp-box', label: 'Planning' },
    { page: 'sc-trips', to: '/cds/trips', icon: 'fa-paper-plane', label: 'Trips' },
    { page: 'sc-reports', to: '/cds/reports', icon: 'fa-chart-bar', label: 'Reports' },
    { page: 'sc-settings', to: '/cds/settings', icon: 'fa-cog', label: 'Settings' },
    { page: 'sc-stores', to: '/cds/stores', icon: 'fa-store', label: 'CDS Stores' },
  ],
  // Same menu as LBNP: Orders, Delivery Planning, Trips, Reports, Customers, Settings. GRN and returns are in Trips.
  CDS_USER: [
    { page: 'cu-orders', to: '/cds/orders', icon: 'fa-box', label: 'Orders' },
    { page: 'cu-delivery', to: '/cds/delivery-planning', icon: 'fa-truck', label: 'Delivery Planning' },
    { page: 'cu-trips', to: '/cds/trips', icon: 'fa-paper-plane', label: 'Trips' },
    { page: 'cu-reports', to: '/cds/reports', icon: 'fa-chart-bar', label: 'Reports' },
    { page: 'cu-retailers', to: '/cds/customers', icon: 'fa-users', label: 'Customers' },
    { page: 'cu-settings', to: '/cds/settings', icon: 'fa-cog', label: 'Settings' },
  ],
};

/** Route guard: signed in to CDS and, if given, one of the pages belongs to the user's role. */
export function RequireCds({ page, children }: { page?: CdsPage | CdsPage[]; children?: React.ReactNode }) {
  useCdsSession();
  const loc = useLocation();
  if (!cdsAuth.isSignedIn()) return <Navigate to={cdsAuth.signedOut ? '/cds/login' : `/cds/login?returnUrl=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  const pages = page ? (Array.isArray(page) ? page : [page]) : [];
  if (pages.length && !pages.some((p) => cdsAuth.canView(p))) return <NoAccess />;
  return <>{children ?? <Outlet />}</>;
}
function NoAccess() {
  const navigate = useNavigate();
  return (
    <div className="cds-page"><div className="cds-empty"><i className="fas fa-lock" />Your role does not have access to this module.
      <div className="mt-2"><button className="btn btn-sm btn-primary" onClick={() => navigate(cdsAuth.home())}>Go to my home page</button></div></div></div>
  );
}
export function CdsHome() {
  return <Navigate to={cdsAuth.home()} replace />;
}

export default function CdsLayout() {
  const { user, sc, store } = useCdsSession();
  const loc = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = useMeta();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);
  if (!user) return <Navigate to="/cds/login" replace />;
  const roleLabel = sc ? 'CDS Service Centre' : 'CDS User';
  const storeName = sc ? `${meta.data?.stores.length ?? ''} CDS stores` : meta.data?.stores.find((x) => x.id === store)?.name ?? '';
  const signOut = async () => {
    await cdsApi.logout().catch(() => undefined);
    cdsAuth.clear(true);
    navigate('/cds/login', { replace: true });
  };
  const resetDemo = async () => {
    setMenuOpen(false);
    const ok = await Swal.fire({ icon: 'warning', title: 'Reset demo data?', text: 'Orders, plans, trips, GRNs, returns and collections go back to the starting demo data. You stay signed in.', showCancelButton: true, confirmButtonText: 'Reset', confirmButtonColor: '#1e3a8a', reverseButtons: true });
    if (!ok.isConfirmed) return;
    try {
      await cdsApi.resetDemo();
      refreshMeta();
      window.location.reload();
    } catch (e) {
      void alertError(e);
    }
  };
  return (
    <div className="layout-container">
      <aside className={`sidebar cds-sidebar${open ? '' : ' collapsed'}`}>
        <div className="sidebar-header">
          {open && <div className="logo"><i className="fas fa-warehouse" /><h1>{sc ? 'CDS Service Centre' : 'Cross Dock Store'}</h1></div>}
          <button className="toggle-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle sidebar"><i className={`fas ${open ? 'fa-chevron-left' : 'fa-chevron-right'}`} /></button>
        </div>
        <nav className="nav-menu" style={{ paddingTop: 12 }}>
          {MENU[user.role].filter((i) => cdsAuth.canView(i.page)).map((i) => (
            <Link key={i.to} to={i.to} title={i.label} className={`nav-item${loc.pathname.startsWith(i.to) ? ' active' : ''}`}>
              <i className={`fas ${i.icon}`} />{open && <span>{i.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="top-bar">
          <div className="header-left d-flex align-items-center gap-3">
            <button className="menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu"><i className="fas fa-bars" /></button>
            <span className="fw-semibold small"><i className={`fas ${sc ? 'fa-sitemap' : 'fa-location-dot'} text-primary me-1`} />{storeName}</span>
          </div>
          <div className="header-right">
            <span className="cds-role-chip">{roleLabel}</span>
            <div className="user-profile" ref={ref} onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}>
              <i className="fas fa-user" />
              <div className={`user-menu${menuOpen ? ' show' : ''}`}>
                <div className="user-info"><span className="user-name">{user.name}</span><span className="user-email">{roleLabel} · +91 {user.mobile}</span></div>
                <a className="menu-item" href="#" onClick={(e) => { e.preventDefault(); void resetDemo(); }}><i className="fas fa-rotate" /> Reset demo data</a>
                <a className="menu-item sign-out" href="#" onClick={(e) => { e.preventDefault(); void signOut(); }}><i className="fas fa-sign-out-alt" /> Sign Out</a>
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
