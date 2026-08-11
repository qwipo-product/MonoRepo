// Notifications — self-contained mock feed.

export type NotificationType = 'order' | 'promo' | 'stock' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'promo', title: '🌾 Atta Savings', body: '🌾🌾💰 Stock up & save on Flours!', time: '6 August 2026 · 12:51 PM', unread: true },
  { id: 'n2', type: 'promo', title: '⭐ Top Everyday Deals 🛒', body: '✨ Upto 20% OFF on FMCG Essentials! 😍', time: '6 August 2026 · 9:47 AM', unread: true },
  { id: 'n3', type: 'promo', title: '🌧️ Monsoon Delights', body: '☕🍲🍜 Upto 15% OFF on Monsoon Favorites! 😍', time: '5 August 2026 · 11:48 AM', unread: true },
  { id: 'n4', type: 'stock', title: '🛒 Best Urad Deals', body: '🌾🔥 Grab your Double Horse Urad at great prices!', time: '5 August 2026 · 10:36 AM', unread: true },
  { id: 'n5', type: 'promo', title: 'Quick Meal Essentials', body: '🍅🥛💛 Ready in minutes, save more!', time: '4 August 2026 · 3:18 PM', unread: true },
  { id: 'n6', type: 'promo', title: 'Mega Dal Deals 🌾', body: '🥣💛✨ Best prices on your favorite Dals!', time: '4 August 2026 · 12:26 PM', unread: true },
  { id: 'n7', type: 'order', title: '📦 Out for delivery', body: 'Order QWIP2401204 is out for delivery — arriving tomorrow 11 AM.', time: '4 August 2026 · 8:05 AM', unread: false },
  { id: 'n8', type: 'stock', title: '⚠️ Low stock alert', body: 'Freedom Sunflower Oil is running low at your store.', time: '3 August 2026 · 6:12 PM', unread: false },
  { id: 'n9', type: 'system', title: '🔔 App updated', body: 'New features are available in Qwipo v2.0.', time: '2 August 2026 · 10:00 AM', unread: false },
];

export const NOTIFICATION_TABS: { key: 'all' | NotificationType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'order', label: 'Orders' },
  { key: 'promo', label: 'Offers' },
  { key: 'stock', label: 'Stock' },
  { key: 'system', label: 'System' },
];
