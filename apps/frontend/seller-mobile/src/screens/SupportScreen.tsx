import type { ReactNode } from 'react';
import { Clock, Mail, Phone } from 'lucide-react';
import { Button } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';
import { ScreenHeader } from '../components/ScreenHeader';

const PHONE = '+91 91212 22836';
const EMAIL = 'info@qwipo.com';

/* Support — the portal's three cards, each with a button that does the thing. */
export function SupportScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.support.title')} onBack={onBack} />
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        <p className="px-1 text-sm text-foreground-secondary">{t('seller.support.intro')}</p>
        <Card
          icon={<Phone size={20} />}
          title={t('seller.support.phone')}
          value={PHONE}
          help={t('seller.support.phone_help')}
          action={
            <Button fullWidth onClick={() => (window.location.href = `tel:${PHONE.replace(/\s/g, '')}`)}>
              <Phone size={16} />
              {t('seller.support.call')}
            </Button>
          }
        />
        <Card
          icon={<Mail size={20} />}
          title={t('seller.support.email')}
          value={EMAIL}
          help={t('seller.support.email_help')}
          action={
            <Button variant="secondary" fullWidth onClick={() => (window.location.href = `mailto:${EMAIL}`)}>
              <Mail size={16} />
              {t('seller.support.send_email')}
            </Button>
          }
        />
        <Card icon={<Clock size={20} />} title={t('seller.support.hours')} value={t('seller.support.hours_value')} />
      </div>
    </div>
  );
}

function Card({ icon, title, value, help, action }: { icon: ReactNode; title: string; value: string; help?: string; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">{icon}</span>
        <div className="min-w-0">
          <div className="text-xs text-foreground-secondary">{title}</div>
          <div className="text-base font-semibold">{value}</div>
          {help && <div className="text-xs text-foreground-secondary">{help}</div>}
        </div>
      </div>
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}
