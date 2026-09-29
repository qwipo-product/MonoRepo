import type {
  EventHook,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  NotificationTrigger,
  RecurringFrequency,
  RelativeOffset,
  TriggerType,
  WeekDay,
  WhatsAppTemplate,
} from '../types/notification';

export const categoryOptions: { value: NotificationCategory; label: string }[] = [
  { value: 'promotional', label: 'Promotional' },
  { value: 'operational', label: 'Operational' },
  { value: 'system', label: 'System / transactional' },
  { value: 'schemes', label: 'Schemes & margins' },
  { value: 'credit_payments', label: 'Credit & payments' },
];

export const categoryLabels: Record<NotificationCategory, string> = {
  promotional: 'Promotional',
  operational: 'Operational',
  system: 'System',
  schemes: 'Schemes & margins',
  credit_payments: 'Credit & payments',
};

export const categoryBadgeStyles: Record<NotificationCategory, string> = {
  promotional: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  operational: 'bg-gray-100 text-gray-700 border-gray-200',
  system: 'bg-blue-50 text-blue-700 border-blue-200',
  schemes: 'bg-purple-50 text-purple-700 border-purple-200',
  credit_payments: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const channelOptions: { id: NotificationChannel; label: string; description: string }[] = [
  { id: 'in_app', label: 'In-app drawer', description: 'Displays under the bell icon in the navbar.' },
  { id: 'push', label: 'Mobile push notification', description: 'Rich media and tracking alerts on the mobile app.' },
  { id: 'sms', label: 'SMS gateway', description: 'Fallback channel for low-connectivity or rural users.' },
  { id: 'whatsapp', label: 'WhatsApp Business API', description: 'Interactive menus, digital catalogues, and order receipts.' },
];

export const channelLabels: Record<NotificationChannel, string> = {
  in_app: 'In-app drawer',
  push: 'Push',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

export const triggerTypeOptions: { id: TriggerType; label: string; description: string }[] = [
  { id: 'one_time', label: 'One-time', description: 'Send once — immediately or at a scheduled date and time.' },
  { id: 'recurring', label: 'Recurring schedule', description: 'Repeats every day or on specific days of the week.' },
  { id: 'event', label: 'Event-based dynamic trigger', description: 'Fires automatically from a system hook, e.g. a beat reminder.' },
];

export const recurringFrequencyOptions: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const weekDayOptions: { id: WeekDay; label: string }[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export const weekDayLabels: Record<WeekDay, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export const eventHookOptions: { value: EventHook; label: string }[] = [
  { value: 'beat_serviceability', label: 'Beat serviceability / route day' },
  { value: 'order_status_change', label: 'Order status change' },
  { value: 'credit_due_date', label: 'Credit due date' },
];

export const eventHookLabels: Record<EventHook, string> = {
  beat_serviceability: 'Beat serviceability / route day',
  order_status_change: 'Order status change',
  credit_due_date: 'Credit due date',
};

export const relativeOffsetOptions: { value: RelativeOffset; label: string }[] = [
  { value: '1_day_before', label: '1 day before' },
  { value: '2_hours_before', label: '2 hours before' },
  { value: 'same_day_morning', label: 'Same day morning' },
];

export const relativeOffsetLabels: Record<RelativeOffset, string> = {
  '1_day_before': '1 day before',
  '2_hours_before': '2 hours before',
  same_day_morning: 'Same day morning',
};

/** Placeholders resolved from the beat schedule DB at send time — insertable into title/body. */
export const eventTemplatePlaceholders = ['{{buyer_name}}', '{{beat_name}}', '{{beat_date}}', '{{cutoff_time}}'] as const;

export function deriveNotificationStatus(trigger: NotificationTrigger): NotificationStatus {
  if (trigger.type === 'one_time') return trigger.timing === 'scheduled' ? 'scheduled' : 'sent';
  if (trigger.type === 'recurring') return 'recurring';
  return 'automated';
}

export const statusLabels: Record<NotificationStatus, string> = {
  sent: 'Sent',
  scheduled: 'Scheduled',
  recurring: 'Recurring',
  automated: 'Automated',
};

export const statusStyles: Record<NotificationStatus, string> = {
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  recurring: 'bg-purple-50 text-purple-700 border-purple-200',
  automated: 'bg-amber-50 text-amber-700 border-amber-200',
};

// The secondary sort key for the notifications list, applied only when two records share the
// same createdAt. Adapted analog to the promotions ordering: ongoing (recurring/automated)
// first, then upcoming (scheduled), then already-delivered one-offs (sent) last.
export const statusSortOrder: Record<NotificationStatus, number> = {
  recurring: 0,
  automated: 1,
  scheduled: 2,
  sent: 3,
};

export function describeTrigger(trigger: NotificationTrigger): string {
  if (trigger.type === 'one_time') {
    return trigger.timing === 'scheduled' ? `Scheduled for ${trigger.scheduledDate} at ${trigger.scheduledTime}` : 'Sent immediately';
  }
  if (trigger.type === 'recurring') {
    const frequencyLabel = recurringFrequencyOptions.find((option) => option.value === trigger.frequency)?.label ?? trigger.frequency;
    const detail =
      trigger.frequency === 'weekly' && trigger.daysOfWeek.length > 0
        ? ` (${trigger.daysOfWeek.map((day) => weekDayLabels[day]).join(', ')})`
        : trigger.frequency === 'monthly' && trigger.dayOfMonth
          ? ` (day ${trigger.dayOfMonth})`
          : '';
    return `${frequencyLabel}${detail} at ${trigger.dispatchTime}, ${trigger.startDate} – ${trigger.endDate}`;
  }
  return `${eventHookLabels[trigger.eventHook]} · ${relativeOffsetLabels[trigger.relativeOffset]}`;
}

export function formatScheduledAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- Channel-specific content rules ---------------------------------------------

/** Title/body caps per channel that supports free-form copy. SMS and WhatsApp aren't here —
 * SMS has no title and its body limit is dynamic (see `getSmsSegmentInfo`), and WhatsApp has no
 * free-form copy at all, only approved-template variables. */
export const channelContentLimits: Record<'push' | 'in_app', { title: number; body: number }> = {
  push: { title: 35, body: 128 },
  in_app: { title: 50, body: 250 },
};

export const whatsappTemplates: WhatsAppTemplate[] = [
  { id: 'wa_order_update', name: 'Order status update', bodyPreview: 'Hi {{1}}, your order {{2}} is now {{3}}.', variableCount: 3 },
  { id: 'wa_promo_alert', name: 'Promotional alert', bodyPreview: '{{1}}, check out our latest offer on {{2}}.', variableCount: 2 },
  { id: 'wa_payment_reminder', name: 'Payment reminder', bodyPreview: 'Dear {{1}}, your payment of {{2}} is due on {{3}}.', variableCount: 3 },
];

/** Extracts the `{{1}}`, `{{2}}`... placeholders from a template body, in order of first
 * appearance, so the composer can render exactly one input per variable the template needs. */
export function getTemplateVariableKeys(bodyPreview: string): string[] {
  const matches = bodyPreview.match(/\{\{\d+\}\}/g) ?? [];
  return Array.from(new Set(matches));
}

export const dltTemplates: { id: string; name: string }[] = [
  { id: 'DLT-1007856231458796', name: 'Order confirmation' },
  { id: 'DLT-1007856231458797', name: 'Payment reminder' },
  { id: 'DLT-1007856231458798', name: 'Promotional offer' },
];

/**
 * GSM-7 concatenated-SMS math: a single segment holds 160 characters; once a message needs to
 * split across segments, 7 characters per segment go to the concatenation header, leaving 153
 * usable characters each — so 2 segments cap at 153 * 2 = 306, matching the spec's own numbers.
 */
export function getSmsSegmentInfo(length: number): { limit: number; segments: number } {
  if (length <= 160) return { limit: 160, segments: 1 };
  const segments = Math.ceil(length / 153);
  return { limit: segments * 153, segments };
}
