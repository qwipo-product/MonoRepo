// Phase 1 pages of the two cross-dock users. Each one is a placeholder that says what the page is for and what it
// will do, from the 10 Nov 2026 cross-dock meetings and the "Cross-Dock Delivery - Business Walkthrough" deck.
// Status names are indicative: the final names come with the user stories.
import type { ProfileKey } from '../../profiles';

export interface Phase1Page {
  profile: ProfileKey;
  /** Full path; must match an entry in that profile's menu (src/profiles.ts). */
  path: string;
  title: string;
  purpose: string;
  willDo: string[];
  /** Order statuses this user sets on this page. */
  statuses?: string[];
}

export const PHASE1_PAGES: Phase1Page[] = [
  // ------------------------------------------------------------------ Service Centre
  {
    profile: 'SERVICE_CENTRE',
    path: '/service-centre/orders',
    title: 'Cross-dock Orders',
    purpose: 'Orders distributors have accepted for retailers inside a Cross Dock Store area, waiting to be picked up.',
    willDo: [
      'Orders arrive on their own when a distributor accepts them in the Seller Store. Orders for retailers outside every CDS area go back to the distributor as direct delivery.',
      'Grouped by distributor (where to pick up) and by Cross Dock Store (where to drop).',
      'Shows order count and weight per distributor and per CDS, and which pickup round each order is in.',
    ],
    statuses: ['Accepted', 'Pickup Planned', 'Picked Up', 'Dropped at CDS'],
  },
  {
    profile: 'SERVICE_CENTRE',
    path: '/service-centre/pickup-planning',
    title: 'Pickup Planning',
    purpose: 'Plan trips that pick up from distributors and drop at one or more Cross Dock Stores.',
    willDo: [
      'The drop point is the Cross Dock Store, not the retailer. One pickup can feed several CDSs.',
      'Two rounds between about 2 PM and 8 PM, once the order slot closes, plus an optional early-morning top-up that reaches the CDS by noon.',
      'Plan by load and vehicle: one pickup or several pickups per trip.',
    ],
    statuses: ['Pickup Planned'],
  },
  {
    profile: 'SERVICE_CENTRE',
    path: '/service-centre/return-planning',
    title: 'Return Planning',
    purpose: 'Collect returns held at Cross Dock Stores and take them back to their distributors.',
    willDo: [
      'Lists the returns waiting at each CDS. Returns are light, about 4 in 100 orders.',
      'Collection window of about 11 AM to 2 PM.',
      'One trip can collect from several CDSs and drop at several distributors.',
    ],
  },
  {
    profile: 'SERVICE_CENTRE',
    path: '/service-centre/trips',
    title: 'Trips',
    purpose: 'Every pickup and return trip, with its vehicle and driver.',
    willDo: [
      'Assign three-wheeler or four-wheeler cargo vehicles and drivers.',
      'Mark Picked Up at the distributor and Dropped at CDS at each stop.',
      'Follow trips live on the map.',
    ],
    statuses: ['Picked Up', 'Dropped at CDS'],
  },
  {
    profile: 'SERVICE_CENTRE',
    path: '/service-centre/network',
    title: 'CDS Network',
    purpose: 'The Cross Dock Stores this Service Centre feeds, and the distributors it picks up from.',
    willDo: [
      'Each Cross Dock Store with its delivery area, drawn as a polygon of about 2.5 to 3 km.',
      'Distributors mapped to this Service Centre, and the CDSs their area overlaps.',
      'These areas decide which orders are cross-dock and which go direct.',
    ],
  },
  {
    profile: 'SERVICE_CENTRE',
    path: '/service-centre/reports',
    title: 'Reports',
    purpose: 'Pickups, drops and returns by day, distributor and Cross Dock Store.',
    willDo: ['Orders and weight moved to each CDS.', 'Drops that reached the CDS before noon.', 'Returns collected and handed back to distributors.'],
  },
  {
    profile: 'SERVICE_CENTRE',
    path: '/service-centre/settings',
    title: 'Settings',
    purpose: 'Service Centre profile, vehicles and timings.',
    willDo: ['Profile and contact details.', 'Vehicles and drivers.', 'Pickup rounds and the returns window.'],
  },

  // ------------------------------------------------------------------ Cross Dock Store
  {
    profile: 'CROSS_DOCK_STORE',
    path: '/cross-dock/inward',
    title: 'Inward',
    purpose: 'Goods arriving on Service Centre trucks. Check them in before sorting.',
    willDo: [
      'Drops expected today, by distributor and by truck.',
      'Receive each order (GRN) and record short, damaged or excess items.',
      'Received orders move on to sorting per retailer.',
    ],
    statuses: ['Received at CDS'],
  },
  {
    profile: 'CROSS_DOCK_STORE',
    path: '/cross-dock/orders',
    title: 'Orders',
    purpose: 'Orders to deliver, grouped by retailer across every seller.',
    willDo: [
      'One retailer, one drop, however many distributors the orders came from.',
      'Shows the amount to collect on delivery, by cash or UPI.',
      'Follows each order from Received at CDS to Delivered or Returned.',
    ],
    statuses: ['Received at CDS', 'Ready to Dispatch'],
  },
  {
    profile: 'CROSS_DOCK_STORE',
    path: '/cross-dock/delivery-planning',
    title: 'Delivery Planning',
    purpose: 'Plan two-wheeler delivery runs from the store.',
    willDo: [
      '15 to 30 orders per rider per run, within about 1 to 2 km.',
      'Riders start from about 12 to 1 PM and come back for the next run.',
      "Pack each rider's orders in drop order.",
    ],
    statuses: ['Ready to Dispatch', 'Out for Delivery'],
  },
  {
    profile: 'CROSS_DOCK_STORE',
    path: '/cross-dock/trips',
    title: 'Trips',
    purpose: 'Rider runs, live.',
    willDo: [
      'Out for Delivery, Delivered and Returned for each drop.',
      "Riders' updates from the Field Agent App go to the Seller Store and on to the retailer's Buyer App.",
      'Follow riders on the map.',
    ],
    statuses: ['Out for Delivery', 'Delivered', 'Returned'],
  },
  {
    profile: 'CROSS_DOCK_STORE',
    path: '/cross-dock/returns',
    title: 'Returns',
    purpose: 'Items riders brought back, held for the Service Centre.',
    willDo: [
      'Logged when the rider hands them in.',
      'Kept at the store until the Service Centre returns trip, about 11 AM to 2 PM.',
      'Handed over against that trip.',
    ],
  },
  {
    profile: 'CROSS_DOCK_STORE',
    path: '/cross-dock/cash',
    title: 'Cash & Deposits',
    purpose: 'What riders collected and what the store deposits to Qwipo.',
    willDo: [
      'Collections per rider, split into cash and UPI.',
      'Daily deposit to Qwipo by UPI or bank transfer.',
      'Deliveries done and the amount expected, for offline settlement in Phase 1. No invoices yet.',
    ],
  },
  {
    profile: 'CROSS_DOCK_STORE',
    path: '/cross-dock/reports',
    title: 'Reports',
    purpose: 'Deliveries, returns and collections by day.',
    willDo: ['Orders delivered and returned per rider.', 'Cash and UPI collected against the amount expected.', 'Inward drops received and their discrepancies.'],
  },
  {
    profile: 'CROSS_DOCK_STORE',
    path: '/cross-dock/settings',
    title: 'Settings',
    purpose: 'Store profile, delivery area and riders.',
    willDo: ['Store profile and address.', 'Delivery area (polygon).', 'Riders.'],
  },
];
