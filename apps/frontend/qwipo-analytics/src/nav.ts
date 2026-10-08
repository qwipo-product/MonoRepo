// Three data sources, three sidebar groups: DigiDukaan seller side, Ops
// (logistics) and DigiDukaan buyer side (the sales team's app). Reports
// mirrors the same split, one section per source. Buyer app analytics (the
// app's product-analytics boards) is its own sidebar group and page.
export type Page =
  | 'overview' | 'sales' | 'distributors' | 'customers'
  | 'lg-summary' | 'lg-orders' | 'lg-trips'
  | 'buyer-sales' | 'buyer-ba' | 'buyer-customers'
  | 'buyer-analytics'
  | 'reports';

export type NavItem = { key: Page; label: string; disabled?: string };

export const digiPages: NavItem[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'sales', label: 'Sales' },
  { key: 'distributors', label: 'Distributors' },
  { key: 'customers', label: 'Customers & Onboarding' },
];

// Page names mirror the reference build (logistics-tech-dashboard) for the
// data-parity round; renaming is a UX-round decision.
export const opsPages: NavItem[] = [
  { key: 'lg-summary', label: 'Summary' },
  { key: 'lg-orders', label: 'Orders' },
  { key: 'lg-trips', label: 'Trips' },
];

export const buyerPages: NavItem[] = [
  { key: 'buyer-sales', label: 'Sales dashboard' },
  { key: 'buyer-ba', label: 'BA performance' },
  { key: 'buyer-customers', label: 'Customers' },
];

export type ReportDomain = 'seller' | 'ops' | 'buyer';
export const reportSections: { key: ReportDomain; label: string; source: string }[] = [
  { key: 'seller', label: 'DigiDukaan · Seller', source: 'Seller platform database · ONDC orders, distributors, outlets' },
  { key: 'ops', label: 'Ops (Logistics)', source: 'Logistics database · trips, delivery ageing, vehicles, drivers' },
  { key: 'buyer', label: 'DigiDukaan · Buyer', source: 'Buyer app database · customers, BAs (salespersons), beats' },
];

export const titles: Record<Page, string> = {
  overview: 'Overview', sales: 'Sales', distributors: 'Distributors', customers: 'Customers & Onboarding',
  'lg-summary': 'Logistics Summary', 'lg-orders': 'Logistics Orders', 'lg-trips': 'Trips & Fleet',
  'buyer-sales': 'Sales Dashboard', 'buyer-ba': 'BA Performance', 'buyer-customers': 'Customers',
  'buyer-analytics': 'Buyer App Analytics',
  reports: 'Reports',
};
