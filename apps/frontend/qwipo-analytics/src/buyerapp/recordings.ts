export const RECORDING_PAGES = ['Home', 'Product List', 'Search', 'Cart', 'Checkout', 'Order Summary', 'Onboarding'] as const;

export const SIGNALS = [
  'Rage clicks',
  'Dead clicks',
  'Excessive scrolling',
  'Repeated navigation',
  'Unexpected back',
  'Failed interaction',
  'Left without finishing',
] as const;

export type Signal = (typeof SIGNALS)[number];

/** Plain-English meaning of each problem, for hover help. */
export const SIGNAL_INFO: Record<Signal, string> = {
  'Rage clicks': 'The buyer tapped the same spot again and again, usually because nothing happened.',
  'Dead clicks': 'The buyer tapped something that looks tappable but does nothing.',
  'Excessive scrolling': 'Scrolled up and down a lot without acting, often lost or searching.',
  'Repeated navigation': 'Went back and forth between the same screens several times.',
  'Unexpected back': 'Pressed back in the middle of a task, before finishing it.',
  'Failed interaction': 'An action returned an error: upload, add to cart, coupon or order.',
  'Left without finishing': 'Closed the app or left the page before completing the task.',
};

/** Base 7-day count of recordings showing each signal, per page. */
export const SIGNAL_COUNTS: Record<string, Partial<Record<Signal, number>>> = {
  Home: { 'Rage clicks': 64, 'Dead clicks': 120, 'Excessive scrolling': 210, 'Repeated navigation': 75, 'Unexpected back': 40, 'Left without finishing': 380 },
  'Product List': { 'Rage clicks': 131, 'Dead clicks': 96, 'Excessive scrolling': 180, 'Repeated navigation': 110, 'Unexpected back': 70, 'Failed interaction': 85, 'Left without finishing': 290 },
  Search: { 'Rage clicks': 57, 'Dead clicks': 44, 'Excessive scrolling': 95, 'Repeated navigation': 130, 'Unexpected back': 60, 'Failed interaction': 30, 'Left without finishing': 210 },
  Cart: { 'Rage clicks': 212, 'Dead clicks': 70, 'Repeated navigation': 90, 'Unexpected back': 120, 'Failed interaction': 60, 'Left without finishing': 340 },
  Checkout: { 'Rage clicks': 48, 'Dead clicks': 32, 'Unexpected back': 85, 'Failed interaction': 40, 'Left without finishing': 160 },
  'Order Summary': { 'Rage clicks': 164, 'Dead clicks': 88, 'Repeated navigation': 50, 'Unexpected back': 95, 'Failed interaction': 72, 'Left without finishing': 220 },
  Onboarding: { 'Rage clicks': 88, 'Dead clicks': 60, 'Repeated navigation': 70, 'Unexpected back': 110, 'Failed interaction': 120, 'Left without finishing': 474 },
};

export interface Recording {
  id: string;
  buyer: string;
  city: string;
  page: (typeof RECORDING_PAGES)[number];
  signals: Signal[];
  note: string;
  duration: string;
  when: string;
}

export const RECORDINGS: Recording[] = [
  { id: 'r1', buyer: 'QW-20931', city: 'Hyderabad', page: 'Onboarding', signals: ['Failed interaction', 'Rage clicks', 'Left without finishing'], note: 'KYC photo upload failed twice, then left', duration: '6m 12s', when: '22 Aug, 10:42 AM' },
  { id: 'r2', buyer: 'QW-10482', city: 'Hyderabad', page: 'Cart', signals: ['Rage clicks', 'Failed interaction'], note: 'Cart update failed, tapped Checkout 6 times', duration: '5m 02s', when: '22 Aug, 12:05 PM' },
  { id: 'r3', buyer: 'QW-11873', city: 'Vijayawada', page: 'Order Summary', signals: ['Failed interaction', 'Left without finishing'], note: 'Order failed: price changed', duration: '2m 36s', when: '22 Aug, 9:02 AM' },
  { id: 'r4', buyer: 'QW-08817', city: 'Vijayawada', page: 'Order Summary', signals: ['Dead clicks', 'Unexpected back'], note: 'Tapped the coupon text, nothing happened', duration: '3m 44s', when: '22 Aug, 10:31 AM' },
  { id: 'r5', buyer: 'QW-09540', city: 'Warangal', page: 'Product List', signals: ['Excessive scrolling', 'Repeated navigation'], note: 'Scrolled the list 40+ times, switched sellers 5 times', duration: '2m 12s', when: '21 Aug, 1:14 PM' },
  { id: 'r6', buyer: 'QW-20877', city: 'Guntur', page: 'Onboarding', signals: ['Failed interaction', 'Unexpected back'], note: 'Invalid GSTIN three times, went back', duration: '3m 40s', when: '21 Aug, 6:15 PM' },
  { id: 'r7', buyer: 'QW-12650', city: 'Visakhapatnam', page: 'Cart', signals: ['Left without finishing'], note: 'Saw Proceed Anyway (MOV not met), closed it', duration: '1m 58s', when: '21 Aug, 3:20 PM' },
  { id: 'r8', buyer: 'QW-13302', city: 'Hyderabad', page: 'Search', signals: ['Repeated navigation', 'Left without finishing'], note: 'Searched “jaggery powder” 4 ways, no results', duration: '2m 50s', when: '21 Aug, 11:47 AM' },
  { id: 'r9', buyer: 'QW-09214', city: 'Guntur', page: 'Checkout', signals: ['Unexpected back', 'Repeated navigation'], note: 'Changed delivery date twice, back to cart', duration: '3m 10s', when: '21 Aug, 7:45 PM' },
  { id: 'r10', buyer: 'QW-14518', city: 'Warangal', page: 'Home', signals: ['Dead clicks', 'Excessive scrolling'], note: 'Tapped KPI cards that don’t open anything', duration: '1m 34s', when: '20 Aug, 5:05 PM' },
  { id: 'r11', buyer: 'QW-07734', city: 'Guntur', page: 'Product List', signals: ['Failed interaction', 'Rage clicks'], note: 'Add didn’t work: out of stock at seller', duration: '2m 21s', when: '20 Aug, 2:40 PM' },
  { id: 'r12', buyer: 'QW-15027', city: 'Visakhapatnam', page: 'Home', signals: ['Left without finishing'], note: 'Opened Home, left within 20 seconds', duration: '0m 21s', when: '20 Aug, 9:12 AM' },
];
