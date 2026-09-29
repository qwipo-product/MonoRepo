import { ALL_ID, cities, states } from './mock-data';
import type { GeoScope, PromotionRecord, PromotionStatus, PromotionSurface } from '../types/campaign';

export function deriveStatus(startDate: string, endDate: string, today: string): PromotionStatus {
  if (!startDate) return 'draft';
  if (endDate && endDate < today) return 'expired';
  if (startDate <= today) return 'live';
  return 'scheduled';
}

export function createEmptyGeoScope(): GeoScope {
  return {
    country: 'India',
    state_ids: [],
    city_ids: [],
    seller_type: undefined,
    vendor_ids: [],
    serviceable_area_ids: [],
  };
}

export function describeGeo(geo: GeoScope | undefined): string {
  if (!geo) return 'Pan India';

  const isAllStatesSelected = geo.state_ids.includes(ALL_ID);

  if (geo.state_ids.length === 0 || isAllStatesSelected) {
    return 'Pan India';
  }

  const stateNames = geo.state_ids.map((id) => states.find((state) => state.id === id)?.name).filter((name): name is string => Boolean(name));

  if (geo.city_ids.length === 0) {
    return stateNames.length > 0 ? `${stateNames.join(', ')} (Pan State)` : 'Pan India';
  }

  const isAllCitiesSelected = geo.city_ids.includes(ALL_ID);

  if (isAllCitiesSelected) {
    return `Pan ${stateNames.join(', ')}`;
  }

  const cityNames = geo.city_ids.map((id) => cities.find((city) => city.id === id)?.name).filter((name): name is string => Boolean(name));
  return cityNames.length > 0 ? cityNames.join(', ') : 'Pan India';
}

export const surfaceLabels: Record<PromotionSurface, string> = {
  full_screen: 'Full screen',
  home_carousel: 'Home carousel',
  product_list: 'Product list',
};

export const surfaceDimensions: Record<PromotionSurface, { width: number; height: number }> = {
  full_screen: { width: 1080, height: 1920 },
  home_carousel: { width: 1080, height: 450 },
  product_list: { width: 1080, height: 1080 },
};

export const surfaceOptions: { id: PromotionSurface; label: string; description: string }[] = [
  { id: 'full_screen', label: 'Full screen', description: 'Full-bleed interstitial shown on app open (1080×1920).' },
  { id: 'home_carousel', label: 'Home carousel', description: 'Rotating banner on the home feed (1080×450).' },
  { id: 'product_list', label: 'Product list', description: 'Inline banner within product listing pages (1080×1080).' },
];

export function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return '—';
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

/**
 * Compact single-date format for dense table columns: "20 Aug" for dates in
 * the current year, "20 Aug 2025" otherwise — no leading zero, year only when
 * it actually disambiguates.
 */
export function formatShortDate(value: string): string {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Live -> Scheduled -> Draft -> Expired -> Archived: the secondary sort key for the promotions
// list, applied only when two records share the same created_at so the most actionable status
// surfaces first.
export const statusSortOrder: Record<PromotionStatus, number> = {
  live: 0,
  scheduled: 1,
  draft: 2,
  expired: 3,
  archived: 4,
};

export const statusLabels: Record<PromotionStatus, string> = {
  live: 'Live',
  scheduled: 'Scheduled',
  draft: 'Draft',
  expired: 'Expired',
  archived: 'Archived',
};

export const statusStyles: Record<PromotionStatus, string> = {
  live: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  scheduled: 'bg-blue-50 text-blue-700 ring-blue-200',
  draft: 'bg-gray-50 text-gray-700 ring-gray-200',
  expired: 'bg-amber-50 text-amber-700 ring-amber-200',
  archived: 'bg-purple-50 text-purple-700 ring-purple-200',
};

export const surfaceRankCap: Record<PromotionSurface, number> = {
  home_carousel: 10,
  product_list: 10,
  full_screen: 3,
};

/**
 * Campaigns eligible for ranking on a surface: matches the surface, was actually published
 * (never draft/archived), and is currently LIVE or SCHEDULED by date. Effective status is
 * recomputed live via `deriveStatus` rather than trusting the stored `status` field.
 */
export function getEligibleForRanking(campaigns: PromotionRecord[], surface: PromotionSurface, today: string): PromotionRecord[] {
  return campaigns.filter((campaign) => {
    if (campaign.surface !== surface) return false;
    if (campaign.status === 'draft' || campaign.status === 'archived') return false;
    const effectiveStatus = deriveStatus(campaign.start_date, campaign.end_date, today);
    return effectiveStatus === 'live' || effectiveStatus === 'scheduled';
  });
}

/** Step names for the 4-step promotion wizard, shown under each stepper marker. */
export const promotionWizardSteps = ['Geo & products', 'Campaign details', 'Surface & asset', 'Preview & publish'];
