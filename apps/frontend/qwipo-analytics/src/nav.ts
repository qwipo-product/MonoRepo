export type Page =
  | 'overview' | 'sales' | 'distributors' | 'customers'
  | 'lg-today' | 'lg-network' | 'lg-platform'
  | 'reports';

export const digiPages: { key: Page; label: string; disabled?: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'sales', label: 'Sales' },
  { key: 'distributors', label: 'Distributors' },
  { key: 'customers', label: 'Customers & Onboarding' },
];

export const opsPages: { key: Page; label: string; disabled?: string }[] = [
  { key: 'lg-today', label: 'Dispatch today' },
  { key: 'lg-network', label: 'Distributor network' },
  { key: 'lg-platform', label: 'Platform health' },
];

export const reportPages: { key: Page; label: string }[] = [
  { key: 'reports', label: 'Reports' },
];

export const titles: Record<Page, string> = {
  overview: 'Overview', sales: 'Sales', distributors: 'Distributors', customers: 'Customers & Onboarding',
  'lg-today': 'Dispatch today', 'lg-network': 'Distributor network', 'lg-platform': 'Platform health',
  reports: 'Reports',
};
