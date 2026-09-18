// Filter model + option lists for the scope FilterPanel.
// Multi-select: an empty array means "all". Option lists here are the top few
// by value — the real network has many more, hence search in the panel.

export interface Filters {
  states: string[];
  companies: string[];
  cities: string[];
  distributors: string[];
  preset: 'Month to date' | 'Last month' | 'Last 7 days' | 'Last 30 days' | 'Custom';
  /** ISO dates, so the panel can rehydrate its calendars from applied state. */
  from?: string;
  to?: string;
}

export const ALL: Filters = { states: [], companies: [], cities: [], distributors: [], preset: 'Month to date' };

export const totals = { states: 1, companies: 42, cities: 6, distributors: 18 };

export const stateOptions = ['Telangana'];
export const companyOptions = ['Fortune (AWL)', 'ITC', 'HUL', 'Parle', 'Britannia', 'Tata Consumer', 'Marico', 'Dabur'];
export const cityOptions = ['Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Sangareddy'];
export const distributorOptions = [
  'Sri Balaji Agencies', 'S R Enterprises', 'Vijaya Distributors',
  'Annapurna Traders', 'Lakshmi Agencies', 'Sai Krishna Agencies',
];

/** Chip label for a multi-select: all → "All companies (42)", one → the name, many → "3 companies". */
export function countLabel(sel: string[], unit: string, total: number) {
  if (sel.length === 0) return `All ${unit} (${total})`;
  if (sel.length === 1) return sel[0];
  return `${sel.length} ${unit}`;
}

const fmtIso = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** One chip's worth of applied filter — what each report run records. */
export interface ChipData { label?: string; value: string }

/** The chips a report run records: Date first, then each selected value — same order as the ScopeBar. */
export function scopeChips(f: Filters): ChipData[] {
  const values = [...f.companies, ...f.states, ...f.cities, ...f.distributors].map((value) => ({ value }));
  return [
    { label: 'Date', value: rangeLabel(f) },
    ...(values.length ? values : [{ value: 'Full network' }]),
  ];
}

export function rangeLabel(f: Filters) {
  if (f.preset === 'Last month') return '1 – 31 Jul 2026 · last month';
  if (f.preset !== 'Custom') return f.preset === 'Month to date' ? '1 – 22 Aug 2026 · month to date' : f.preset;
  if (!f.from) return 'Custom';
  if (!f.to || f.from === f.to) return `${fmtIso(f.from)} · single day`;
  return `${fmtIso(f.from)} – ${fmtIso(f.to)}`;
}
