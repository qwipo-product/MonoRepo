import { useState, type ReactNode } from 'react';
import { AlertTriangle, CalendarPlus, Trash2 } from 'lucide-react';
import { Button, Chip, FieldError, Input, Sheet, Switch } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatDay } from '../format';
import { BEAT_DAYS, WEEK, type StoreSettings } from '../store';

const weekdayOf = (isoDate: string) => WEEK[(new Date(`${isoDate}T00:00:00`).getDay() + 6) % 7];

/* Store settings — the portal's Store Settings page on a phone: take orders
   or pause, working hours, weekly off and holidays. Pausing and resuming ask
   first, because neither undoes itself. */
export function StoreSettingsScreen({
  store,
  onChange,
  onBack,
  onToast,
}: {
  store: StoreSettings;
  onChange: (next: StoreSettings) => void;
  onBack: () => void;
  onToast: (m: string) => void;
}) {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [opensAt, setOpensAt] = useState(store.opensAt);
  const [closesAt, setClosesAt] = useState(store.closesAt);
  const [hoursError, setHoursError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const pausing = store.acceptingOrders; // what the confirm sheet will do
  const beatDays = BEAT_DAYS.filter((d) => d !== 'Sunday');
  const dayName = (d: string) => t(`seller.store.day.${d}`);
  const holidayOnBeatDay = holidayDate && BEAT_DAYS.includes(weekdayOf(holidayDate));

  const saveHours = () => {
    if (closesAt <= opensAt) {
      setHoursError(t('seller.store.hours_error'));
      return;
    }
    setHoursError('');
    onChange({ ...store, opensAt, closesAt });
    onToast(t('seller.store.hours_saved'));
  };

  const toggleOff = (d: string) =>
    onChange({ ...store, weeklyOff: store.weeklyOff.includes(d) ? store.weeklyOff.filter((x) => x !== d) : [...store.weeklyOff, d] });

  const addHoliday = () => {
    onChange({ ...store, holidays: [...store.holidays, { name: holidayName.trim(), date: holidayDate }].sort((a, b) => a.date.localeCompare(b.date)) });
    setAddOpen(false);
    setHolidayName('');
    setHolidayDate('');
    onToast(t('seller.store.holiday_added'));
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.store.title')} onBack={onBack} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {/* Taking orders */}
        <Section title={t('seller.store.status')}>
          <div className="flex items-center justify-between gap-3 p-3">
            <div>
              <div className="text-sm font-semibold">{t('seller.store.accept')}</div>
              <div className={store.acceptingOrders ? 'text-xs font-medium text-success-foreground' : 'text-xs font-medium text-warning-foreground'}>
                {t(store.acceptingOrders ? 'seller.store.accepting' : 'seller.store.paused')}
              </div>
            </div>
            <Switch checked={store.acceptingOrders} onCheckedChange={() => setConfirmOpen(true)} aria-label={t('seller.store.accept')} />
          </div>
        </Section>

        {/* Working hours */}
        <Section title={t('seller.store.hours')}>
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-2 gap-3">
              <TimeField label={t('seller.store.opens')} value={opensAt} onChange={setOpensAt} />
              <TimeField label={t('seller.store.closes')} value={closesAt} onChange={setClosesAt} />
            </div>
            <FieldError>{hoursError}</FieldError>
            <Button fullWidth variant="outlinePrimary" disabled={opensAt === store.opensAt && closesAt === store.closesAt} onClick={saveHours}>
              {t('seller.store.save_hours')}
            </Button>
          </div>
        </Section>

        {/* Weekly off */}
        <Section title={t('seller.store.weekly_off')}>
          <div className="space-y-2 p-3">
            <p className="text-xs text-foreground-secondary">{t('seller.store.weekly_off_help')}</p>
            <div className="flex flex-wrap gap-2">
              {WEEK.map((d) => {
                const locked = d === 'Sunday' || BEAT_DAYS.includes(d);
                return (
                  <Chip
                    key={d}
                    selected={store.weeklyOff.includes(d)}
                    disabled={locked}
                    onClick={() => toggleOff(d)}
                    className={locked && !store.weeklyOff.includes(d) ? 'opacity-60' : undefined}
                  >
                    {dayName(d)}
                  </Chip>
                );
              })}
            </div>
            <p className="text-xs text-foreground-secondary">{t('seller.store.sunday_locked')}</p>
            {beatDays.length > 0 && (
              <p className="text-xs text-foreground-secondary">
                {t('seller.store.beat_locked').replace('{days}', beatDays.map(dayName).join(', '))}
              </p>
            )}
          </div>
        </Section>

        {/* Holidays */}
        <Section
          title={t('seller.store.holidays').replace('{n}', String(store.holidays.length))}
          action={
            <Button size="sm" variant="ghost" className="text-primary" onClick={() => setAddOpen(true)}>
              <CalendarPlus size={16} />
              {t('seller.store.add_holiday')}
            </Button>
          }
        >
          {store.holidays.length === 0 ? (
            <p className="p-3 text-sm text-foreground-secondary">{t('seller.store.no_holidays')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {store.holidays.map((h) => (
                <li key={`${h.date}-${h.name}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{h.name}</div>
                    <div className="text-xs text-foreground-secondary">{formatDay(h.date)}</div>
                  </div>
                  <button
                    onClick={() => onChange({ ...store, holidays: store.holidays.filter((x) => x !== h) })}
                    className="flex shrink-0 items-center gap-1 text-sm font-semibold text-error-foreground"
                  >
                    <Trash2 size={14} />
                    {t('seller.detail.remove')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Pause / resume — neither undoes itself */}
      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t(pausing ? 'seller.store.pause_title' : 'seller.store.resume_title')}
        subtitle={t(pausing ? 'seller.store.pause_help' : 'seller.store.resume_help')}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)}>
              {t('seller.action.go_back')}
            </Button>
            <Button
              variant={pausing ? 'destructive' : 'primary'}
              fullWidth
              onClick={() => {
                onChange({ ...store, acceptingOrders: !store.acceptingOrders });
                setConfirmOpen(false);
                onToast(t(pausing ? 'seller.store.paused_toast' : 'seller.store.resumed_toast'));
              }}
            >
              {t(pausing ? 'seller.store.pause_yes' : 'seller.store.resume_yes')}
            </Button>
          </div>
        }
      />

      {/* Add a holiday */}
      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('seller.store.add_holiday')}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setAddOpen(false)}>
              {t('seller.action.go_back')}
            </Button>
            <Button fullWidth disabled={!holidayName.trim() || !holidayDate} onClick={addHoliday}>
              {t('seller.store.add_holiday')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t('seller.store.holiday_name')}</span>
            <Input value={holidayName} onChange={(e) => setHolidayName(e.target.value)} placeholder={t('seller.store.holiday_name_hint')} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t('seller.store.holiday_date')}</span>
            <Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
          </label>
          {holidayOnBeatDay && (
            <p className="flex items-start gap-1.5 text-xs font-medium text-warning-foreground">
              <AlertTriangle size={14} className="mt-px shrink-0" />
              {t('seller.store.holiday_beat_warning').replace('{day}', dayName(weekdayOf(holidayDate)))}
            </p>
          )}
        </div>
      </Sheet>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <span className="text-sm font-semibold">{title}</span>
        {action}
      </div>
      {children}
    </section>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-foreground-secondary">{label}</span>
      <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
