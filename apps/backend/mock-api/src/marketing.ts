/**
 * In-memory relay between the marketing platform and the buyer app — the one
 * resource in mock-api that isn't sourced from @mockups/mock-data. The
 * marketing platform POSTs a promotion/notification the moment it's
 * published; the buyer app polls GET to pick it up. Two different origins
 * (5178 vs 5175) can't share localStorage, so this process's memory is the
 * shared state for the demo. Still nothing persisted across a restart —
 * same rule as the rest of mock-api.
 */

export interface RelayPromotion {
  id: string;
  campaign_title: string;
  display_name: string;
  surface: 'full_screen' | 'home_carousel' | 'product_list';
  asset_data_url?: string;
  start_date: string;
  end_date: string;
  status: string;
  published_at: string;
}

export interface RelayNotification {
  id: string;
  category: string;
  title: string;
  body: string;
  channels: string[];
  status: string;
  created_at: string;
}

const promotions: RelayPromotion[] = [];
const notifications: RelayNotification[] = [];

export function listPromotions(): RelayPromotion[] {
  return promotions;
}

export function addPromotion(promotion: RelayPromotion): void {
  promotions.unshift(promotion);
}

export function listNotifications(): RelayNotification[] {
  return notifications;
}

export function addNotification(notification: RelayNotification): void {
  notifications.unshift(notification);
}
