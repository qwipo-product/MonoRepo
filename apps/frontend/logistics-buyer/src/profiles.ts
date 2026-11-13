// The three demo users of the Logistics Buyer app (cross-dock model, phase 1).
//
//   Logistics Tech      — a distributor using the app for 3PL direct delivery. This is the original app, unchanged.
//   Service Centre      — the CDS Service Centre: picks up from distributors and drops at Cross Dock Stores,
//                         and carries returns from the stores back to the distributors. Moves goods only.
//   Cross Dock Store    — the CDS near the retailers: receives goods, sorts per retailer, delivers by two-wheeler,
//                         holds returns and deposits the day's collection to Qwipo. Holds no stock.
//
// Pure data: imported by both the app and the mock backend, so it must not import either.

export type ProfileKey = 'LOGISTICS_TECH' | 'SERVICE_CENTRE' | 'CROSS_DOCK_STORE';

export interface MenuItem {
  to: string;
  icon: string;
  label: string;
}

export interface DemoProfile {
  key: ProfileKey;
  /** Buyer id the mock backend returns for this user. */
  id: string;
  /** Short role name shown on the login cards, the sidebar and the mock panel. */
  label: string;
  /** One line on what this user does. */
  tagline: string;
  icon: string;
  mobile: string;
  userName: string;
  businessName: string;
  /** Backend buyer type. Logistics Tech's comes from the seeded buyer (SELF_3PL, or DARKSTORE via the mock panel). */
  buyerType: string;
  /** Where the user lands after signing in. */
  home: string;
  /** Sidebar for the new profiles. Logistics Tech keeps the original sidebar in Layout. */
  menu: MenuItem[];
  /** Cross Dock Store only: which store this user runs (its code in the cross-dock data). */
  cdsCode?: string;
}

export const PROFILES: Record<ProfileKey, DemoProfile> = {
  LOGISTICS_TECH: {
    key: 'LOGISTICS_TECH',
    id: '7d2f4c1a-5b8e-4e3a-9c61-2f0b9a7d1e44',
    label: 'Logistics Tech',
    tagline: 'Distributor delivering direct to retailers through a 3PL',
    icon: 'fa-box',
    mobile: '9876543210',
    userName: 'RAVI KUMAR',
    businessName: 'SRI VENKATA LAKSHMI DISTRIBUTORS',
    buyerType: 'SELF_3PL',
    home: '/orders',
    menu: [],
  },
  SERVICE_CENTRE: {
    key: 'SERVICE_CENTRE',
    id: 'a3c9e2b4-6d1f-4b7a-8e25-1c4f7b9d3a60',
    label: 'Service Centre',
    tagline: 'Picks up from distributors, drops at Cross Dock Stores, brings returns back',
    icon: 'fa-truck-moving',
    mobile: '9876543211',
    userName: 'SURESH REDDY',
    businessName: 'QWIPO CDS SERVICE CENTRE - HYDERABAD',
    buyerType: 'CDS_SERVICE_CENTRE',
    home: '/service-centre/orders',
    menu: [
      { to: '/service-centre/orders', icon: 'fa-box', label: 'Orders' },
      { to: '/service-centre/pickup-planning', icon: 'fa-route', label: 'Pickup Planning' },
      { to: '/service-centre/return-planning', icon: 'fa-rotate-left', label: 'Return Planning' },
      { to: '/service-centre/trips', icon: 'fa-paper-plane', label: 'Trips' },
      { to: '/service-centre/network', icon: 'fa-diagram-project', label: 'CDS Network' },
      { to: '/service-centre/reports', icon: 'fa-chart-bar', label: 'Reports' },
      { to: '/service-centre/settings', icon: 'fa-cog', label: 'Settings' },
    ],
  },
  CROSS_DOCK_STORE: {
    key: 'CROSS_DOCK_STORE',
    id: 'e81b5d07-2f4a-4c9e-b3d6-9a0e4c7f2b15',
    label: 'Cross Dock Store',
    tagline: 'Receives goods, sorts per retailer, delivers by bike, collects cash',
    icon: 'fa-store',
    mobile: '9876543212',
    userName: 'MAHESH GOUD',
    businessName: 'CROSS DOCK STORE - KPHB',
    buyerType: 'DARKSTORE',
    cdsCode: 'CDS-KPHB',
    home: '/cross-dock/inward',
    menu: [
      { to: '/cross-dock/inward', icon: 'fa-truck-ramp-box', label: 'Inward' },
      { to: '/cross-dock/orders', icon: 'fa-box', label: 'Orders' },
      { to: '/cross-dock/delivery-planning', icon: 'fa-motorcycle', label: 'Delivery Planning' },
      { to: '/cross-dock/trips', icon: 'fa-paper-plane', label: 'Trips' },
      { to: '/cross-dock/returns', icon: 'fa-rotate-left', label: 'Returns' },
      { to: '/cross-dock/cash', icon: 'fa-wallet', label: 'Cash & Deposits' },
      { to: '/cross-dock/reports', icon: 'fa-chart-bar', label: 'Reports' },
      { to: '/cross-dock/settings', icon: 'fa-cog', label: 'Settings' },
    ],
  },
};

export const PROFILE_LIST: DemoProfile[] = [PROFILES.LOGISTICS_TECH, PROFILES.SERVICE_CENTRE, PROFILES.CROSS_DOCK_STORE];

/** The new profiles have fixed numbers. Any other valid number signs in as Logistics Tech, as before. */
export function profileForMobile(mobile: string): DemoProfile {
  return PROFILE_LIST.find((p) => p.key !== 'LOGISTICS_TECH' && p.mobile === mobile) ?? PROFILES.LOGISTICS_TECH;
}

export function profileForId(id: string): DemoProfile | undefined {
  return PROFILE_LIST.find((p) => p.key !== 'LOGISTICS_TECH' && p.id === id);
}

/** Sessions saved before profiles existed have no profile: they are Logistics Tech. */
export function profileOf(user: { profile?: ProfileKey } | null | undefined): DemoProfile {
  return PROFILES[user?.profile ?? 'LOGISTICS_TECH'] ?? PROFILES.LOGISTICS_TECH;
}

export function homeFor(user: { profile?: ProfileKey } | null | undefined): string {
  return profileOf(user).home;
}
