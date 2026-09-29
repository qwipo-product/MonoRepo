import type { SellerTypeChoice } from '../lib/mock-data';

export const promotionStatuses = ['draft', 'scheduled', 'live', 'expired', 'archived'] as const;

export type PromotionStatus = (typeof promotionStatuses)[number];

export const promotionSurfaces = ['full_screen', 'home_carousel', 'product_list'] as const;

export type PromotionSurface = (typeof promotionSurfaces)[number];

export interface GeoScope {
  country: string;
  state_ids: string[];
  city_ids: string[];
  seller_type?: SellerTypeChoice;
  vendor_ids: string[];
  serviceable_area_ids: string[];
}

export interface ProductHierarchy {
  company_ids: string[];
  category_ids: string[];
  brand_ids: string[];
  sku_ids: string[];
}

export interface PromotionAsset {
  file_name?: string;
  data_url?: string;
  width?: number;
  height?: number;
}

export interface PromotionRecord {
  id: string;
  geo: GeoScope;
  product: ProductHierarchy;
  campaign_title: string;
  display_name: string;
  start_date: string;
  end_date: string;
  status: PromotionStatus;
  surface?: PromotionSurface;
  asset: PromotionAsset;
  push_notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}
