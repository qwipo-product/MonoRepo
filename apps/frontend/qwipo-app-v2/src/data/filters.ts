// Shared product-list filter model (mirrors v1's FiltersSheet), applied to both
// the distributor and wholesaler product lists.

export type Stock = 'available' | 'limited' | 'out';
export type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'margin_desc';

export interface Filters {
  sort: SortKey;
  stock: Stock[];
  brands: string[];
  minMargin: number;
  schemesOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  sort: 'recommended',
  stock: [],
  brands: [],
  minMargin: 0,
  schemesOnly: false,
};

// Mock facets keyed by product id (distributor pN + wholesaler wpN). In a real
// build these come from the catalog API; here they drive the filters.
const STOCK: Record<string, Stock> = {
  p1: 'available', p2: 'available', p3: 'limited', p4: 'available', p5: 'available',
  p6: 'limited', p7: 'out', p8: 'available', p9: 'limited', p10: 'available',
  wp1: 'available', wp2: 'limited', wp3: 'available', wp4: 'available',
};
const MARGIN: Record<string, number> = {
  p1: 12, p2: 9, p3: 11, p4: 10, p5: 12, p6: 14, p7: 11, p8: 13, p9: 15, p10: 12,
  wp1: 12, wp2: 11, wp3: 13, wp4: 10,
};
const SCHEME = new Set(['p1', 'p3', 'p5', 'p8', 'wp1', 'wp3']);

export const stockOf = (id: string): Stock => STOCK[id] ?? 'available';
export const marginOf = (id: string): number => MARGIN[id] ?? 0;
export const schemeOf = (id: string): boolean => SCHEME.has(id);

export function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.sort !== 'recommended') n++;
  if (f.stock.length) n++;
  if (f.brands.length) n++;
  if (f.minMargin > 0) n++;
  if (f.schemesOnly) n++;
  return n;
}

export interface FilterAccessors<T> {
  id: (t: T) => string;
  brand: (t: T) => string;
  price: (t: T) => number;
}

export function applyFilters<T>(items: T[], f: Filters, acc: FilterAccessors<T>): T[] {
  let out = items;
  if (f.brands.length) out = out.filter((t) => f.brands.includes(acc.brand(t)));
  if (f.stock.length) out = out.filter((t) => f.stock.includes(stockOf(acc.id(t))));
  if (f.minMargin > 0) out = out.filter((t) => marginOf(acc.id(t)) >= f.minMargin);
  if (f.schemesOnly) out = out.filter((t) => schemeOf(acc.id(t)));

  out = [...out];
  if (f.sort === 'price_asc') out.sort((a, b) => acc.price(a) - acc.price(b));
  else if (f.sort === 'price_desc') out.sort((a, b) => acc.price(b) - acc.price(a));
  else if (f.sort === 'margin_desc') out.sort((a, b) => marginOf(acc.id(b)) - marginOf(acc.id(a)));
  return out;
}
