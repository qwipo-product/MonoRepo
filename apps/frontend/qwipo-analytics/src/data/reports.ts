// Report definitions + per-report run history (in-memory for the mockup).
// Every report generates as multi-sheet XLSX within the caller's scope.
import type { ChipData } from '../components/filters';
import type { Page, ReportDomain } from '../nav';

export interface ReportDef {
  key: string;
  /** which data source / Reports section it belongs to */
  domain: ReportDomain;
  name: string;
  desc: string;
  sheets: string[];
  /** which scope filters this report takes */
  scope: ('date' | 'company' | 'city' | 'distributor')[];
  /** report-specific filters */
  filters: { label: string; options: string[] }[];
  /** dependency / access flags */
  flags?: { label: string; variant: 'warning' | 'info' }[];
  /** has a live on-screen register view */
  live?: boolean;
  /** the dashboard page that shows this report live */
  page?: Page;
}

const TEAMS = ['All', 'Venkat Rao', 'Ramesh Chary', 'Sachin Patil', 'Vikram Rathore'];

export const reportDefs: ReportDef[] = [
  {
    key: 'order-register', domain: 'seller', scope: ['date', 'company', 'city', 'distributor'] as const, name: 'Order Register',
    desc: 'Every order line in scope — the exact 32-column single-sheet workbook business receives by mail today.',
    sheets: ['Orders'],
    filters: [{ label: 'Status', options: ['All', 'Order placed', 'Delivered', 'Cancelled', 'Returned'] }],
    live: true,
  },
  {
    key: 'open-ageing', domain: 'seller', scope: ['date', 'city', 'distributor'] as const, name: 'Open Order Ageing',
    desc: 'Open orders with stage, age bucket and value at risk, per distributor.',
    sheets: ['Ageing', 'Register'],
    filters: [{ label: 'Age', options: ['All', 'D2+', 'D4+'] }],
  },
  {
    key: 'delivery-cancellation', domain: 'seller', scope: ['date', 'company', 'city', 'distributor'] as const, name: 'Delivery & Cancellation',
    desc: 'Delivered vs cancelled with reasons and days-to-deliver.',
    sheets: ['Summary', 'Cancelled', 'Delivered'],
    filters: [{ label: 'Reason', options: ['All', 'Out of stock', 'Retailer cancelled', 'Price mismatch', 'Delivery delay'] }],
    flags: [{ label: 'needs reason taxonomy', variant: 'warning' }],
  },
  {
    key: 'distributor-performance', domain: 'seller', scope: ['date', 'city', 'distributor'] as const, name: 'Distributor Performance',
    desc: 'Leaderboard with delivery, cancellation and value per distributor, plus beat-wise sales.',
    sheets: ['Leaderboard', 'Detail', 'Beats'],
    filters: [{ label: 'City', options: ['All', 'Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad'] }],
    flags: [{ label: 'activation needs retailer mapping', variant: 'warning' }],
  },
  {
    key: 'sales-mix', domain: 'seller', scope: ['date', 'company', 'city', 'distributor'] as const, name: 'Sales Mix',
    desc: 'Full rankings behind the Contribution cards — value, share and change per dimension.',
    sheets: ['Companies', 'Categories', 'Brands', 'SKUs', 'Cities'],
    filters: [],
  },
  {
    key: 'scheme-discount', domain: 'seller', scope: ['date', 'company', 'distributor'] as const, name: 'Scheme & Discount',
    desc: 'Scheme uptake and discount impact per distributor and company.',
    sheets: ['Schemes', 'Discounts'],
    filters: [],
    flags: [{ label: 'needs scheme feed', variant: 'warning' }],
  },
  {
    key: 'customer-master', domain: 'seller', scope: ['city', 'distributor'] as const, name: 'Customer Master',
    desc: 'Outlet register with contact, geo and mapping columns.',
    sheets: ['Outlets'],
    filters: [{ label: 'Status', options: ['All', 'Active', 'Inactive'] }],
    flags: [{ label: 'Platform Admin only', variant: 'info' }],
  },
  {
    key: 'onboarding-funnel', domain: 'seller', scope: ['date', 'city', 'distributor'] as const, name: 'Onboarding Funnel',
    desc: 'Onboarded outlets with stage, cohort week and first-order dates.',
    sheets: ['Funnel', 'Outlets'],
    filters: [{ label: 'Stage', options: ['All', 'Ordered', 'Repeat', 'Qualified', 'Silent'] }],
  },
  {
    key: 'data-health', domain: 'seller', scope: ['date', 'city'] as const, name: 'Data Health',
    desc: 'What the dashboards exclude — order lines with no company mapping (₹2.4L) and outlets with unresolved GPS (64).',
    sheets: ['Unmapped lines', 'Unresolved outlets'],
    filters: [],
    flags: [{ label: 'Platform Admin only', variant: 'info' }],
  },

  /* ---------------------------- Ops (Logistics) ---------------------------- */
  {
    key: 'ops-dispatch-register', domain: 'ops', scope: ['date', 'city', 'distributor'], name: 'Dispatch Register',
    desc: 'Every dispatch with vehicle, route, drop count and proof-of-delivery status.',
    sheets: ['Dispatches', 'Drops'],
    filters: [{ label: 'POD', options: ['All', 'Captured', 'Pending', 'Failed'] }],
  },
  {
    key: 'ops-delivery-sla', domain: 'ops', scope: ['date', 'city', 'distributor'], name: 'Delivery SLA',
    desc: 'On-time vs late deliveries per distributor and route, with days-to-deliver buckets.',
    sheets: ['Summary', 'By distributor', 'Late drops'],
    filters: [{ label: 'SLA', options: ['All', 'On time', 'Late'] }],
  },
  {
    key: 'ops-returns-rto', domain: 'ops', scope: ['date', 'city', 'distributor'], name: 'Returns & RTO',
    desc: 'Orders returned to the distributor after dispatch, with reason and vehicle.',
    sheets: ['Returns'],
    filters: [],
    flags: [{ label: 'needs logistics feed', variant: 'warning' }],
  },

  /* --------------------------- DigiDukaan · Buyer -------------------------- */
  {
    key: 'buyer-sales-summary', domain: 'buyer', scope: ['date', 'city', 'distributor'], name: 'Sales Summary',
    desc: 'The Sales Dashboard cards — orders, beat / non-beat, status and cancellation source — for the range.',
    sheets: ['Summary'],
    filters: [],
    live: true, page: 'buyer-sales',
  },
  {
    key: 'buyer-distributors', domain: 'buyer', scope: ['date', 'city', 'distributor'], name: 'Distributor Orders',
    desc: 'Per distributor: orders, value, beat vs non-beat, active / inactive and who cancelled.',
    sheets: ['Distributors'], page: 'buyer-sales',
    filters: [
      { label: 'Beat', options: ['All', 'Beat', 'Non-Beat'] },
      { label: 'Status', options: ['All', 'Active', 'Inactive'] },
    ],
    live: true,
  },
  {
    key: 'buyer-customer-orders', domain: 'buyer', scope: ['date', 'city', 'distributor'], name: 'Customer Orders (BA-wise)',
    desc: 'One row per customer with mobile, distributor, BA and BA mobile, geo, orders, value and beat split.',
    sheets: ['Customers', 'Order lines'], page: 'buyer-sales',
    filters: [
      { label: 'Team', options: TEAMS },
      { label: 'Beat', options: ['All', 'Beat', 'Non-Beat'] },
      { label: 'Status', options: ['All', 'Active', 'In Transit', 'Delivered', 'Cancelled'] },
    ],
    live: true,
  },
  {
    key: 'buyer-ba-performance', domain: 'buyer', scope: ['date', 'city', 'distributor'], name: 'BA Performance',
    desc: 'Per salesperson: target vs achievement, customer coverage, beat share, orders today, KYC pending, customers to revive and cancellations they caused.',
    sheets: ['BAs', 'Beats', 'Customers per BA'],
    filters: [{ label: 'Team', options: TEAMS }],
    live: true, page: 'buyer-ba',
  },
  {
    key: 'buyer-customer-db', domain: 'buyer', scope: ['date', 'city', 'distributor'], name: 'Customer Database',
    desc: 'Every outlet: owner, mobile, geo and pincode, beat, BA, mapped and discoverable distributors, KYC, status and value.',
    sheets: ['Customers', 'Discoverable distributors'],
    filters: [
      { label: 'Team', options: TEAMS },
      { label: 'KYC', options: ['All', 'Verified', 'Pending', 'Rejected'] },
      { label: 'Status', options: ['All', 'Active', 'Dormant', 'Never ordered'] },
    ],
    live: true, page: 'buyer-customers',
  },
  {
    key: 'buyer-revive', domain: 'buyer', scope: ['city', 'distributor'], name: 'Customers to Revive',
    desc: 'Call list per BA — dormant (30+ days) and never-ordered customers, with mobile, beat and last order.',
    sheets: ['Call list'],
    filters: [{ label: 'Team', options: TEAMS }],
  },
  {
    key: 'buyer-kyc-pending', domain: 'buyer', scope: ['city', 'distributor'], name: 'KYC Pending',
    desc: 'Customers with KYC pending or rejected, the blocking document and the BA to complete it.',
    sheets: ['KYC pending', 'Rejected'],
    filters: [{ label: 'Team', options: TEAMS }],
  },
  {
    key: 'buyer-cancellations', domain: 'buyer', scope: ['date', 'city', 'distributor'], name: 'Cancellations by Source',
    desc: 'Every cancelled order with who cancelled it — BA, Distributor or Retailer — and the reason.',
    sheets: ['Summary', 'Cancelled orders'],
    filters: [{ label: 'Cancelled by', options: ['All', 'BA', 'Distributor', 'Retailer'] }],
    flags: [{ label: 'needs reason taxonomy', variant: 'warning' }],
  },
  {
    key: 'buyer-beat-coverage', domain: 'buyer', scope: ['date', 'city', 'distributor'], name: 'Beat Coverage',
    desc: 'Planned vs visited outlets per BA beat, and outlets that ordered off-beat.',
    sheets: ['Beats', 'Missed outlets'],
    filters: [],
    flags: [{ label: 'needs beat plan feed', variant: 'warning' }],
  },
];

export interface Run {
  id: number;
  reportKey: string;
  when: string;
  /** the filters this run was generated with, one chip per entry */
  filters: ChipData[];
  status: 'Ready' | 'Running' | 'Failed';
  file?: string;
}

const network = (date: string): ChipData[] => [{ label: 'Date', value: date }, { value: 'Full network' }];

/** Module-level store — survives page switches within the session. */
export const runs: Run[] = [
  {
    id: 7, reportKey: 'order-register', when: '22 Aug, 10:41', status: 'Ready', file: 'orders_2026-08-22.xlsx',
    filters: [{ label: 'Date', value: '1 – 22 Aug 2026 · month to date' }, { label: 'Company', value: 'ITC' }, { label: 'City', value: 'Hyderabad' }, { label: 'Status', value: 'Cancelled' }],
  },
  { id: 6, reportKey: 'order-register', when: '22 Aug, 06:20', filters: network('1 – 22 Aug'), status: 'Ready', file: 'orders_2026-08-22.xlsx' },
  { id: 4, reportKey: 'order-register', when: '21 Aug, 06:15', filters: network('1 – 21 Aug'), status: 'Ready', file: 'orders_2026-08-21.xlsx' },
  { id: 3, reportKey: 'distributor-performance', when: '20 Aug, 06:15', filters: network('1 – 20 Aug'), status: 'Ready', file: 'distributor_performance_2026-08-20.xlsx' },
  { id: 2, reportKey: 'order-register', when: '20 Aug, 06:15', filters: network('1 – 20 Aug'), status: 'Failed' },
  { id: 5, reportKey: 'buyer-customer-orders', when: '21 Aug, 18:05', filters: [{ label: 'Date', value: '23-07-2026 to 21-08-2026' }, { label: 'BA', value: 'Ravi Teja' }], status: 'Ready', file: 'buyer_customer_orders_2026-08-21.xlsx' },
  { id: 1, reportKey: 'customer-master', when: '18 Aug, 09:02', filters: network('snapshot'), status: 'Ready', file: 'customer_master_2026-08-18.xlsx' },
];

export function addRun(reportKey: string, filters: ChipData[] = network('1 – 22 Aug')) {
  runs.unshift({
    id: Date.now(), reportKey,
    when: `22 Aug, ${new Date().toTimeString().slice(0, 5)}`,
    filters,
    status: 'Ready',
    file: reportKey === 'order-register' ? 'orders_2026-08-22.xlsx' : `${reportKey.replace(/-/g, '_')}_2026-08-22.xlsx`,
  });
}

export const lastRunOf = (key: string) => runs.find((r) => r.reportKey === key);

/** Report schedules — the automation mails business already receives. */
export interface Schedule {
  freq: 'Daily' | 'Weekly' | 'Monthly';
  /** Weekly: 'Mon'…'Sun'. Monthly: 1…31. */
  day?: string | number;
  time: string;
}
export const schedules: Record<string, Schedule | undefined> = {
  'order-register': { freq: 'Daily', time: '06:15' },
};
export function setSchedule(key: string, value?: Schedule) {
  schedules[key] = value;
}
const nth = (d: number) => `${d}${d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th'}`;
export function scheduleLabel(s?: Schedule) {
  if (!s) return undefined;
  if (s.freq === 'Daily') return `Daily · ${s.time}`;
  if (s.freq === 'Weekly') return `Weekly · ${s.day} · ${s.time}`;
  return `Monthly · ${nth(s.day as number)} · ${s.time}`;
}
