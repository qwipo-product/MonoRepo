// Sales deep page — same reconciled Aug 2026 baseline as overview.ts, plus the
// drilled state for the "91 open orders past 4 days" attention item.
import type { Kpi } from './overview';

export const salesKpis: Kpi[] = [
  { label: 'Orders', value: '1,142', change: '↑ 8.1%', trend: 'up', note: '1,056' },
  { label: 'Order value', value: '₹38.6L', change: '↑ 11.2%', trend: 'up', note: '₹34.7L' },
  { label: 'Avg order value', value: '₹3,380', change: '↑ 2.9%', trend: 'up', note: '₹3,286' },
  { label: 'Delivered value', value: '₹15.0L', change: '↑ 6.4%', trend: 'up', note: '38.9% of placed' },
  { label: 'Cancelled value', value: '₹10.5L', change: '↑ 14%', trend: 'up', inverse: true, note: '27.2% of placed', target: 'error' },
  { label: 'Repeat-order rate', value: '61.7%', change: '↑ 1.2 pts', trend: 'up', note: '296 of 480 outlets' },
];

/** Month-wise order value with delivered value inside each bar. Aug = 22 days. */
export const monthly = [
  { label: 'Mar', value: 21.4, delivered: 8.6 },
  { label: 'Apr', value: 24.8, delivered: 10.1 },
  { label: 'May', value: 27.1, delivered: 11.2 },
  { label: 'Jun', value: 29.6, delivered: 12.4 },
  { label: 'Jul', value: 33.2, delivered: 13.6 },
  { label: 'Aug*', value: 38.6, delivered: 15.0 },
];

export const networkCancelRate = 24.9;

/** Cities: order value (₹L) × cancellation rate (%), dot radius from orders. */
export const cities = [
  { name: 'Hyderabad', value: 16.2, cancel: 21.8, change: '+12%', r: 22, labelLeft: true },
  { name: 'Secunderabad', value: 7.7, cancel: 22.5, change: '+9%', r: 14 },
  { name: 'Warangal', value: 5.5, cancel: 31.2, change: '-6%', r: 12 },
  { name: 'Nizamabad', value: 4.1, cancel: 27.8, change: '+3%', r: 10 },
  { name: 'Karimnagar', value: 2.9, cancel: 26.1, change: '+5%', r: 9 },
  { name: 'Sangareddy', value: 2.2, cancel: 29.6, change: '+2%', r: 8 },
];

export type Tone = 'error' | 'warning' | 'dim';
export interface BarRow { label: string; n: number; value: string; tone: Tone }

/** Target taxonomy — cancellation_reason is free text today. */
export const cancelReasons: BarRow[] = [
  { label: 'Out of stock at distributor', n: 98, value: '₹3.6L', tone: 'error' },
  { label: 'Retailer cancelled', n: 71, value: '₹2.7L', tone: 'error' },
  { label: 'Price mismatch', n: 46, value: '₹1.8L', tone: 'error' },
  { label: 'Delivery delay', n: 39, value: '₹1.5L', tone: 'error' },
  { label: 'Duplicate order', n: 18, value: '₹0.6L', tone: 'dim' },
  { label: 'Other', n: 12, value: '₹0.3L', tone: 'dim' },
];

/* ---- Drilled state: Overview → Attention → "91 open orders past 4 days" ---- */

export const drillKpis: Kpi[] = [
  { label: 'Orders', value: '91', change: '↑ 14', trend: 'up', inverse: true, note: '77 same days last month', target: 'error' },
  { label: 'Order value', value: '₹3.1L', change: '↑ 18%', trend: 'up', inverse: true, note: '₹2.6L' },
  { label: 'Avg order value', value: '₹3,406', change: '→ 0.8%', trend: 'flat', note: '₹3,380 network' },
  { label: 'Oldest order', value: '10 d', change: '↑ 2 d', trend: 'up', inverse: true, note: 'DD-260812-01984' },
  { label: 'Avg age', value: '5.8 d', change: '↑ 0.4 d', trend: 'up', inverse: true, note: 'of the 91' },
  { label: 'Outlets waiting', value: '84', change: '↑ 11', trend: 'up', inverse: true, note: '7 outlets have 2+ overdue' },
];

/** Where each of the 91 overdue orders sits now. */
export const drillStages = [
  { key: 'created', label: 'Order placed', n: 3 },
  { key: 'accepted', label: 'Accepted', n: 10 },
  { key: 'packed', label: 'Packed', n: 18 },
  { key: 'shipped', label: 'Shipped', n: 60 },
];

export const drillDistributors: BarRow[] = [
  { label: 'Sri Balaji Agencies · Hyderabad', n: 34, value: '₹1.2L', tone: 'error' },
  { label: 'Annapurna Traders · Hyderabad', n: 24, value: '₹0.8L', tone: 'error' },
  { label: 'Vijaya Distributors · Warangal', n: 13, value: '₹0.4L', tone: 'error' },
  { label: 'S R Enterprises · Secunderabad', n: 8, value: '₹0.3L', tone: 'warning' },
  { label: 'Lakshmi Agencies · Nizamabad', n: 6, value: '₹0.2L', tone: 'warning' },
  { label: '4 others', n: 6, value: '₹0.2L', tone: 'dim' },
];

/** Open orders past D4 at the end of each day, 1–22 Aug vs 1–22 Jul. */
export const overdueDaily = [53, 54, 52, 56, 59, 60, 57, 62, 65, 68, 70, 67, 72, 75, 78, 80, 77, 83, 86, 88, 90, 91];
export const overduePrev = [58, 59, 57, 60, 62, 63, 61, 64, 66, 68, 69, 67, 70, 71, 73, 74, 72, 75, 76, 78, 77, 77];
