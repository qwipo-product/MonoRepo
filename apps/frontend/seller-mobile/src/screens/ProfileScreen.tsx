import type { ReactNode } from 'react';
import { useI18n } from '@mockups/i18n';
import type { SellerAccount } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';

/* Profile — read-only, as in the portal. Changes go through Qwipo support. */
export function ProfileScreen({ account, onBack }: { account: SellerAccount; onBack: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.profile.title')} onBack={onBack} />
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        <Section title={t('seller.profile.business')}>
          <Fact label={t('seller.profile.company')} value={account.name} />
          <Fact label={t('seller.profile.gst')} value={account.gstId} />
          <Fact label={t('seller.profile.address')} value={account.address} />
          <Fact label={t('seller.profile.seller_id')} value={account.id} />
        </Section>
        <Section title={t('seller.profile.contact')}>
          <Fact label={t('seller.profile.contact_name')} value={account.contactName} />
          <Fact label={t('seller.profile.phone')} value={account.phone} />
        </Section>
        <p className="px-1 text-xs text-foreground-secondary">{t('seller.profile.change_help')}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-3 py-2.5 text-sm font-semibold">{title}</div>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <dt className="text-xs text-foreground-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
