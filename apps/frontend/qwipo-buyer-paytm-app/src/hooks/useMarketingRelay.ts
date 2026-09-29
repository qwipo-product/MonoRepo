import { useEffect, useState } from 'react';

/**
 * Polls mock-api's /api/marketing/* relay — the live bridge from the
 * marketing platform (a different origin, so no shared localStorage) into
 * this app. Best-effort: if mock-api isn't running, these hooks just never
 * populate and every screen falls back to its static fixtures.
 */

const MOCK_API_URL = import.meta.env.VITE_MOCK_API_URL ?? 'http://localhost:8787';
const POLL_MS = 4000;

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

function usePolledList<T>(path: string): T[] {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`${MOCK_API_URL}${path}`);
        if (!response.ok) return;
        const data = (await response.json()) as { items: T[] };
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        // mock-api not running — leave items as-is, screens fall back to fixtures.
      }
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [path]);

  return items;
}

export function useMarketingPromotions(): RelayPromotion[] {
  return usePolledList<RelayPromotion>('/api/marketing/promotions');
}

export function useMarketingNotifications(): RelayNotification[] {
  return usePolledList<RelayNotification>('/api/marketing/notifications');
}
