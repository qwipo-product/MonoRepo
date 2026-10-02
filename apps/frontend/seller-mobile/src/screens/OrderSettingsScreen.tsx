import { useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, FieldError, InlineMessage, Input, Sheet, Switch } from '@mockups/ui';
import { Field, SelectField, controlClass } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import { ScreenHeader } from '../components/ScreenHeader';
import { CANCELLATION_WINDOWS, PROCESSING_TIMES, RETURN_WINDOWS, type StoreSettings } from '../store';

/* Order settings — the portal's Order Settings page on a phone: the order
   value a store must reach (and the non-beat minimum, where 0 switches off
   Tomorrow Delivery), how long orders take, and returns. Turning returns on
   or off asks first, as on the portal. */
export function OrderSettingsScreen({
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
  const [min, setMin] = useState(String(store.minOrderValue));
  const [max, setMax] = useState(String(store.maxOrderValue));
  const [mov, setMov] = useState(String(store.nonBeatMov));
  const [processing, setProcessing] = useState(store.processingTime);
  const [cancelWindow, setCancelWindow] = useState(store.cancellationWindow);
  const [errors, setErrors] = useState<{ min?: string; max?: string; mov?: string }>({});
  const [returnsSheet, setReturnsSheet] = useState(false);
  const [returnWindow, setReturnWindow] = useState(store.returnWindow);

  const num = (v: string) => (v.trim() === '' ? NaN : Number(v));
  const movOff = num(mov) === 0;

  const save = () => {
    const e: typeof errors = {};
    if (!(num(min) >= 0)) e.min = t('seller.orderset.err_number');
    if (!(num(max) >= 0)) e.max = t('seller.orderset.err_number');
    else if (num(max) <= num(min)) e.max = t('seller.orderset.err_max');
    if (!(num(mov) >= 0)) e.mov = t('seller.orderset.err_number');
    setErrors(e);
    if (Object.keys(e).length) return;
    onChange({ ...store, minOrderValue: num(min), maxOrderValue: num(max), nonBeatMov: num(mov), processingTime: processing, cancellationWindow: cancelWindow });
    onToast(t('seller.orderset.saved'));
  };

  const confirmReturns = () => {
    const turningOn = !store.allowReturns;
    onChange({ ...store, allowReturns: turningOn, returnWindow: turningOn ? returnWindow : store.returnWindow });
    setReturnsSheet(false);
    onToast(turningOn ? t('seller.orderset.returns_on_toast').replace('{window}', returnWindow) : t('seller.orderset.returns_off_toast'));
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.orderset.title')} onBack={onBack} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        <Card title={t('seller.orderset.value')} help={t('seller.orderset.value_help')}>
          <Rupee label={t('seller.orderset.min')} value={min} onChange={setMin} error={errors.min} />
          <Rupee label={t('seller.orderset.max')} value={max} onChange={setMax} error={errors.max} />
          <Rupee label={t('seller.orderset.mov')} value={mov} onChange={setMov} error={errors.mov} hint={t('seller.orderset.mov_hint')} />
          {movOff && <InlineMessage variant="warning" title={t('seller.orderset.mov_off')} description={t('seller.orderset.mov_off_help')} />}
        </Card>

        <Card title={t('seller.orderset.processing')}>
          <SelectField label={t('seller.orderset.processing_time')} placeholder={t('seller.orderset.pick')} value={processing} options={PROCESSING_TIMES} onChange={setProcessing} />
          <SelectField label={t('seller.orderset.cancel_window')} placeholder={t('seller.orderset.pick')} value={cancelWindow} options={CANCELLATION_WINDOWS} onChange={setCancelWindow} />
        </Card>

        <Card title={t('seller.orderset.returns')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{t('seller.orderset.allow_returns')}</div>
              <div className="text-xs text-foreground-secondary">
                {store.allowReturns
                  ? t('seller.orderset.returns_on').replace('{window}', store.returnWindow)
                  : t('seller.orderset.returns_off')}
              </div>
            </div>
            <Switch checked={store.allowReturns} onCheckedChange={() => setReturnsSheet(true)} aria-label={t('seller.orderset.allow_returns')} />
          </div>
          <Field label={t('seller.orderset.return_type')}>
            <div className={`${controlClass} bg-input text-foreground-secondary`}>{store.returnType}</div>
          </Field>
        </Card>
      </div>

      <div className="border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
        <Button fullWidth onClick={save}>
          {t('seller.orderset.save')}
        </Button>
      </div>

      <Sheet
        open={returnsSheet}
        onClose={() => setReturnsSheet(false)}
        icon={<RotateCcw size={18} />}
        title={store.allowReturns ? t('seller.orderset.returns_off_title') : t('seller.orderset.returns_on_title')}
        subtitle={store.allowReturns ? t('seller.orderset.returns_off_help') : t('seller.orderset.returns_on_help')}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setReturnsSheet(false)}>
              {t('seller.action.go_back')}
            </Button>
            <Button variant={store.allowReturns ? 'destructive' : 'primary'} fullWidth onClick={confirmReturns}>
              {store.allowReturns ? t('seller.orderset.returns_off_yes') : t('seller.orderset.returns_on_yes')}
            </Button>
          </div>
        }
      >
        {!store.allowReturns && (
          <SelectField label={t('seller.orderset.return_window')} placeholder={t('seller.orderset.pick')} value={returnWindow} options={RETURN_WINDOWS} onChange={setReturnWindow} />
        )}
      </Sheet>
    </div>
  );
}

function Card({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-3 py-2.5">
        <div className="text-sm font-semibold">{title}</div>
        {help && <div className="text-xs text-foreground-secondary">{help}</div>}
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}

function Rupee({ label, value, onChange, error, hint }: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string }) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-secondary">₹</span>
        <Input
          value={value}
          inputMode="numeric"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          aria-invalid={!!error || undefined}
          className={error ? 'border-error pl-7 tabular-nums' : 'pl-7 tabular-nums'}
        />
      </div>
      {hint && !error && <p className="text-xs text-foreground-secondary">{hint}</p>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
