import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Image as ImageIcon,
  Layers,
  MessageCircle,
  MessageSquare,
  Radio,
  Repeat,
  Send,
  Smartphone,
  X,
  Zap,
} from 'lucide-react';

import {
  categoryLabels,
  categoryOptions,
  channelLabels,
  describeTrigger,
  dltTemplates,
  eventHookOptions,
  eventTemplatePlaceholders,
  getSmsSegmentInfo,
  getTemplateVariableKeys,
  channelContentLimits,
  recurringFrequencyOptions,
  relativeOffsetOptions,
  triggerTypeOptions,
  weekDayOptions,
  whatsappTemplates,
} from '../../lib/notification-copy';
import { ALL_ID, vendors } from '../../lib/mock-data';
import { createEmptyGeoScope, describeGeo } from '../../lib/promotion-copy';
import { useNotificationStore } from '../../store/useNotificationStore';
import type { GeoScope } from '../../types/campaign';
import type {
  ChannelContent,
  EventHook,
  NotificationCategory,
  NotificationChannel,
  NotificationTrigger,
  OneTimeTiming,
  RecurringFrequency,
  RelativeOffset,
  TriggerType,
  WeekDay,
} from '../../types/notification';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, cn } from '@mockups/web-ui';
import { CheckboxList } from '../wizard/checkbox-list';
import { GeoSellerVendorFields } from '../wizard/geo-seller-vendor-fields';
import { RadioCardGroup, type RadioCardOption } from '../wizard/radio-card-group';
import { SelectField, type SelectFieldOption } from '../wizard/select-field';
import { WizardShell } from '../wizard/wizard-shell';

type WizardStep = 1 | 2 | 3;

type PushContent = ChannelContent['push'];
type InAppContent = ChannelContent['in_app'];
type SmsContent = ChannelContent['sms'];
type WhatsAppContent = ChannelContent['whatsapp'];

interface ComposerState {
  category: NotificationCategory | null;
  geo: GeoScope;
  channels: NotificationChannel[];
  ctaLink: string;
  syncContent: boolean;
  push: PushContent;
  inApp: InAppContent;
  sms: SmsContent;
  whatsapp: WhatsAppContent;
  triggerType: TriggerType;
  oneTimeTiming: OneTimeTiming;
  scheduledDate: string;
  scheduledTime: string;
  recurringFrequency: RecurringFrequency;
  daysOfWeek: WeekDay[];
  dayOfMonth: number | null;
  dispatchTime: string;
  activeStartDate: string;
  activeEndDate: string;
  eventHook: EventHook;
  relativeOffset: RelativeOffset;
}

type TouchedField = 'category' | 'channels' | 'cta' | 'push' | 'inApp' | 'sms' | 'whatsapp' | 'trigger';

const initialForm: ComposerState = {
  category: null,
  geo: createEmptyGeoScope(),
  channels: [],
  ctaLink: '',
  syncContent: false,
  push: { title: '', body: '' },
  inApp: { title: '', body: '' },
  sms: { dltTemplateId: '', body: '' },
  whatsapp: { templateId: '', variables: {} },
  triggerType: 'one_time',
  oneTimeTiming: 'immediate',
  scheduledDate: '',
  scheduledTime: '',
  recurringFrequency: 'daily',
  daysOfWeek: [],
  dayOfMonth: null,
  dispatchTime: '',
  activeStartDate: '',
  activeEndDate: '',
  eventHook: 'beat_serviceability',
  relativeOffset: '1_day_before',
};

const stepMeta: { id: WizardStep; label: string }[] = [
  { id: 1, label: 'Audience & channels' },
  { id: 2, label: 'Channel content' },
  { id: 3, label: 'Schedule & review' },
];

const categorySelectOptions: SelectFieldOption[] = [
  { value: '', label: 'Select a category...' },
  ...categoryOptions.map((option) => ({ value: option.value, label: option.label })),
];

const recurringFrequencySelectOptions: SelectFieldOption[] = recurringFrequencyOptions.map((option) => ({
  value: option.value,
  label: option.label,
}));

const eventHookSelectOptions: SelectFieldOption[] = eventHookOptions.map((option) => ({ value: option.value, label: option.label }));

const relativeOffsetSelectOptions: SelectFieldOption[] = relativeOffsetOptions.map((option) => ({ value: option.value, label: option.label }));

const whatsappTemplateSelectOptions: SelectFieldOption[] = [
  { value: '', label: 'Select an approved template...' },
  ...whatsappTemplates.map((template) => ({ value: template.id, label: template.name })),
];

const dltTemplateSelectOptions: SelectFieldOption[] = [
  { value: '', label: 'Select a DLT template...' },
  ...dltTemplates.map((template) => ({ value: template.id, label: `${template.name} (${template.id})` })),
];

const triggerTypeIcons: Record<TriggerType, typeof Calendar> = {
  one_time: Calendar,
  recurring: Repeat,
  event: Zap,
};

const triggerTypeCardOptions: RadioCardOption[] = triggerTypeOptions.map((option) => ({
  id: option.id,
  label: option.label,
  description: option.description,
  icon: triggerTypeIcons[option.id],
}));

const oneTimeTimingCardOptions: RadioCardOption[] = [
  { id: 'immediate', label: 'Send immediately', description: 'Delivers as soon as you publish.' },
  { id: 'scheduled', label: 'Schedule for later', description: 'Pick a future date and time.' },
];

const channelTabOrder: NotificationChannel[] = ['push', 'in_app', 'whatsapp', 'sms'];
const channelTabIcons: Record<NotificationChannel, typeof Bell> = {
  in_app: Bell,
  push: Smartphone,
  sms: MessageSquare,
  whatsapp: MessageCircle,
};

// --- Microcopy validation ----------------------------------------------------

function hasExclamation(value: string) {
  return value.includes('!');
}

function startsWithCapital(value: string) {
  return /^[A-Z]/.test(value.trim());
}

function isShouting(value: string) {
  const letters = value.replace(/[^A-Za-z]/g, '');
  return letters.length > 3 && letters === letters.toUpperCase();
}

function isNonEmpty(value: string) {
  return value.trim().length > 0;
}

/** Blocking validation shared by every channel's free-form title/body: required, sentence
 * case, no exclamation points. Length caps are enforced separately as a non-blocking overflow
 * warning (Push explicitly says "warn on overflow", so caps never hard-stop typing here). */
function validateChannelCopy(value: string, kind: 'title' | 'body'): string | null {
  const trimmed = value.trim();
  if (!trimmed) return kind === 'title' ? 'Title is required.' : 'Message body is required.';
  if (hasExclamation(trimmed)) return 'Remove the exclamation mark — none allowed in product copy.';
  if (kind === 'title' && !startsWithCapital(trimmed)) return 'Start with a capital letter (sentence case).';
  if (isShouting(trimmed)) return 'Use sentence case, not all caps.';
  return null;
}

function validateCtaLink(link: string): string | null {
  if (!link.trim()) return null;
  if (!link.trim().startsWith('/')) return 'Use a relative path starting with /.';
  return null;
}

// --- Channel creative upload validation ---------------------------------------

interface ImageDimensionSpec {
  width: number;
  height: number;
  maxSizeBytes: number;
}

interface ChannelMediaAsset {
  fileName: string;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

type MediaChannel = Exclude<NotificationChannel, 'sms'>;

const channelMediaSpecs: Record<MediaChannel, ImageDimensionSpec> = {
  push: { width: 1200, height: 600, maxSizeBytes: 2 * 1024 * 1024 },
  in_app: { width: 512, height: 512, maxSizeBytes: 1 * 1024 * 1024 },
  whatsapp: { width: 1200, height: 628, maxSizeBytes: 5 * 1024 * 1024 },
};

const channelMediaSpecLabels: Record<MediaChannel, string> = {
  push: '1200 × 600px (2:1) · max 2 MB',
  in_app: '512 × 512px (1:1) · max 1 MB',
  whatsapp: '1200 × 628px (1.91:1) · max 5 MB',
};

function isMediaChannel(channel: NotificationChannel): channel is MediaChannel {
  return channel !== 'sms';
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Dynamic image dimension validator: reads the file into a data URL, decodes it through an
 * HTMLImageElement to read its true natural pixel dimensions, and rejects anything that isn't
 * an exact match for the channel's required canvas (or over its size cap) before it ever
 * reaches form state — so an out-of-spec creative can never silently attach to a channel.
 */
function validateChannelImage(file: File, spec: ImageDimensionSpec): Promise<{ ok: true; asset: ChannelMediaAsset } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ ok: false, error: 'Upload an image file.' });
      return;
    }
    if (file.size > spec.maxSizeBytes) {
      resolve({ ok: false, error: `File is ${formatBytes(file.size)} — max is ${formatBytes(spec.maxSizeBytes)}.` });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve({ ok: false, error: "Couldn't read the file." });
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => resolve({ ok: false, error: "Couldn't decode the image." });
      img.onload = () => {
        if (img.naturalWidth !== spec.width || img.naturalHeight !== spec.height) {
          resolve({
            ok: false,
            error: `Must be exactly ${spec.width} × ${spec.height}px — this file is ${img.naturalWidth} × ${img.naturalHeight}px.`,
          });
          return;
        }
        resolve({
          ok: true,
          asset: { fileName: file.name, dataUrl, width: img.naturalWidth, height: img.naturalHeight, sizeBytes: file.size },
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function describeVendors(geo: GeoScope): string {
  if (geo.vendor_ids.length === 0) return 'No specific vendor';
  if (geo.vendor_ids.includes(ALL_ID)) return 'All vendors in scope';
  const names = geo.vendor_ids.map((id) => vendors.find((vendor) => vendor.id === id)?.name).filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(', ') : 'No specific vendor';
}

// --- Small shared pieces ------------------------------------------------------

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function FieldWarning({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-amber-600">{message}</p>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function ChipToggle({
  options,
  selectedIds,
  onChange,
}: {
  options: { id: string; label: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(isSelected ? selectedIds.filter((id) => id !== option.id) : [...selectedIds, option.id])}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition',
              isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ChannelMediaUploader({
  channel,
  asset,
  error,
  isValidating,
  onFileSelected,
  onRemove,
}: {
  channel: MediaChannel;
  asset: ChannelMediaAsset | undefined;
  error: string | undefined;
  isValidating: boolean;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}) {
  const inputId = `notif-media-${channel}`;

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-700">
        {channelLabels[channel]} creative <span className="font-normal text-gray-400">— {channelMediaSpecLabels[channel]}</span>
      </p>

      {asset ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
          <img src={asset.dataUrl} alt={asset.fileName} className="size-14 shrink-0 rounded-md border border-gray-200 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-900">{asset.fileName}</p>
            <p className="text-xs text-gray-500">
              {asset.width} × {asset.height}px · {formatBytes(asset.sizeBytes)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Remove ${channelLabels[channel]} image`}
            className="h-8 w-8 shrink-0 text-gray-400 hover:bg-gray-100 hover:text-red-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center transition-colors',
            error ? 'border-red-200 bg-red-50' : 'border-gray-300 bg-white hover:border-primary',
          )}
        >
          <ImageIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="text-xs font-medium text-gray-600">{isValidating ? 'Checking image…' : 'Click or drop an image'}</span>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
      )}

      {error && <FieldError message={error} />}
    </div>
  );
}

// --- Trigger construction -------------------------------------------------------

function buildTrigger(form: ComposerState): NotificationTrigger {
  if (form.triggerType === 'one_time') {
    if (form.oneTimeTiming === 'scheduled') {
      return { type: 'one_time', timing: 'scheduled', scheduledDate: form.scheduledDate, scheduledTime: form.scheduledTime };
    }
    return { type: 'one_time', timing: 'immediate' };
  }
  if (form.triggerType === 'recurring') {
    return {
      type: 'recurring',
      frequency: form.recurringFrequency,
      daysOfWeek: form.recurringFrequency === 'weekly' ? form.daysOfWeek : [],
      dayOfMonth: form.recurringFrequency === 'monthly' ? (form.dayOfMonth ?? undefined) : undefined,
      dispatchTime: form.dispatchTime,
      startDate: form.activeStartDate,
      endDate: form.activeEndDate,
    };
  }
  return { type: 'event', eventHook: form.eventHook, relativeOffset: form.relativeOffset };
}

/** Denormalized title/body for the record — Push copy wins, falling back to In-App, then a
 * generated stand-in for WhatsApp/SMS-only sends, so the list page's title/message column and
 * search never need to know about per-channel content shapes. */
function deriveRecordCopy(form: ComposerState): { title: string; body: string } {
  if (form.channels.includes('push')) return { title: form.push.title.trim(), body: form.push.body.trim() };
  if (form.channels.includes('in_app')) return { title: form.inApp.title.trim(), body: form.inApp.body.trim() };
  if (form.channels.includes('whatsapp')) {
    const template = whatsappTemplates.find((option) => option.id === form.whatsapp.templateId);
    return { title: template?.name ?? 'WhatsApp notification', body: template?.bodyPreview ?? '' };
  }
  if (form.channels.includes('sms')) return { title: 'SMS notification', body: form.sms.body.trim() };
  return { title: '', body: '' };
}

function buildChannelContent(form: ComposerState): Partial<ChannelContent> {
  const content: Partial<ChannelContent> = {};
  if (form.channels.includes('push')) content.push = { title: form.push.title.trim(), body: form.push.body.trim() };
  if (form.channels.includes('in_app')) content.in_app = { title: form.inApp.title.trim(), body: form.inApp.body.trim() };
  if (form.channels.includes('sms')) content.sms = { dltTemplateId: form.sms.dltTemplateId, body: form.sms.body.trim() };
  if (form.channels.includes('whatsapp')) content.whatsapp = { templateId: form.whatsapp.templateId, variables: form.whatsapp.variables };
  return content;
}

// --- Main component -------------------------------------------------------------

export function NotificationComposer() {
  const navigate = useNavigate();
  const createNotification = useNotificationStore((state) => state.createNotification);

  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<ComposerState>(initialForm);
  const [touched, setTouched] = useState<Partial<Record<TouchedField, boolean>>>({});
  const [channelMedia, setChannelMedia] = useState<Partial<Record<MediaChannel, ChannelMediaAsset>>>({});
  const [channelMediaErrors, setChannelMediaErrors] = useState<Partial<Record<MediaChannel, string>>>({});
  const [channelMediaValidating, setChannelMediaValidating] = useState<Partial<Record<MediaChannel, boolean>>>({});

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const update = <K extends keyof ComposerState>(key: K, value: ComposerState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const markTouched = (field: TouchedField) => setTouched((prev) => ({ ...prev, [field]: true }));

  const updateGeo = (patch: Partial<GeoScope>) => setForm((prev) => ({ ...prev, geo: { ...prev.geo, ...patch } }));

  const syncActive = form.syncContent && form.channels.includes('push');

  // Push is the sync "source": editing its title/body also writes In-App and SMS (each clamped
  // to its own cap) in the same update — done inline here, not in an effect, so there's never a
  // stale-then-corrected render in between.
  const updatePush = (patch: Partial<PushContent>) => {
    setForm((prev) => {
      const nextPush = { ...prev.push, ...patch };
      if (!(prev.syncContent && prev.channels.includes('push'))) return { ...prev, push: nextPush };
      const nextInApp = { ...prev.inApp };
      if (patch.title !== undefined) nextInApp.title = patch.title.slice(0, channelContentLimits.in_app.title);
      if (patch.body !== undefined) nextInApp.body = patch.body.slice(0, channelContentLimits.in_app.body);
      const nextSms = patch.body !== undefined ? { ...prev.sms, body: patch.body.slice(0, 160) } : prev.sms;
      return { ...prev, push: nextPush, inApp: nextInApp, sms: nextSms };
    });
  };

  const updateInApp = (patch: Partial<InAppContent>) => setForm((prev) => ({ ...prev, inApp: { ...prev.inApp, ...patch } }));
  const updateSms = (patch: Partial<SmsContent>) => setForm((prev) => ({ ...prev, sms: { ...prev.sms, ...patch } }));
  const updateWhatsapp = (patch: Partial<WhatsAppContent>) => setForm((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, ...patch } }));

  const handleTriggerTypeChange = (nextType: TriggerType) => {
    setForm((prev) => ({
      ...prev,
      triggerType: nextType,
      // Event-based system hooks are dispatched over WhatsApp Business API by default.
      channels: nextType === 'event' && !prev.channels.includes('whatsapp') ? [...prev.channels, 'whatsapp'] : prev.channels,
    }));
    markTouched('trigger');
  };

  const handleChannelFileSelected = (channel: MediaChannel, file: File) => {
    setChannelMediaErrors((prev) => ({ ...prev, [channel]: undefined }));
    setChannelMediaValidating((prev) => ({ ...prev, [channel]: true }));
    validateChannelImage(file, channelMediaSpecs[channel]).then((result) => {
      setChannelMediaValidating((prev) => ({ ...prev, [channel]: false }));
      if (result.ok) {
        setChannelMedia((prev) => ({ ...prev, [channel]: result.asset }));
      } else {
        // strictNullChecks is off repo-wide, which keeps TS from narrowing this discriminated
        // union past the `if` above — cast at the access point rather than fighting the checker.
        setChannelMediaErrors((prev) => ({ ...prev, [channel]: (result as { ok: false; error: string }).error }));
      }
    });
  };

  const handleChannelMediaRemove = (channel: MediaChannel) => {
    setChannelMedia((prev) => {
      const next = { ...prev };
      delete next[channel];
      return next;
    });
    setChannelMediaErrors((prev) => {
      const next = { ...prev };
      delete next[channel];
      return next;
    });
  };

  // --- Validation ---
  const ctaError = validateCtaLink(form.ctaLink);
  const step1Valid = Boolean(form.category) && form.channels.length > 0;

  const pushTitleError = form.channels.includes('push') ? validateChannelCopy(form.push.title, 'title') : null;
  const pushBodyError = form.channels.includes('push') ? validateChannelCopy(form.push.body, 'body') : null;
  const inAppTitleError = form.channels.includes('in_app') ? validateChannelCopy(form.inApp.title, 'title') : null;
  const inAppBodyError = form.channels.includes('in_app') ? validateChannelCopy(form.inApp.body, 'body') : null;

  const smsError = form.channels.includes('sms')
    ? !isNonEmpty(form.sms.dltTemplateId)
      ? 'Select a DLT template.'
      : !isNonEmpty(form.sms.body)
        ? 'Message body is required.'
        : hasExclamation(form.sms.body)
          ? 'Remove the exclamation mark — none allowed in product copy.'
          : null
    : null;

  const whatsappTemplate = whatsappTemplates.find((option) => option.id === form.whatsapp.templateId);
  const whatsappVariableKeys = whatsappTemplate ? getTemplateVariableKeys(whatsappTemplate.bodyPreview) : [];
  const whatsappError = form.channels.includes('whatsapp')
    ? !form.whatsapp.templateId
      ? 'Select an approved template.'
      : whatsappVariableKeys.some((key) => !isNonEmpty(form.whatsapp.variables[key] ?? ''))
        ? 'Fill in every template variable.'
        : null
    : null;

  const step2Valid = !pushTitleError && !pushBodyError && !inAppTitleError && !inAppBodyError && !smsError && !whatsappError && !ctaError;

  const scheduleValid = useMemo(() => {
    if (form.triggerType === 'one_time') {
      return form.oneTimeTiming === 'immediate' || (Boolean(form.scheduledDate) && Boolean(form.scheduledTime));
    }
    if (form.triggerType === 'recurring') {
      const daysOk = form.recurringFrequency !== 'weekly' || form.daysOfWeek.length > 0;
      const monthOk = form.recurringFrequency !== 'monthly' || Boolean(form.dayOfMonth);
      return daysOk && monthOk && Boolean(form.dispatchTime) && Boolean(form.activeStartDate) && Boolean(form.activeEndDate);
    }
    return Boolean(form.eventHook) && Boolean(form.relativeOffset);
  }, [
    form.triggerType,
    form.oneTimeTiming,
    form.scheduledDate,
    form.scheduledTime,
    form.recurringFrequency,
    form.daysOfWeek,
    form.dayOfMonth,
    form.dispatchTime,
    form.activeStartDate,
    form.activeEndDate,
    form.eventHook,
    form.relativeOffset,
  ]);

  const step3Valid = scheduleValid;

  const stepValid = step === 1 ? step1Valid : step === 2 ? step2Valid : step3Valid;

  // Errors only surface once a field has been touched — a hard-disabled Continue button means
  // there's no "click to reveal errors" moment, so each control reports its own state.
  const showCategoryError = touched.category && !form.category;
  const showChannelsError = touched.channels && form.channels.length === 0;
  const showCtaError = ctaError && (touched.cta || form.ctaLink.length > 0);
  const showPushError = touched.push || form.push.title.length > 0 || form.push.body.length > 0;
  const showInAppError = touched.inApp || form.inApp.title.length > 0 || form.inApp.body.length > 0;
  const showSmsError = touched.sms || form.sms.body.length > 0 || form.sms.dltTemplateId.length > 0;
  const showWhatsappError = touched.whatsapp || form.whatsapp.templateId.length > 0;
  const showScheduleError = touched.trigger && !scheduleValid;

  const geoSummary = useMemo(() => describeGeo(form.geo), [form.geo]);
  const vendorSummary = useMemo(() => describeVendors(form.geo), [form.geo]);
  const triggerSummary = useMemo(() => describeTrigger(buildTrigger(form)), [form]);
  const recordCopy = useMemo(() => deriveRecordCopy(form), [form]);

  const handleBack = () => {
    if (step === 1) {
      navigate('/notifications');
      return;
    }
    setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current));
  };

  const handleNext = () => {
    if (!stepValid) return;
    setTouched({});
    setStep((current) => (current < 3 ? ((current + 1) as WizardStep) : current));
  };

  const handlePublish = () => {
    if (!step1Valid || !step2Valid || !step3Valid) return;
    const { title, body } = deriveRecordCopy(form);
    createNotification({
      category: form.category as NotificationCategory,
      title,
      body,
      ctaLink: form.ctaLink.trim() || undefined,
      geo: form.geo,
      channels: form.channels,
      content: buildChannelContent(form),
      trigger: buildTrigger(form),
    });
    navigate('/notifications');
  };

  return (
    <WizardShell
      title="Create notification"
      steps={stepMeta.map((meta) => meta.label)}
      currentStep={step}
      maxWidthClassName="max-w-3xl"
      footer={
        <div className="flex flex-col gap-2">
          {step === 3 && !step2Valid && (
            <FieldError message="Channel content is incomplete (an Event trigger may have added WhatsApp automatically) — go back to Channel content to finish it." />
          )}
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext} disabled={!stepValid}>
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={!step1Valid || !step2Valid || !step3Valid}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {form.triggerType === 'one_time' && form.oneTimeTiming === 'scheduled' ? 'Schedule notification' : 'Publish notification'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {step === 1 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-4 text-gray-500" aria-hidden="true" />
                Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SelectField
                label="Category"
                options={categorySelectOptions}
                value={form.category ?? ''}
                onChange={(value) => {
                  update('category', (value || null) as NotificationCategory | null);
                  markTouched('category');
                }}
                error={showCategoryError ? 'Select a category to continue.' : undefined}
              />
            </CardContent>
          </Card>

          <GeoSellerVendorFields geo={form.geo} onChange={updateGeo} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="size-4 text-gray-500" aria-hidden="true" />
                Delivery channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CheckboxList
                options={[
                  { id: 'push', label: 'Mobile push notification' },
                  { id: 'in_app', label: 'In-app drawer' },
                  { id: 'whatsapp', label: 'WhatsApp Business API' },
                  { id: 'sms', label: 'SMS gateway' },
                ]}
                selectedIds={form.channels}
                onChange={(ids) => {
                  update('channels', ids as NotificationChannel[]);
                  markTouched('channels');
                }}
              />
              <p className="text-xs text-gray-500">
                Always available, regardless of audience scope — pick channels freely even for a Pan-India broadcast. Content for each channel
                you pick here is composed next.
              </p>
              {showChannelsError && <FieldError message="Select at least one delivery channel to continue." />}
            </CardContent>
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="notif-cta">Call to action / deep link</Label>
                <Input
                  id="notif-cta"
                  value={form.ctaLink}
                  onChange={(event) => update('ctaLink', event.target.value)}
                  onBlur={() => markTouched('cta')}
                  placeholder="/promotions/cmp-2026-001"
                  aria-invalid={Boolean(showCtaError)}
                />
                {showCtaError ? (
                  <FieldError message={ctaError} />
                ) : (
                  <p className="text-xs text-gray-500">Optional — internal app route the notification deep-links to. Shared across every channel.</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Sync title and body across all supported channels</p>
                  <p className="text-xs text-gray-500">
                    Editing Push title/body auto-fills In-App, and Push body auto-fills SMS (truncated to 160 characters).
                    {!form.channels.includes('push') && ' Requires Mobile push to be selected.'}
                  </p>
                </div>
                <Switch
                  checked={syncActive}
                  disabled={!form.channels.includes('push')}
                  onCheckedChange={(checked) => update('syncContent', checked)}
                  aria-label="Sync title and body across all supported channels"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={channelTabOrder.find((channel) => form.channels.includes(channel)) ?? 'push'}>
            <TabsList>
              {channelTabOrder
                .filter((channel) => form.channels.includes(channel))
                .map((channel) => {
                  const Icon = channelTabIcons[channel];
                  return (
                    <TabsTrigger key={channel} value={channel}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {channelLabels[channel]}
                    </TabsTrigger>
                  );
                })}
            </TabsList>

            {form.channels.includes('push') && (
              <TabsContent value="push">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="size-4 text-gray-500" aria-hidden="true" />
                      Mobile push
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="push-title">Title</Label>
                      <Input
                        id="push-title"
                        value={form.push.title}
                        onChange={(event) => updatePush({ title: event.target.value })}
                        onBlur={() => markTouched('push')}
                        placeholder="e.g. Weekend restock offer is live"
                        aria-invalid={Boolean(showPushError && pushTitleError)}
                      />
                      <div className="flex items-center justify-between gap-3">
                        {showPushError && pushTitleError ? (
                          <FieldError message={pushTitleError} />
                        ) : form.push.title.length > channelContentLimits.push.title ? (
                          <FieldWarning message="Longer than 35 characters may be truncated by the OS." />
                        ) : (
                          <p className="text-xs text-gray-500">Sentence case, no exclamation points.</p>
                        )}
                        <span className="shrink-0 text-xs text-gray-400">
                          {form.push.title.length}/{channelContentLimits.push.title}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="push-body">Body</Label>
                      <Textarea
                        id="push-body"
                        value={form.push.body}
                        onChange={(event) => updatePush({ body: event.target.value })}
                        onBlur={() => markTouched('push')}
                        rows={3}
                        placeholder="Keep it operational and specific — what changed and what to do next."
                        aria-invalid={Boolean(showPushError && pushBodyError)}
                      />
                      <div className="flex items-center justify-between gap-3">
                        {showPushError && pushBodyError ? (
                          <FieldError message={pushBodyError} />
                        ) : form.push.body.length > channelContentLimits.push.body ? (
                          <FieldWarning message="Longer than 128 characters may be truncated by the OS." />
                        ) : (
                          <p className="text-xs text-gray-500">No exclamation points.</p>
                        )}
                        <span className="shrink-0 text-xs text-gray-400">
                          {form.push.body.length}/{channelContentLimits.push.body}
                        </span>
                      </div>
                    </div>

                    <ChannelMediaUploader
                      channel="push"
                      asset={channelMedia.push}
                      error={channelMediaErrors.push}
                      isValidating={Boolean(channelMediaValidating.push)}
                      onFileSelected={(file) => handleChannelFileSelected('push', file)}
                      onRemove={() => handleChannelMediaRemove('push')}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {form.channels.includes('in_app') && (
              <TabsContent value="in_app">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="size-4 text-gray-500" aria-hidden="true" />
                      In-app drawer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inapp-title">Title</Label>
                      <Input
                        id="inapp-title"
                        value={form.inApp.title}
                        onChange={(event) => updateInApp({ title: event.target.value })}
                        onBlur={() => markTouched('inApp')}
                        placeholder="e.g. Weekend restock offer is live"
                        aria-invalid={Boolean(showInAppError && inAppTitleError)}
                      />
                      <div className="flex items-center justify-between gap-3">
                        {showInAppError && inAppTitleError ? (
                          <FieldError message={inAppTitleError} />
                        ) : form.inApp.title.length > channelContentLimits.in_app.title ? (
                          <FieldWarning message="Longer than 50 characters may wrap awkwardly in the drawer." />
                        ) : (
                          <p className="text-xs text-gray-500">Sentence case, no exclamation points.</p>
                        )}
                        <span className="shrink-0 text-xs text-gray-400">
                          {form.inApp.title.length}/{channelContentLimits.in_app.title}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inapp-body">Body</Label>
                      <Textarea
                        id="inapp-body"
                        value={form.inApp.body}
                        onChange={(event) => updateInApp({ body: event.target.value })}
                        onBlur={() => markTouched('inApp')}
                        rows={3}
                        placeholder="Keep it operational and specific — what changed and what to do next."
                        aria-invalid={Boolean(showInAppError && inAppBodyError)}
                      />
                      <div className="flex items-center justify-between gap-3">
                        {showInAppError && inAppBodyError ? (
                          <FieldError message={inAppBodyError} />
                        ) : form.inApp.body.length > channelContentLimits.in_app.body ? (
                          <FieldWarning message="Longer than 250 characters may be clipped in the drawer." />
                        ) : (
                          <p className="text-xs text-gray-500">No exclamation points.</p>
                        )}
                        <span className="shrink-0 text-xs text-gray-400">
                          {form.inApp.body.length}/{channelContentLimits.in_app.body}
                        </span>
                      </div>
                    </div>

                    <ChannelMediaUploader
                      channel="in_app"
                      asset={channelMedia.in_app}
                      error={channelMediaErrors.in_app}
                      isValidating={Boolean(channelMediaValidating.in_app)}
                      onFileSelected={(file) => handleChannelFileSelected('in_app', file)}
                      onRemove={() => handleChannelMediaRemove('in_app')}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {form.channels.includes('whatsapp') && (
              <TabsContent value="whatsapp">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="size-4 text-gray-500" aria-hidden="true" />
                      WhatsApp Business API
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <SelectField
                      label="Approved template"
                      options={whatsappTemplateSelectOptions}
                      value={form.whatsapp.templateId}
                      onChange={(value) => {
                        updateWhatsapp({ templateId: value, variables: {} });
                        markTouched('whatsapp');
                      }}
                      error={showWhatsappError && !form.whatsapp.templateId ? 'Select an approved template.' : undefined}
                    />

                    {whatsappTemplate ? (
                      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="font-mono text-xs leading-5 text-gray-600">{whatsappTemplate.bodyPreview}</p>
                        {whatsappVariableKeys.map((key) => (
                          <div key={key} className="space-y-1.5">
                            <Label htmlFor={`wa-var-${key}`}>Variable {key}</Label>
                            <Input
                              id={`wa-var-${key}`}
                              value={form.whatsapp.variables[key] ?? ''}
                              onChange={(event) => updateWhatsapp({ variables: { ...form.whatsapp.variables, [key]: event.target.value } })}
                              onBlur={() => markTouched('whatsapp')}
                              placeholder={`Value for ${key}`}
                            />
                          </div>
                        ))}
                        {showWhatsappError && whatsappError && form.whatsapp.templateId && <FieldError message={whatsappError} />}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Free-form title and body are disabled for WhatsApp — pick a template above.</p>
                    )}

                    <ChannelMediaUploader
                      channel="whatsapp"
                      asset={channelMedia.whatsapp}
                      error={channelMediaErrors.whatsapp}
                      isValidating={Boolean(channelMediaValidating.whatsapp)}
                      onFileSelected={(file) => handleChannelFileSelected('whatsapp', file)}
                      onRemove={() => handleChannelMediaRemove('whatsapp')}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {form.channels.includes('sms') && (
              <TabsContent value="sms">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-gray-500" aria-hidden="true" />
                      SMS gateway
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <SelectField
                      label="DLT template"
                      options={dltTemplateSelectOptions}
                      value={form.sms.dltTemplateId}
                      onChange={(value) => {
                        updateSms({ dltTemplateId: value });
                        markTouched('sms');
                      }}
                      error={showSmsError && !form.sms.dltTemplateId ? 'Select a DLT template.' : undefined}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="sms-body">Body</Label>
                      <Textarea
                        id="sms-body"
                        value={form.sms.body}
                        onChange={(event) => updateSms({ body: event.target.value })}
                        onBlur={() => markTouched('sms')}
                        rows={3}
                        placeholder="Plain text only — no rich media on SMS."
                        aria-invalid={Boolean(showSmsError && smsError)}
                      />
                      {(() => {
                        const { limit, segments } = getSmsSegmentInfo(form.sms.body.length);
                        return (
                          <div className="flex items-center justify-between gap-3">
                            {showSmsError && smsError ? (
                              <FieldError message={smsError} />
                            ) : (
                              <p className="text-xs text-gray-500">No title on SMS — this is the entire message.</p>
                            )}
                            <span className="shrink-0 text-xs text-gray-400">
                              {form.sms.body.length} / {limit} characters ({segments} SMS)
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <p className="text-xs text-gray-500">SMS is plain text only — no creative upload slot.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}

      {step === 3 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-4 text-gray-500" aria-hidden="true" />
                Trigger type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioCardGroup
                title="Trigger type"
                hideLabel
                options={triggerTypeCardOptions}
                value={form.triggerType}
                onChange={(id) => handleTriggerTypeChange(id as TriggerType)}
                columns={3}
              />

              {form.triggerType === 'one_time' && (
                <div className="mt-4 flex flex-col gap-4">
                  <RadioCardGroup
                    title="One-time timing"
                    hideLabel
                    options={oneTimeTimingCardOptions}
                    value={form.oneTimeTiming}
                    onChange={(id) => {
                      update('oneTimeTiming', id as OneTimeTiming);
                      markTouched('trigger');
                    }}
                    columns={2}
                  />

                  {form.oneTimeTiming === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="notif-date">Date</Label>
                        <Input
                          id="notif-date"
                          type="date"
                          min={today}
                          value={form.scheduledDate}
                          onChange={(event) => update('scheduledDate', event.target.value)}
                          onBlur={() => markTouched('trigger')}
                          aria-invalid={Boolean(showScheduleError && !form.scheduledDate)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notif-time">Time</Label>
                        <Input
                          id="notif-time"
                          type="time"
                          value={form.scheduledTime}
                          onChange={(event) => update('scheduledTime', event.target.value)}
                          onBlur={() => markTouched('trigger')}
                          aria-invalid={Boolean(showScheduleError && !form.scheduledTime)}
                        />
                      </div>
                    </div>
                  )}

                  {showScheduleError && <FieldError message="Set both a date and time, or switch to send immediately." />}
                </div>
              )}
            </CardContent>
          </Card>

          {form.triggerType === 'recurring' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="size-4 text-gray-500" aria-hidden="true" />
                  Recurring schedule parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  label="Frequency"
                  options={recurringFrequencySelectOptions}
                  value={form.recurringFrequency}
                  onChange={(value) => {
                    update('recurringFrequency', value as RecurringFrequency);
                    markTouched('trigger');
                  }}
                />

                {form.recurringFrequency === 'weekly' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Days of week</p>
                    <ChipToggle
                      options={weekDayOptions}
                      selectedIds={form.daysOfWeek}
                      onChange={(ids) => {
                        update('daysOfWeek', ids as WeekDay[]);
                        markTouched('trigger');
                      }}
                    />
                    {showScheduleError && form.daysOfWeek.length === 0 && <FieldError message="Select at least one day of the week." />}
                  </div>
                )}

                {form.recurringFrequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="notif-day-of-month">Day of month</Label>
                    <Input
                      id="notif-day-of-month"
                      type="number"
                      min={1}
                      max={31}
                      value={form.dayOfMonth ?? ''}
                      onChange={(event) => update('dayOfMonth', event.target.value ? Number(event.target.value) : null)}
                      onBlur={() => markTouched('trigger')}
                      placeholder="e.g. 1"
                      aria-invalid={Boolean(showScheduleError && !form.dayOfMonth)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="notif-dispatch-time">Dispatch time (IST)</Label>
                    <Input
                      id="notif-dispatch-time"
                      type="time"
                      value={form.dispatchTime}
                      onChange={(event) => update('dispatchTime', event.target.value)}
                      onBlur={() => markTouched('trigger')}
                      aria-invalid={Boolean(showScheduleError && !form.dispatchTime)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notif-active-start">Active from</Label>
                    <Input
                      id="notif-active-start"
                      type="date"
                      min={today}
                      value={form.activeStartDate}
                      onChange={(event) => update('activeStartDate', event.target.value)}
                      onBlur={() => markTouched('trigger')}
                      aria-invalid={Boolean(showScheduleError && !form.activeStartDate)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notif-active-end">Active until</Label>
                    <Input
                      id="notif-active-end"
                      type="date"
                      min={form.activeStartDate || today}
                      value={form.activeEndDate}
                      onChange={(event) => update('activeEndDate', event.target.value)}
                      onBlur={() => markTouched('trigger')}
                      aria-invalid={Boolean(showScheduleError && !form.activeEndDate)}
                    />
                  </div>
                </div>

                {showScheduleError && <FieldError message="Set dispatch time and an active date range." />}
              </CardContent>
            </Card>
          )}

          {form.triggerType === 'event' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-4 text-gray-500" aria-hidden="true" />
                  Event-based trigger parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  label="Event hook"
                  options={eventHookSelectOptions}
                  value={form.eventHook}
                  onChange={(value) => {
                    update('eventHook', value as EventHook);
                    markTouched('trigger');
                  }}
                />
                <SelectField
                  label="Relative offset"
                  options={relativeOffsetSelectOptions}
                  value={form.relativeOffset}
                  onChange={(value) => {
                    update('relativeOffset', value as RelativeOffset);
                    markTouched('trigger');
                  }}
                />

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-700">Target variable mapping</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Hook resolves against the Beat Schedule DB. These placeholders resolve automatically inside your WhatsApp template's
                    variables at send time — fill in the matching variable on the WhatsApp tab in Channel content:{' '}
                    {eventTemplatePlaceholders.join(', ')}.
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  Default delivery channel: <span className="font-medium text-gray-700">WhatsApp Business API</span> (auto-selected — finish its
                  template in Channel content).
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="size-4 text-gray-500" aria-hidden="true" />
                Review &amp; confirm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-200">
                <SummaryRow label="Category" value={form.category ? categoryLabels[form.category] : '—'} />
                <SummaryRow label="Title" value={recordCopy.title || '—'} />
                <SummaryRow label="Message" value={recordCopy.body || '—'} />
                <SummaryRow label="CTA / deep link" value={form.ctaLink || 'None'} />
                <SummaryRow label="Territory" value={geoSummary} />
                <SummaryRow label="Vendors" value={vendorSummary} />

                <div className="flex items-start justify-between gap-4 py-2.5">
                  <span className="text-sm text-gray-500">Channels</span>
                  <div className="flex max-w-[65%] flex-wrap items-center justify-end gap-2">
                    {form.channels.length === 0 ? (
                      <span className="text-sm font-medium text-gray-900">—</span>
                    ) : (
                      form.channels.map((channel) => {
                        const asset = isMediaChannel(channel) ? channelMedia[channel] : undefined;
                        return (
                          <span
                            key={channel}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1 pr-2.5 text-xs font-medium text-gray-700"
                          >
                            {asset ? (
                              <img src={asset.dataUrl} alt="" className="size-5 rounded-full object-cover" />
                            ) : (
                              <span className="flex size-5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-500">
                                {channelLabels[channel].charAt(0)}
                              </span>
                            )}
                            {channelLabels[channel]}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                <SummaryRow label="Schedule" value={triggerSummary} />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </WizardShell>
  );
}
