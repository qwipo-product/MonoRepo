import { Clock } from 'lucide-react';
import { Button, EmptyState } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';

/* The phone stays signed in for days; when the session finally ends, this
   is the one clean way back — the portal's Session Expired page. */
export function SessionExpiredScreen({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid h-full place-items-center bg-background-subtle p-6">
      <EmptyState
        icon={<Clock strokeWidth={1.75} />}
        title={t('seller.session.title')}
        description={t('seller.session.help')}
        action={<Button onClick={onSignIn}>{t('seller.session.sign_in')}</Button>}
      />
    </div>
  );
}
