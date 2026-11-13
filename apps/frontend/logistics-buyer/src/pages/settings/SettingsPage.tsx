// Settings shell (spec 07 §2). 7 tabs; the active tab is computed ONCE on mount from the URL and afterwards only by
// tab clicks (as-built: it goes stale on back/forward and on the sidebar "Settings" re-click; /settings/store and
// /settings/addresses highlight no tab).
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import './SettingsPage.css';

/** route segment → internal tab id (insertion order matters for setActiveTabFromRoute). */
const routeToTabMap: [string, string][] = [
  ['profile', 'profile'],
  ['store', 'company'],
  ['addresses', 'notifications'],
  ['delivery', 'security'],
  ['beats', 'beats'],
  ['clusters', 'clusters'],
  ['payment', 'payment'],
  ['users', 'billing'],
  ['category-sequence', 'category-sequence'],
];
const tabIdFor = (key: string) => routeToTabMap.find(([seg]) => seg === key)?.[1] || 'profile';

const TABS: { key: string; activeId: string; icon: string; label: string }[] = [
  { key: 'profile', activeId: 'profile', icon: 'fas fa-user-circle', label: ' Profile ' },
  { key: 'delivery', activeId: 'security', icon: 'fas fa-truck', label: ' Delivery ' },
  { key: 'beats', activeId: 'beats', icon: 'fas fa-map-marker-alt', label: ' Beats ' },
  { key: 'clusters', activeId: 'clusters', icon: 'fas fa-layer-group', label: ' Clusters ' },
  { key: 'category-sequence', activeId: 'category-sequence', icon: 'fas fa-list-ol', label: ' Category Sequence ' },
  { key: 'payment', activeId: 'payment', icon: 'fas fa-credit-card', label: ' Payment ' },
  { key: 'users', activeId: 'billing', icon: 'fas fa-users', label: ' Users & Permissions ' },
];

export default function SettingsPage() {
  const { hasView } = usePagePermissions('buyer_settings');
  const location = useLocation();
  const navigate = useNavigate();

  // setActiveTabFromRoute() — runs only once (ngOnInit), no router-event subscription.
  const [activeTab, setActiveTab] = useState<string>(() => {
    let tab = 'profile';
    for (const [seg, id] of routeToTabMap) {
      if (location.pathname.includes('/' + seg)) {
        tab = id;
        break;
      }
    }
    return tab;
  });

  const navigateTo = (key: string) => {
    setActiveTab(tabIdFor(key));
    navigate(`/settings/${key}`);
  };

  // *ngIf="hasView" around the whole template → blank page area.
  if (!hasView) return null;

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="header-left">
          <h1>
            <i className="fas fa-cog" /> Settings
          </h1>
          <p className="subtitle">Customize your preferences, manage account details, and configure app options.</p>
        </div>
      </header>
      <div className="content-container">
        <div className="tabs-container">
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.key} className={`tab-btn${activeTab === t.activeId ? ' active' : ''}`} onClick={() => navigateTo(t.key)}>
                <i className={t.icon} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
