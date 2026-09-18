// Report definitions + per-report run history (in-memory for the mockup).
// Every report generates as multi-sheet XLSX within the caller's scope.

export interface ReportDef {
  key: string;
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
}

export const reportDefs: ReportDef[] = [
  {
    key: 'order-register', scope: ['date', 'company', 'city', 'distributor'] as const, name: 'Order Register',
    desc: 'Every order line in scope — the exact 32-column single-sheet workbook business receives by mail today.',
    sheets: ['Orders'],
    filters: [{ label: 'Status', options: ['All', 'Order placed', 'Delivered', 'Cancelled', 'Returned'] }],
    live: true,
  },
  {
    key: 'sales-report', scope: ['date', 'company', 'city', 'distributor'] as const, name: 'Sales Report (Excel)',
    desc: 'Order detail plus a last-3-days summary sheet.',
    sheets: ['Order Detail', 'Summary'],
    filters: [],
  },
  {
    key: 'open-ageing', scope: ['date', 'city', 'distributor'] as const, name: 'Open Order Ageing',
    desc: 'Open orders with stage, age bucket and value at risk, per distributor.',
    sheets: ['Ageing', 'Register'],
    filters: [{ label: 'Age', options: ['All', 'D2+', 'D4+'] }],
  },
  {
    key: 'delivery-cancellation', scope: ['date', 'company', 'city', 'distributor'] as const, name: 'Delivery & Cancellation',
    desc: 'Delivered vs cancelled with reasons and days-to-deliver.',
    sheets: ['Summary', 'Cancelled', 'Delivered'],
    filters: [{ label: 'Reason', options: ['All', 'Out of stock', 'Retailer cancelled', 'Price mismatch', 'Delivery delay'] }],
    flags: [{ label: 'needs reason taxonomy', variant: 'warning' }],
  },
  {
    key: 'distributor-performance', scope: ['date', 'city', 'distributor'] as const, name: 'Distributor Performance',
    desc: 'Leaderboard with delivery, cancellation and value per distributor.',
    sheets: ['Leaderboard', 'Detail'],
    filters: [{ label: 'City', options: ['All', 'Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad'] }],
    flags: [{ label: 'activation needs retailer mapping', variant: 'warning' }],
  },
  {
    key: 'scheme-discount', scope: ['date', 'company', 'distributor'] as const, name: 'Scheme & Discount',
    desc: 'Scheme uptake and discount impact per distributor and company.',
    sheets: ['Schemes', 'Discounts'],
    filters: [],
    flags: [{ label: 'needs scheme feed', variant: 'warning' }],
  },
  {
    key: 'customer-master', scope: ['city', 'distributor'] as const, name: 'Customer Master',
    desc: 'Outlet register with contact, geo and mapping columns.',
    sheets: ['Outlets'],
    filters: [{ label: 'Status', options: ['All', 'Active', 'Inactive'] }],
    flags: [{ label: 'Platform Admin only', variant: 'info' }],
  },
  {
    key: 'onboarding-funnel', scope: ['date', 'city', 'distributor'] as const, name: 'Onboarding Funnel',
    desc: 'Onboarded outlets with stage, cohort week and first-order dates.',
    sheets: ['Funnel', 'Outlets'],
    filters: [{ label: 'Stage', options: ['All', 'Ordered', 'Repeat', 'Qualified', 'Silent'] }],
  },
];

export interface Run {
  id: number;
  reportKey: string;
  when: string;
  scope: string;
  status: 'Ready' | 'Running' | 'Failed';
  file?: string;
}

/** Module-level store — survives page switches within the session. */
export const runs: Run[] = [
  { id: 6, reportKey: 'order-register', when: '22 Aug, 06:20', scope: 'Full network · 1 – 22 Aug', status: 'Ready', file: 'orders_2026-08-22.xlsx' },
  { id: 5, reportKey: 'sales-report', when: '22 Aug, 06:20', scope: 'Full network · 1 – 22 Aug', status: 'Ready', file: 'sales_report_2026-08-22.xlsx' },
  { id: 4, reportKey: 'order-register', when: '21 Aug, 06:15', scope: 'Full network · 1 – 21 Aug', status: 'Ready', file: 'orders_2026-08-21.xlsx' },
  { id: 3, reportKey: 'distributor-performance', when: '20 Aug, 06:15', scope: 'Full network · 1 – 20 Aug', status: 'Ready', file: 'distributor_performance_2026-08-20.xlsx' },
  { id: 2, reportKey: 'order-register', when: '20 Aug, 06:15', scope: 'Full network · 1 – 20 Aug', status: 'Failed' },
  { id: 1, reportKey: 'customer-master', when: '18 Aug, 09:02', scope: 'Full network · snapshot', status: 'Ready', file: 'customer_master_2026-08-18.xlsx' },
];

export function addRun(reportKey: string) {
  runs.unshift({
    id: Date.now(), reportKey, when: 'Just now', scope: 'Full network · 1 – 22 Aug',
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
  'sales-report': { freq: 'Daily', time: '06:15' },
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
