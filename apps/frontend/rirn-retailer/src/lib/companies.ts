/**
 * The companies a retailer can connect to.
 *
 * Company names are public information — unlike the retailer base on the
 * company side, there is nothing to withhold here and no reason to meter
 * browsing. A retailer searching for "ITC" is not harvesting anything.
 */

export interface Company {
  id: string;
  name: string;
  code: string;
  /** What they sell, so a shop owner recognises them without the logo. */
  sector: string;
  /** Two letters for the avatar tile. */
  initials: string;
  /** Tailwind background for the tile. */
  tint: string;
  /** A brand or two the retailer would actually stock. */
  brands: string;
}

export const COMPANIES: Company[] = [
  { id: 'itc', name: 'ITC Limited', code: 'COMP-ITC', sector: 'Foods & personal care', initials: 'IT', tint: 'bg-info-subtle text-info-foreground', brands: 'Aashirvaad, Sunfeast, Bingo' },
  { id: 'hul', name: 'Hindustan Unilever', code: 'COMP-HUL', sector: 'Home & personal care', initials: 'HU', tint: 'bg-accent-subtle text-accent-foreground', brands: 'Surf Excel, Lux, Lipton' },
  { id: 'britannia', name: 'Britannia Industries', code: 'COMP-BRT', sector: 'Bakery & dairy', initials: 'BR', tint: 'bg-warning-subtle text-warning-foreground', brands: 'Good Day, Marie Gold' },
  { id: 'dabur', name: 'Dabur India', code: 'COMP-DAB', sector: 'Ayurveda & foods', initials: 'DA', tint: 'bg-success-subtle text-success-foreground', brands: 'Real, Hajmola, Vatika' },
  { id: 'marico', name: 'Marico', code: 'COMP-MAR', sector: 'Edible oils & hair care', initials: 'MA', tint: 'bg-info-subtle text-info-foreground', brands: 'Saffola, Parachute' },
  { id: 'nestle', name: 'Nestlé India', code: 'COMP-NES', sector: 'Foods & beverages', initials: 'NE', tint: 'bg-error-subtle text-error-foreground', brands: 'Maggi, Nescafé, KitKat' },
  { id: 'parle', name: 'Parle Products', code: 'COMP-PAR', sector: 'Biscuits & confectionery', initials: 'PA', tint: 'bg-warning-subtle text-warning-foreground', brands: 'Parle-G, Monaco' },
  { id: 'amul', name: 'Amul (GCMMF)', code: 'COMP-AML', sector: 'Dairy', initials: 'AM', tint: 'bg-info-subtle text-info-foreground', brands: 'Amul Butter, Amul Taaza' },
  { id: 'godrej', name: 'Godrej Consumer', code: 'COMP-GCP', sector: 'Home care', initials: 'GO', tint: 'bg-success-subtle text-success-foreground', brands: 'Good Knight, Cinthol' },
  { id: 'colgate', name: 'Colgate-Palmolive', code: 'COMP-CLG', sector: 'Oral care', initials: 'CO', tint: 'bg-error-subtle text-error-foreground', brands: 'Colgate, Palmolive' },
  { id: 'tata', name: 'Tata Consumer Products', code: 'COMP-TCP', sector: 'Tea, salt & staples', initials: 'TA', tint: 'bg-accent-subtle text-accent-foreground', brands: 'Tata Tea, Tata Salt' },
  { id: 'adani', name: 'Adani Wilmar', code: 'COMP-ADW', sector: 'Edible oils & staples', initials: 'AD', tint: 'bg-warning-subtle text-warning-foreground', brands: 'Fortune' },
  { id: 'mondelez', name: 'Mondelez India', code: 'COMP-MDZ', sector: 'Chocolates & snacks', initials: 'MO', tint: 'bg-accent-subtle text-accent-foreground', brands: 'Cadbury, Oreo' },
  { id: 'emami', name: 'Emami', code: 'COMP-EMA', sector: 'Personal care', initials: 'EM', tint: 'bg-success-subtle text-success-foreground', brands: 'Navratna, BoroPlus' },
  { id: 'haldiram', name: "Haldiram's", code: 'COMP-HLD', sector: 'Snacks & sweets', initials: 'HA', tint: 'bg-error-subtle text-error-foreground', brands: 'Bhujia, Namkeen' },
  { id: 'wipro', name: 'Wipro Consumer Care', code: 'COMP-WIP', sector: 'Soaps & home care', initials: 'WI', tint: 'bg-info-subtle text-info-foreground', brands: 'Santoor, Yardley' },
];

export const COMPANIES_BY_ID = new Map(COMPANIES.map((c) => [c.id, c]));

/** Name, brand or sector — all public, so search is unrestricted. */
export function searchCompanies(query: string): Company[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMPANIES;
  return COMPANIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.brands.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q),
  );
}
