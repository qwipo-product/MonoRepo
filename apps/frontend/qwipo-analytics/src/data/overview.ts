// Fictional, internally reconciled figures for 1 – 22 Aug 2026 vs 1 – 22 Jul 2026.
// 1,142 orders = 454 delivered + 284 cancelled + 12 returned + 392 open;
// ₹38.6L placed, ₹15.0L delivered. Colours are token names, never hex.

export type Trend = 'up' | 'down' | 'flat';

export interface Kpi {
  label: string;
  value: string;
  change: string;
  trend: Trend;
  /** true when "up" is bad (cancellations, open orders) */
  inverse?: boolean;
  note: string;
  target?: 'warning' | 'error';
}

export const kpis: Kpi[] = [
  { label: 'Orders', value: '1,142', change: '↑ 8.1%', trend: 'up', note: '1,056' },
  { label: 'Order value', value: '₹38.6L', change: '↑ 11.2%', trend: 'up', note: '₹34.7L' },
  { label: 'Avg order value', value: '₹3,380', change: '↑ 2.9%', trend: 'up', note: '₹3,286' },
  { label: 'Active outlets', value: '480', change: '↑ 5.8%', trend: 'up', note: '454' },
  { label: 'Delivered value', value: '₹15.0L', change: '↑ 6.4%', trend: 'up', note: '38.9% of placed', target: 'warning' },
];

/** ₹ lakh per day, 22 days */
export const dailyValue = [1.4, 1.6, 1.7, 1.5, 1.9, 2.0, 1.3, 1.5, 1.8, 1.9, 2.1, 1.7, 1.4, 1.6, 2.0, 2.2, 1.8, 1.5, 1.7, 1.9, 2.3, 1.8];
export const dailyPrev = dailyValue.map((v) => +(v * 0.9).toFixed(2));
export const dailyDelivered = dailyValue.map((v) => +(v * 0.39).toFixed(2));

export type Severity = 'error' | 'warning' | 'info';

export interface Attention {
  count: string;
  severity: Severity;
  title: string;
  detail: string;
  owner: string;
  goto: 'sales' | 'distributors' | 'customers' | 'brands';
  /** extra hash segment: opens the deep page with drill chips applied */
  drill?: string;
}

export const attention: Attention[] = [
  { count: '91', severity: 'error', title: 'Open orders past 4 days', detail: '₹3.1L · 58 with two Hyderabad distributors', owner: 'Logistics', goto: 'sales', drill: 'overdue' },
  { count: '2', severity: 'error', title: 'Distributors over 30% cancellation', detail: 'Vijaya 31.2% · Lakshmi 27.8% · stock-outs', owner: 'Ops', goto: 'distributors' },
  { count: '148', severity: 'warning', title: 'High-value outlets gone quiet', detail: 'No order 14+ days · ₹6.2L monthly value', owner: 'Sales', goto: 'customers' },
  { count: '3', severity: 'warning', title: 'Brands declining over 10%', detail: 'Britannia −14% · Red Label −11% · Parle-G −6%', owner: 'Companies', goto: 'brands' },
];

export const statuses = [
  { key: 'created', label: 'Order placed', orders: 92, value: 3.0 },
  { key: 'accepted', label: 'Accepted', orders: 300, value: 9.7 },
  { key: 'delivered', label: 'Delivered', orders: 454, value: 15.0 },
  { key: 'cancelled', label: 'Cancelled', orders: 284, value: 10.5 },
  { key: 'returned', label: 'Returned', orders: 12, value: 0.4 },
] as const;

/** Open orders by days since order date × current stage. */
export const ageing = {
  buckets: ['D0', 'D1', 'D2', 'D3', 'D4+'],
  rows: [
    { stage: 'Order placed', counts: [60, 20, 6, 3, 3] },
    { stage: 'Accepted', counts: [58, 74, 51, 29, 88] },
  ],
};

export const funnel = [
  { label: 'Onboarded', n: 210 },
  { label: 'Ordered', n: 117 },
  { label: 'Repeat ≥2', n: 64 },
  { label: 'Qualified', n: 48 },
];
export const newOutletsByWeek = [
  { label: '1–7', n: 24 },
  { label: '8–14', n: 19 },
  { label: '15–21', n: 15 },
  { label: '22', n: 4 },
];

export type DimensionKey = 'distributor' | 'city' | 'company' | 'category' | 'brand' | 'sku';
export interface Ranked { name: string; value: number; change: number; other?: boolean }
export interface Dimension { key: DimensionKey; label: string; total: string; rows: Ranked[] }

export const dimensions: Dimension[] = [
  { key: 'distributor', label: 'Distributors', total: '18 · ₹38.6L', rows: [
    { name: 'Sri Balaji Agencies', value: 7.9, change: 21 }, { name: 'S R Enterprises', value: 5.6, change: 8 },
    { name: 'Vijaya Distributors', value: 4.4, change: -9 }, { name: 'Annapurna Traders', value: 3.9, change: 4 },
    { name: 'Lakshmi Agencies', value: 3.1, change: 1 }, { name: 'Sai Krishna Agencies', value: 2.9, change: 6 },
    { name: '12 others', value: 10.8, change: 6, other: true } ] },
  { key: 'city', label: 'Cities', total: '6 · ₹38.6L', rows: [
    { name: 'Hyderabad', value: 16.2, change: 12 }, { name: 'Secunderabad', value: 7.7, change: 9 },
    { name: 'Warangal', value: 5.5, change: -6 }, { name: 'Nizamabad', value: 4.1, change: 3 },
    { name: 'Karimnagar', value: 2.9, change: 5 }, { name: 'Sangareddy', value: 2.2, change: 2 } ] },
  { key: 'company', label: 'Companies', total: '5 · ₹36.2L mapped', rows: [
    { name: 'Fortune (AWL)', value: 11.4, change: 18 }, { name: 'ITC', value: 9.1, change: 9 },
    { name: 'HUL', value: 7.3, change: 6 }, { name: 'Parle', value: 4.6, change: 1 },
    { name: 'Britannia', value: 3.8, change: -14 }, { name: 'Unmapped lines', value: 2.4, change: 0, other: true } ] },
  { key: 'category', label: 'Categories', total: '12 · ₹36.2L', rows: [
    { name: 'Edible oils', value: 12.1, change: 17 }, { name: 'Atta & staples', value: 7.4, change: 8 },
    { name: 'Biscuits', value: 4.1, change: -11 }, { name: 'Detergents', value: 3.9, change: 6 },
    { name: 'Beverages', value: 3.2, change: 4 }, { name: '7 others', value: 5.5, change: 3, other: true } ] },
  { key: 'brand', label: 'Brands', total: '41 · ₹36.2L', rows: [
    { name: 'Fortune Oil', value: 11.4, change: 18 }, { name: 'Aashirvaad', value: 5.3, change: 9 },
    { name: 'Sunfeast', value: 3.8, change: -4 }, { name: 'Surf Excel', value: 3.1, change: 6 },
    { name: 'Parle-G', value: 2.9, change: -6 }, { name: '36 others', value: 9.7, change: 5, other: true } ] },
  { key: 'sku', label: 'SKUs', total: '2,860 · ₹36.2L', rows: [
    { name: 'Fortune Sunflower 1L×12', value: 2.41, change: 19 }, { name: 'Aashirvaad Atta 5kg', value: 2.06, change: 8 },
    { name: 'Surf Excel 1kg', value: 1.38, change: 7 }, { name: 'Parle-G 800g', value: 0.92, change: -5 },
    { name: 'Sunfeast Dark Fantasy', value: 0.71, change: -9 }, { name: '2,855 others', value: 28.7, change: 6, other: true } ] },
];

export interface Mover { type: DimensionKey; name: string; sub: string; change: number; delta: string }
export const movers: { up: Mover[]; down: Mover[] } = {
  up: [
    { type: 'distributor', name: 'Sri Balaji Agencies', sub: '₹7.9L · 20.5% share', change: 21, delta: '₹1.4L' },
    { type: 'company', name: 'Fortune (AWL)', sub: '₹11.4L · 29.5% share', change: 18, delta: '₹1.7L' },
    { type: 'city', name: 'Hyderabad', sub: '₹16.2L · 42% share', change: 12, delta: '₹1.7L' },
    { type: 'category', name: 'Edible oils', sub: '₹12.1L · 33% share', change: 17, delta: '₹1.76L' },
    { type: 'brand', name: 'Aashirvaad (ITC)', sub: '₹5.3L', change: 9, delta: '₹0.4L' },
    { type: 'sku', name: 'Fortune Sunflower 1L×12', sub: '₹2.41L', change: 19, delta: '₹0.38L' },
  ],
  down: [
    { type: 'distributor', name: 'Vijaya Distributors', sub: '₹4.4L · 11.4% share', change: -9, delta: '₹0.4L' },
    { type: 'company', name: 'Britannia', sub: '₹3.8L · 9.8% share', change: -14, delta: '₹0.6L' },
    { type: 'city', name: 'Warangal', sub: '₹5.5L · 14.2% share', change: -6, delta: '₹0.35L' },
    { type: 'category', name: 'Biscuits', sub: '₹4.1L · 11% share', change: -11, delta: '₹0.5L' },
    { type: 'brand', name: 'Parle-G', sub: '₹2.9L', change: -6, delta: '₹0.2L' },
    { type: 'sku', name: 'Sunfeast Dark Fantasy', sub: '₹0.71L', change: -9, delta: '₹0.07L' },
  ],
};

export const dimensionLabel: Record<DimensionKey, string> = {
  distributor: 'Distributor', city: 'City', company: 'Company', category: 'Category', brand: 'Brand', sku: 'SKU',
};
