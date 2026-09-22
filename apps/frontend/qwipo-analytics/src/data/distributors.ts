// Distributors screen data — leaderboard (all 18), beats, scheme placeholders.
// Priority chips follow the PRD rule (Spotlight / Push in beats / Nurture) but
// activation needs the retailer↔distributor mapping feed.

export interface DistributorRow {
  name: string;
  city: string;
  orders: number;
  value: number; // ₹L
  change: number; // % vs Jul
  delivery: number; // %
  cancel: number; // %
  priority: 'Spotlight' | 'Push in beats' | 'Nurture';
}

export const distributorRows: DistributorRow[] = [
  { name: 'Sri Balaji Agencies', city: 'Hyderabad', orders: 231, value: 7.9, change: 21, delivery: 68, cancel: 21.4, priority: 'Spotlight' },
  { name: 'S R Enterprises', city: 'Secunderabad', orders: 164, value: 5.6, change: 8, delivery: 66, cancel: 22.1, priority: 'Spotlight' },
  { name: 'Vijaya Distributors', city: 'Warangal', orders: 127, value: 4.4, change: -9, delivery: 52, cancel: 31.2, priority: 'Push in beats' },
  { name: 'Annapurna Traders', city: 'Hyderabad', orders: 118, value: 3.9, change: 4, delivery: 64, cancel: 23.8, priority: 'Spotlight' },
  { name: 'Lakshmi Agencies', city: 'Nizamabad', orders: 92, value: 3.1, change: 1, delivery: 55, cancel: 27.8, priority: 'Push in beats' },
  { name: 'Sai Krishna Agencies', city: 'Hyderabad', orders: 86, value: 2.9, change: 6, delivery: 63, cancel: 24.2, priority: 'Push in beats' },
  { name: 'Sri Venkateswara Agencies', city: 'Karimnagar', orders: 42, value: 1.4, change: 7, delivery: 61, cancel: 25.0, priority: 'Push in beats' },
  { name: 'Balaji Traders', city: 'Hyderabad', orders: 39, value: 1.3, change: 3, delivery: 60, cancel: 24.6, priority: 'Nurture' },
  { name: 'Om Sri Distributors', city: 'Sangareddy', orders: 36, value: 1.2, change: -2, delivery: 58, cancel: 26.3, priority: 'Nurture' },
  { name: 'Hanuman Agencies', city: 'Secunderabad', orders: 33, value: 1.1, change: 5, delivery: 62, cancel: 23.1, priority: 'Nurture' },
  { name: 'Sri Raghavendra Traders', city: 'Warangal', orders: 30, value: 1.0, change: 9, delivery: 59, cancel: 25.8, priority: 'Push in beats' },
  { name: 'Krishna Enterprises', city: 'Hyderabad', orders: 27, value: 0.9, change: 2, delivery: 61, cancel: 24.0, priority: 'Nurture' },
  { name: 'Durga Agencies', city: 'Nizamabad', orders: 26, value: 0.9, change: -4, delivery: 56, cancel: 26.9, priority: 'Nurture' },
  { name: 'Sri Sai Distributors', city: 'Karimnagar', orders: 24, value: 0.8, change: 11, delivery: 63, cancel: 22.5, priority: 'Push in beats' },
  { name: 'Manikanta Agencies', city: 'Hyderabad', orders: 21, value: 0.7, change: 6, delivery: 60, cancel: 23.4, priority: 'Nurture' },
  { name: 'Vasavi Traders', city: 'Sangareddy', orders: 18, value: 0.6, change: 1, delivery: 57, cancel: 25.2, priority: 'Nurture' },
  { name: 'Padmavati Enterprises', city: 'Secunderabad', orders: 15, value: 0.5, change: -1, delivery: 58, cancel: 24.8, priority: 'Nurture' },
  { name: 'Govinda Agencies', city: 'Hyderabad', orders: 13, value: 0.4, change: 14, delivery: 65, cancel: 21.9, priority: 'Nurture' },
];

/** Top sales beats by value (Sales Beat Name from the order register). */
export const topBeats = [
  { label: 'Ring Road Prime 1A · Sri Balaji', n: 214, value: '₹4.2L', tone: 'dim' as const },
  { label: 'Kukatpally North · Sri Balaji', n: 168, value: '₹3.1L', tone: 'dim' as const },
  { label: 'Secunderabad Central · S R Ent.', n: 142, value: '₹2.8L', tone: 'dim' as const },
  { label: 'Warangal Main · Vijaya', n: 104, value: '₹2.1L', tone: 'dim' as const },
  { label: 'LB Nagar East · Annapurna', n: 96, value: '₹1.9L', tone: 'dim' as const },
  { label: 'Nizamabad Town · Lakshmi', n: 71, value: '₹1.4L', tone: 'dim' as const },
];
