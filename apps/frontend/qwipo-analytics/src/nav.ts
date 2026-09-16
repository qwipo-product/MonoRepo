export type Page =
  | 'overview' | 'sales' | 'distributors' | 'customers' | 'brands' | 'marketing'
  | 'lg-today' | 'lg-network' | 'lg-platform'
  | 'reports' | 'history';

export const digiPages: { key: Page; label: string; disabled?: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'sales', label: 'Sales' },
  { key: 'distributors', label: 'Distributors' },
  { key: 'customers', label: 'Customers & Onboarding' },
  { key: 'brands', label: 'Brands' },
  { key: 'marketing', label: 'Marketing', disabled: 'needs event tracking' },
];

export const opsPages: { key: Page; label: string; disabled?: string }[] = [
  { key: 'lg-today', label: 'Dispatch today' },
  { key: 'lg-network', label: 'Distributor network' },
  { key: 'lg-platform', label: 'Platform health' },
];

export const reportPages: { key: Page; label: string }[] = [
  { key: 'reports', label: 'Report Catalogue' },
  { key: 'history', label: 'Run History' },
];

export const titles: Record<Page, string> = {
  overview: 'Overview', sales: 'Sales', distributors: 'Distributors', customers: 'Customers & Onboarding',
  brands: 'Brands', marketing: 'Marketing',
  'lg-today': 'Dispatch today', 'lg-network': 'Distributor network', 'lg-platform': 'Platform health',
  reports: 'Report Catalogue', history: 'Run History',
};
