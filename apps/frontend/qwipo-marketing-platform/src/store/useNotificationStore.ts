import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { deriveNotificationStatus } from '../lib/notification-copy';
import { relayNotification } from '../lib/marketing-relay';
import type { NotificationRecord, NotificationTrigger } from '../types/notification';

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

type NotificationDraft = Omit<NotificationRecord, 'id' | 'createdAt' | 'status'>;

const seedNotifications: NotificationRecord[] = [
  {
    id: 'seed-notif-1',
    category: 'promotional',
    title: 'Monsoon Staples Drive is live',
    body: 'The Monsoon Atta Mahotsav banner is now running on the home carousel in Hyderabad. Check stock on Aashirvaad Atta 5kg and 10kg before the weekend rush.',
    ctaLink: '/promotions/seed-1',
    geo: {
      country: 'India',
      state_ids: ['state-telangana'],
      city_ids: ['city-hyderabad'],
      seller_type: 'distributor',
      vendor_ids: ['vendor-hyd-central-dist'],
      serviceable_area_ids: [],
    },
    channels: ['in_app', 'push'],
    trigger: { type: 'one_time', timing: 'immediate' },
    status: 'sent',
    createdAt: '2026-08-24T10:15:00.000Z',
  },
  {
    id: 'seed-notif-2',
    category: 'operational',
    title: 'Beat plan updated for Kukatpally route',
    body: "Tomorrow's delivery beat for the Kukatpally route now starts at 7:30 AM. Confirm vehicle allocation and loading slots tonight.",
    geo: {
      country: 'India',
      state_ids: ['state-telangana'],
      city_ids: ['city-hyderabad'],
      seller_type: 'distributor',
      vendor_ids: ['vendor-hyd-central-dist'],
      serviceable_area_ids: ['area-kukatpally'],
    },
    channels: ['in_app', 'sms'],
    trigger: { type: 'event', eventHook: 'beat_serviceability', relativeOffset: '1_day_before' },
    status: 'automated',
    createdAt: '2026-08-23T09:00:00.000Z',
  },
  {
    id: 'seed-notif-3',
    category: 'credit_payments',
    title: 'Credit due reminder',
    body: 'Your outstanding credit cycle closes in 2 days. Clear dues before the due date to keep your credit limit unlocked for festive-season ordering.',
    geo: {
      country: 'India',
      state_ids: [],
      city_ids: [],
      seller_type: 'all',
      vendor_ids: ['ALL'],
      serviceable_area_ids: [],
    },
    channels: ['push', 'sms', 'whatsapp'],
    trigger: { type: 'event', eventHook: 'credit_due_date', relativeOffset: '2_hours_before' },
    status: 'automated',
    createdAt: '2026-08-21T08:30:00.000Z',
  },
  {
    id: 'seed-notif-4',
    category: 'schemes',
    title: 'New festive scheme on Tata Sampann',
    body: 'Buy 20 cases of Tata Sampann Toor Dal, get 1 case free through September. Scheme applies automatically at checkout.',
    ctaLink: '/promotions/seed-11',
    geo: {
      country: 'India',
      state_ids: ['state-telangana', 'state-andhra-pradesh'],
      city_ids: [],
      seller_type: 'wholesaler',
      vendor_ids: [],
      serviceable_area_ids: [],
    },
    channels: ['in_app', 'whatsapp'],
    trigger: { type: 'one_time', timing: 'scheduled', scheduledDate: '2026-09-01', scheduledTime: '09:00' },
    status: 'scheduled',
    createdAt: '2026-08-20T14:45:00.000Z',
  },
  {
    id: 'seed-notif-5',
    category: 'promotional',
    title: 'Weekly bestsellers digest',
    body: "Your top-moving SKUs this week, ranked by reorder volume. Restock the leaders before Monday's demand spike.",
    geo: {
      country: 'India',
      state_ids: ['state-karnataka'],
      city_ids: ['city-bengaluru'],
      seller_type: 'all',
      vendor_ids: [],
      serviceable_area_ids: [],
    },
    channels: ['in_app', 'push'],
    trigger: {
      type: 'recurring',
      frequency: 'weekly',
      daysOfWeek: ['mon'],
      dispatchTime: '08:00',
      startDate: '2026-08-03',
      endDate: '2026-12-28',
    },
    status: 'recurring',
    createdAt: '2026-08-18T11:20:00.000Z',
  },
  {
    id: 'seed-notif-6',
    category: 'system',
    title: 'Scheduled maintenance window',
    body: 'The ordering portal will be unavailable on Sunday from 1:00 AM to 3:00 AM IST for a planned upgrade. Queue urgent orders before Saturday midnight.',
    geo: {
      country: 'India',
      state_ids: [],
      city_ids: [],
      seller_type: 'all',
      vendor_ids: ['ALL'],
      serviceable_area_ids: [],
    },
    channels: ['in_app', 'sms'],
    trigger: { type: 'one_time', timing: 'scheduled', scheduledDate: '2026-08-29', scheduledTime: '18:00' },
    status: 'scheduled',
    createdAt: '2026-08-17T16:00:00.000Z',
  },
  {
    id: 'seed-notif-7',
    category: 'operational',
    title: 'Order status alerts enabled',
    body: 'You will now get an instant alert whenever an order moves to Packed, Dispatched, or Delivered — no more manual status checks.',
    geo: {
      country: 'India',
      state_ids: ['state-tamil-nadu'],
      city_ids: ['city-chennai'],
      seller_type: 'distributor',
      vendor_ids: ['vendor-chn-east-dist'],
      serviceable_area_ids: [],
    },
    channels: ['push'],
    trigger: { type: 'event', eventHook: 'order_status_change', relativeOffset: 'same_day_morning' },
    status: 'automated',
    createdAt: '2026-08-14T13:10:00.000Z',
  },
  {
    id: 'seed-notif-8',
    category: 'promotional',
    title: 'Fresh Start Snacks Fest starts today',
    body: 'The full-screen Snack Time Savings campaign begins today across Hyderabad wholesale. Expect higher order volumes on Parle and Britannia lines.',
    ctaLink: '/promotions/seed-2',
    geo: {
      country: 'India',
      state_ids: ['state-telangana'],
      city_ids: ['city-hyderabad'],
      seller_type: 'wholesaler',
      vendor_ids: ['vendor-hyd-metro-whole'],
      serviceable_area_ids: [],
    },
    channels: ['in_app', 'push', 'whatsapp'],
    trigger: { type: 'one_time', timing: 'immediate' },
    status: 'sent',
    createdAt: '2026-08-25T07:30:00.000Z',
  },
  {
    id: 'seed-notif-9',
    category: 'credit_payments',
    title: 'UPI settlement delay resolved',
    body: "Settlements from yesterday's UPI collections have been processed. Balances now reflect in your ledger.",
    geo: {
      country: 'India',
      state_ids: ['state-maharashtra'],
      city_ids: ['city-mumbai'],
      seller_type: 'all',
      vendor_ids: [],
      serviceable_area_ids: [],
    },
    channels: ['in_app'],
    trigger: { type: 'one_time', timing: 'immediate' },
    status: 'sent',
    createdAt: '2026-08-12T09:50:00.000Z',
  },
  {
    id: 'seed-notif-10',
    category: 'schemes',
    title: 'Month-end target scheme reminder',
    body: 'Distributors at 80% or more of their monthly target get an extra 0.5% rebate. Track your progress on the dashboard.',
    geo: {
      country: 'India',
      state_ids: ['state-andhra-pradesh'],
      city_ids: ['city-vijayawada', 'city-visakhapatnam'],
      seller_type: 'distributor',
      vendor_ids: [],
      serviceable_area_ids: [],
    },
    channels: ['push', 'whatsapp'],
    trigger: {
      type: 'recurring',
      frequency: 'monthly',
      daysOfWeek: [],
      dayOfMonth: 25,
      dispatchTime: '10:00',
      startDate: '2026-07-25',
      endDate: '2027-03-25',
    },
    status: 'recurring',
    createdAt: '2026-08-10T12:05:00.000Z',
  },
];

interface NotificationStore {
  notifications: NotificationRecord[];
  createNotification: (draft: NotificationDraft) => string;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: seedNotifications,

      createNotification: (draft) => {
        const id = createId();
        const status = deriveNotificationStatus(draft.trigger);
        const record: NotificationRecord = {
          ...draft,
          id,
          status,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ notifications: [record, ...state.notifications] }));

        // Live bridge to the buyer app. Only in_app-channel notifications are
        // demo-relevant there — push/SMS/WhatsApp have no real transport in a
        // mockup, and the buyer app only renders an in-app notifications list.
        if (record.channels.includes('in_app')) {
          relayNotification({
            id: record.id,
            category: record.category,
            title: record.title,
            body: record.body,
            channels: record.channels,
            status: record.status,
            created_at: record.createdAt,
          });
        }

        return id;
      },

      deleteNotification: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
    }),
    {
      name: 'qwipo-notification-store',
      storage: createJSONStorage(() => localStorage),
      // v0 records predate the trigger schema (flat timing/scheduledAt instead of `trigger`),
      // v1 records predate the geo.vendor_id -> geo.vendor_ids move, and v2 stores predate the
      // demo seed set — migrate all three so old localStorage data doesn't crash and picks up
      // the seed notifications.
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as { notifications?: Array<Record<string, unknown>> };
        if (!Array.isArray(state?.notifications)) return persistedState as NotificationStore;

        const notifications = state.notifications.map((raw) => {
          let migrated = { ...raw };

          if (!migrated.trigger) {
            const scheduledAt = typeof migrated.scheduledAt === 'string' ? migrated.scheduledAt : '';
            const trigger: NotificationTrigger =
              migrated.timing === 'scheduled' && scheduledAt
                ? { type: 'one_time', timing: 'scheduled', scheduledDate: scheduledAt.slice(0, 10), scheduledTime: scheduledAt.slice(11, 16) }
                : { type: 'one_time', timing: 'immediate' };
            delete migrated.timing;
            delete migrated.scheduledAt;
            migrated = { ...migrated, trigger, status: deriveNotificationStatus(trigger) };
          }

          const geo = migrated.geo as Record<string, unknown> | undefined;
          if (geo && !Array.isArray(geo.vendor_ids)) {
            const { vendor_id, ...restGeo } = geo as { vendor_id?: string };
            migrated = { ...migrated, geo: { ...restGeo, vendor_ids: vendor_id ? [vendor_id] : [] } };
          }

          return migrated as unknown as NotificationRecord;
        });

        // Append any seed notifications this store hasn't seen yet.
        const knownIds = new Set(notifications.map((record) => record.id));
        const merged = [...notifications, ...seedNotifications.filter((seed) => !knownIds.has(seed.id))];

        return { ...state, notifications: merged } as NotificationStore;
      },
    },
  ),
);
