/**
 * Fire-and-forget bridge to mock-api's /api/marketing/* relay, so the buyer
 * app (a different origin, can't read this app's localStorage) sees what
 * gets published here. Best-effort: if mock-api isn't running, publishing
 * inside this app still works — only the cross-app demo link is missing.
 */

const MOCK_API_URL = import.meta.env.VITE_MOCK_API_URL ?? 'http://localhost:8787';

export function relayPromotion(promotion: Record<string, unknown>): void {
  fetch(`${MOCK_API_URL}/api/marketing/promotions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(promotion),
  }).catch(() => {});
}

export function relayNotification(notification: Record<string, unknown>): void {
  fetch(`${MOCK_API_URL}/api/marketing/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  }).catch(() => {});
}
