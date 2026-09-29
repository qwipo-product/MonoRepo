import { z } from 'zod';

import { promotionStatuses, promotionSurfaces } from '../../types/campaign';

const nonEmptyString = z.string().trim().min(1);
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.');

export const promotionStatusSchema = z.enum(promotionStatuses);
export const promotionSurfaceSchema = z.enum(promotionSurfaces);

export const geoScopeSchema = z.object({
  country: nonEmptyString,
  state_ids: z.array(nonEmptyString),
  city_ids: z.array(nonEmptyString),
  seller_type: z.enum(['distributor', 'wholesaler', 'all']).optional(),
  vendor_ids: z.array(nonEmptyString),
  serviceable_area_ids: z.array(nonEmptyString),
});

export const productHierarchySchema = z.object({
  company_ids: z.array(nonEmptyString),
  category_ids: z.array(nonEmptyString),
  brand_ids: z.array(nonEmptyString),
  sku_ids: z.array(nonEmptyString),
});

export const promotionAssetSchema = z.object({
  file_name: z.string().optional(),
  data_url: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export const promotionRecordSchema = z
  .object({
    id: nonEmptyString,
    geo: geoScopeSchema,
    product: productHierarchySchema,
    campaign_title: nonEmptyString,
    display_name: nonEmptyString,
    start_date: isoDateString,
    end_date: isoDateString,
    status: promotionStatusSchema,
    surface: promotionSurfaceSchema.optional(),
    asset: promotionAssetSchema,
    push_notification_enabled: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .refine((record) => record.end_date >= record.start_date, {
    path: ['end_date'],
    message: 'End date must be on or after the start date.',
  });

export type PromotionRecordInput = z.input<typeof promotionRecordSchema>;
export type PromotionRecordOutput = z.output<typeof promotionRecordSchema>;
