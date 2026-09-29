import type { GeoScope } from './campaign';

export const notificationCategories = ['promotional', 'operational', 'system', 'schemes', 'credit_payments'] as const;
export type NotificationCategory = (typeof notificationCategories)[number];

export const notificationChannels = ['in_app', 'push', 'sms', 'whatsapp'] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const triggerTypes = ['one_time', 'recurring', 'event'] as const;
export type TriggerType = (typeof triggerTypes)[number];

export type OneTimeTiming = 'immediate' | 'scheduled';

export const recurringFrequencies = ['daily', 'weekly', 'monthly'] as const;
export type RecurringFrequency = (typeof recurringFrequencies)[number];

export const weekDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekDay = (typeof weekDays)[number];

export const eventHooks = ['beat_serviceability', 'order_status_change', 'credit_due_date'] as const;
export type EventHook = (typeof eventHooks)[number];

export const relativeOffsets = ['1_day_before', '2_hours_before', 'same_day_morning'] as const;
export type RelativeOffset = (typeof relativeOffsets)[number];

/**
 * How the notification gets dispatched. A discriminated union on `type` — each variant only
 * carries the fields that trigger type actually needs, so a recurring config can never end up
 * with a stray `scheduledDate` left over from a one-time config, etc.
 */
export type NotificationTrigger =
  | { type: 'one_time'; timing: 'immediate' }
  | { type: 'one_time'; timing: 'scheduled'; scheduledDate: string; scheduledTime: string }
  | {
      type: 'recurring';
      frequency: RecurringFrequency;
      daysOfWeek: WeekDay[];
      dayOfMonth?: number;
      dispatchTime: string;
      startDate: string;
      endDate: string;
    }
  | { type: 'event'; eventHook: EventHook; relativeOffset: RelativeOffset };

export const notificationStatuses = ['sent', 'scheduled', 'recurring', 'automated'] as const;
export type NotificationStatus = (typeof notificationStatuses)[number];

export interface WhatsAppTemplate {
  id: string;
  name: string;
  /** The approved template body, with `{{1}}`, `{{2}}`... placeholders literally in the text. */
  bodyPreview: string;
  variableCount: number;
}

/**
 * Per-channel content, keyed by channel — only the channels actually selected on a notification
 * get an entry. Each channel enforces its own field shape (SMS has no title, WhatsApp has no
 * free-form copy at all, only template variables) rather than one global title/body that breaks
 * the moment a channel with different constraints is selected.
 */
export interface ChannelContent {
  push: { title: string; body: string };
  in_app: { title: string; body: string };
  sms: { dltTemplateId: string; body: string };
  whatsapp: { templateId: string; variables: Record<string, string> };
}

export interface NotificationRecord {
  id: string;
  category: NotificationCategory;
  /** Denormalized from the Push (or first populated) channel's copy — kept so the list page's
   * title/message column and search can stay channel-shape-agnostic. */
  title: string;
  body: string;
  ctaLink?: string;
  geo: GeoScope;
  channels: NotificationChannel[];
  /** Only present for channels actually selected on this notification. Optional so existing
   * records (and the seed catalog) don't need a retroactive migration. */
  content?: Partial<ChannelContent>;
  trigger: NotificationTrigger;
  status: NotificationStatus;
  createdAt: string;
}
