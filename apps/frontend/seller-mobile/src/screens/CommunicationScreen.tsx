import { useState } from 'react';
import { CheckCircle2, MessageCircle, Unplug } from 'lucide-react';
import { Badge, Button, FieldError, Input, Sheet, Switch } from '@mockups/ui';
import { Field } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import { ScreenHeader } from '../components/ScreenHeader';
import type { StoreSettings } from '../store';

const DEMO_CODE = '123456';

/* WhatsApp & notifications — the portal's Communication Settings. Connect a
   WhatsApp number with a 6-digit code (it arrives on this same phone), then
   choose which messages to get. Disconnecting asks first. */
export function CommunicationScreen({
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
  const [number, setNumber] = useState(store.whatsappNumber);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const sendCode = () => {
    if (!/^[6-9]\d{9}$/.test(number)) {
      setError(t('seller.comm.err_number'));
      return;
    }
    setError('');
    setCodeSent(true);
    onToast(t('seller.comm.code_sent').replace('{number}', number));
  };

  const verify = () => {
    if (code !== DEMO_CODE) {
      setError(t('seller.comm.err_code'));
      return;
    }
    setError('');
    setCodeSent(false);
    setCode('');
    onChange({ ...store, whatsappNumber: number, whatsappConnected: true });
    onToast(t('seller.comm.connected_toast'));
  };

  const disconnect = () => {
    setDisconnectOpen(false);
    setNumber('');
    onChange({ ...store, whatsappNumber: '', whatsappConnected: false });
    onToast(t('seller.comm.disconnected_toast'));
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.comm.title')} onBack={onBack} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle size={16} className="text-primary" />
              {t('seller.comm.whatsapp')}
            </span>
            {store.whatsappConnected && <Badge variant="success">{t('seller.comm.connected')}</Badge>}
          </div>

          {store.whatsappConnected ? (
            <div className="space-y-3 p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={18} className="text-success-foreground" />
                <span>
                  {t('seller.comm.connected_to')} <span className="font-semibold">+91 {store.whatsappNumber}</span>
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setDisconnectOpen(true)}>
                <Unplug size={15} />
                {t('seller.comm.disconnect')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-3">
              <p className="text-xs text-foreground-secondary">{t('seller.comm.help')}</p>
              <Field label={t('seller.comm.number')}>
                <div className="flex gap-2">
                  <Input
                    value={number}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder={t('seller.comm.number_placeholder')}
                    disabled={codeSent}
                    onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 tabular-nums"
                  />
                  {!codeSent && (
                    <Button variant="outlinePrimary" onClick={sendCode}>
                      {t('seller.comm.send_code')}
                    </Button>
                  )}
                </div>
              </Field>
              {codeSent && (
                <Field label={t('seller.comm.code')}>
                  <div className="flex gap-2">
                    <Input
                      value={code}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 tabular-nums tracking-widest"
                    />
                    <Button disabled={code.length !== 6} onClick={verify}>
                      {t('seller.comm.verify')}
                    </Button>
                  </div>
                  <button
                    className="text-xs font-semibold text-primary"
                    onClick={() => {
                      setCodeSent(false);
                      setCode('');
                    }}
                  >
                    {t('seller.comm.change_number')}
                  </button>
                </Field>
              )}
              <FieldError>{error}</FieldError>
              {codeSent && <p className="text-xs text-foreground-secondary">{t('seller.comm.demo')}</p>}
            </div>
          )}
        </section>

        {store.whatsappConnected && (
          <section className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border px-3 py-2.5 text-sm font-semibold">{t('seller.comm.prefs')}</div>
            <div className="flex items-start justify-between gap-3 p-3">
              <div>
                <div className="text-sm font-medium">{t('seller.comm.new_order')}</div>
                <div className="text-xs text-foreground-secondary">{t('seller.comm.new_order_help')}</div>
              </div>
              <Switch
                checked={store.notifyNewOrder}
                onCheckedChange={(v) => {
                  onChange({ ...store, notifyNewOrder: v });
                  onToast(t(v ? 'seller.comm.notify_on' : 'seller.comm.notify_off'));
                }}
                aria-label={t('seller.comm.new_order')}
              />
            </div>
          </section>
        )}
      </div>

      <Sheet
        open={disconnectOpen}
        onClose={() => setDisconnectOpen(false)}
        icon={<Unplug size={18} />}
        iconClassName="bg-error-subtle text-error-foreground"
        title={t('seller.comm.disconnect_title')}
        subtitle={t('seller.comm.disconnect_help')}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDisconnectOpen(false)}>
              {t('seller.action.go_back')}
            </Button>
            <Button variant="destructive" fullWidth onClick={disconnect}>
              {t('seller.comm.disconnect_yes')}
            </Button>
          </div>
        }
      />
    </div>
  );
}
