// Filter model + option lists for the scope FilterPanel (mockup data).

export interface Filters {
  company: string;
  city: string;
  distributor: string;
  range: string;
}

export const ALL: Filters = {
  company: 'All companies (5)',
  city: 'All cities (6)',
  distributor: 'All distributors (18)',
  range: '1 – 22 Aug 2026 · month to date',
};

export const companies = ['All companies (5)', 'Fortune (AWL)', 'ITC', 'HUL', 'Parle', 'Britannia'];
export const cities = ['All cities (6)', 'Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Sangareddy'];
export const distributors = [
  'All distributors (18)', 'Sri Balaji Agencies', 'S R Enterprises', 'Vijaya Distributors',
  'Annapurna Traders', 'Lakshmi Agencies', 'Sai Krishna Agencies',
];
export const ranges = ['1 – 22 Aug 2026 · month to date', 'Last 7 days', 'Last 30 days', 'Custom…'];
