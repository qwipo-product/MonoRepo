export type NotifKind = 'order' | 'offer';
export interface Notif {
  id: string;
  kind: NotifKind;
  icon: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
}

export const NOTIFICATIONS: Notif[] = [
  { id: 'n1', kind: 'order', icon: '📦', title: 'Order QW-24790 is out for delivery', body: 'Arriving today from Omkar Enterprises.', time: '2h ago', unread: true },
  { id: 'n2', kind: 'offer', icon: '🏷️', title: 'Flat ₹500 OFF', body: 'On orders above ₹6,000. Use QWIPO500.', time: '5h ago', unread: true },
  { id: 'n3', kind: 'order', icon: '✅', title: 'Order QW-24712 delivered', body: 'Rate your experience with Sri Sai Krishna Traders.', time: 'Yesterday' },
  { id: 'n4', kind: 'offer', icon: '🎉', title: 'New wholesalers near you', body: 'Bulk rates now available in your area.', time: '2 days ago' },
];
