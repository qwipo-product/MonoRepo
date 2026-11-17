import type { FunnelStepSpec } from './engine';

export interface FunnelSpec {
  id: string;
  title: string;
  steps: FunnelStepSpec[];
  /** most common routes buyers take through the funnel, with their share */
  paths: { path: string; share: number }[];
}

export const FUNNELS: FunnelSpec[] = [
  {
    id: 'purchase',
    title: 'Purchase',
    steps: [
      { label: 'Home', users: 17850, secs: 0 },
      { label: 'Search / Category / Brand / Distributor', users: 15620, secs: 25 },
      { label: 'Product list', users: 14210, secs: 18 },
      { label: 'Add to cart', users: 9960, secs: 96 },
      { label: 'Cart', users: 9120, secs: 140 },
      { label: 'Checkout', users: 7540, secs: 95 },
      { label: 'Order Summary', users: 7210, secs: 40 },
      { label: 'Place Order', users: 6530, secs: 112 },
      { label: 'Order success', users: 6318, secs: 6 },
    ],
    paths: [
      { path: 'Home → Search → Product list → Cart', share: 38 },
      { path: 'Home → Category → Product list → Cart', share: 24 },
      { path: 'Home → Distributor → Product list → Cart', share: 17 },
    ],
  },
  {
    id: 'search',
    title: 'Search',
    steps: [
      { label: 'Home', users: 17850, secs: 0 },
      { label: 'Search', users: 8340, secs: 20 },
      { label: 'Typed a search', users: 7980, secs: 9 },
      { label: 'Viewed a product', users: 6210, secs: 22 },
      { label: 'Add to cart', users: 4410, secs: 35 },
      { label: 'Checkout', users: 3270, secs: 180 },
    ],
    paths: [
      { path: 'Search → typed → product → Add', share: 46 },
      { path: 'Search → suggested search → Add', share: 21 },
      { path: 'Search → trending category → product list → Add', share: 12 },
    ],
  },
  {
    id: 'distributor',
    title: 'Distributor',
    steps: [
      { label: 'Home', users: 17850, secs: 0 },
      { label: 'Distributor', users: 7420, secs: 30 },
      { label: 'Category / product list', users: 4960, secs: 25 },
      { label: 'Product', users: 3640, secs: 40 },
      { label: 'Add to cart', users: 2310, secs: 30 },
      { label: 'Checkout', users: 1388, secs: 210 },
    ],
    paths: [
      { path: 'Home → See All → distributor → category → Add', share: 41 },
      { path: 'Distributor tab → distributor → product → Add', share: 33 },
      { path: 'Authorized Distributor → Brands tab → product → Add', share: 14 },
    ],
  },
  {
    id: 'reorder',
    title: 'Reorder',
    steps: [
      { label: 'Home / bottom menu', users: 17850, secs: 0 },
      { label: 'Reorder', users: 4620, secs: 12 },
      { label: 'Add to cart', users: 3340, secs: 50 },
      { label: 'Cart', users: 3120, secs: 30 },
      { label: 'Checkout', users: 2380, secs: 60 },
      { label: 'Order placed', users: 2134, secs: 95 },
    ],
    paths: [
      { path: 'Bottom menu → Reorder → Add all → Cart', share: 52 },
      { path: 'Home → Reorder → change quantity → Cart', share: 31 },
      { path: 'Reorder → product → Add → Cart', share: 11 },
    ],
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    steps: [
      { label: 'Onboarding started', users: 1240, secs: 0 },
      { label: 'Steps completed', users: 1006, secs: 175 },
      { label: 'KYC', users: 842, secs: 160 },
      { label: 'Address', users: 790, secs: 70 },
      { label: 'Onboarding completed', users: 766, secs: 35 },
    ],
    paths: [
      { path: 'OTP → details → KYC → address → done', share: 68 },
      { path: 'OTP → details → back → details → KYC → done', share: 17 },
      { path: 'OTP → skipped KYC → address → done', share: 9 },
    ],
  },
];
