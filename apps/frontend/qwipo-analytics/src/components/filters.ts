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

export const totals = { states: 3, companies: 42, cities: 14, distributors: 18 };

export const stateOptions = ['Telangana', 'Maharashtra', 'Rajasthan'];
export const citiesByState: Record<string, string[]> = {
  Telangana: ['Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Sangareddy'],
  Maharashtra: ['Pune', 'Mumbai', 'Nagpur', 'Nashik'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
};
/** Cities for the selected states (all states when none selected). */
export const citiesFor = (states: string[]) => (states.length ? states : stateOptions).flatMap((st) => citiesByState[st]);
export const companyOptions = ['Fortune (AWL)', 'ITC', 'HUL', 'Parle', 'Britannia', 'Tata Consumer', 'Marico', 'Dabur'];
export const cityOptions = citiesFor([]);
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

/** The chips a report run records: Date first, then each selected value under its filter's name. */
export function scopeChips(f: Filters): ChipData[] {
  const group = (label: string, sel: string[]) => sel.map((value) => ({ label, value }));
  const values = [
    ...group('Company', f.companies), ...group('State', f.states),
    ...group('City', f.cities), ...group('Distributor', f.distributors),
  ];
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
