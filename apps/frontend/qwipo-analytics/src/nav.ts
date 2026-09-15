export type Page =
  | 'overview' | 'sales' | 'distributors' | 'customers' | 'brands' | 'marketing'
  | 'reports' | 'history';

export const analyticsPages: { key: Page; label: string; disabled?: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'sales', label: 'Sales' },
  { key: 'distributors', label: 'Distributors' },
  { key: 'customers', label: 'Customers & Onboarding' },
  { key: 'brands', label: 'Brands' },
  { key: 'marketing', label: 'Marketing', disabled: 'needs event tracking' },
];

export const reportPages: { key: Page; label: string }[] = [
  { key: 'reports', label: 'Report Catalogue' },
  { key: 'history', label: 'Run History' },
];

export const titles: Record<Page, string> = {
  overview: 'Overview', sales: 'Sales', distributors: 'Distributors', customers: 'Customers & Onboarding',
  brands: 'Brands', marketing: 'Marketing', reports: 'Report Catalogue', history: 'Run History',
};
