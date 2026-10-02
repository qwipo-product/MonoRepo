import { ChevronRight, Store, UserX } from 'lucide-react';
import { Button, Chip, EmptyState } from '@mockups/ui';
import { OtpVerify, PhoneLogin } from '@mockups/components';
import { useI18n, type LangCode } from '@mockups/i18n';
import type { SellerAccount } from '@mockups/types';

/* Sign in — the buyer app's login and OTP screens (shared), with the seller
   portal's words: "Send OTP", 6-digit OTP, "Verify & Sign In". */

export const DEMO_PHONE = '9900000002';
/** A login with no seller assigned — App routes it to NoSellerScreen. */
export const NO_SELLER_PHONE = '9000000000';

/** English / Telugu, on the login page — the first thing a new user sees. */
export function LanguageChips() {
  const { lang, setLang } = useI18n();
  const options: { code: LangCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'te', label: 'తెలుగు' },
  ];
  return (
    <div className="flex justify-center gap-2">
      {options.map((o) => (
        <Chip key={o.code} selected={lang === o.code} onClick={() => setLang(o.code)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

export function SellerLogin({ onNext }: { onNext: (phone: string) => void }) {
  const { t } = useI18n();
  return (
    <PhoneLogin
      onNext={onNext}
      initialPhone={DEMO_PHONE}
      labels={{
        title: t('seller.login.title'),
        subtitle: t('seller.login.subtitle'),
        placeholder: t('seller.login.placeholder'),
        invalid: t('seller.login.invalid'),
        submit: t('seller.login.submit'),
      }}
      footer={
        <div className="space-y-3">
          <LanguageChips />
          <p className="text-center text-xs text-foreground-secondary">
            {t('seller.login.demo')}
            <br />
            {t('seller.login.demo_no_seller').replace('{number}', NO_SELLER_PHONE)}
          </p>
        </div>
      }
    />
  );
}

export function SellerOtp({ onBack, onVerify }: { onBack: () => void; onVerify: () => void }) {
  const { t } = useI18n();
  return (
    <OtpVerify
      onBack={onBack}
      onVerify={onVerify}
      labels={{
        title: t('seller.otp.title'),
        subtitle: t('seller.otp.subtitle'),
        incorrect: t('seller.otp.incorrect'),
        submit: t('seller.otp.submit'),
        resendIn: t('seller.otp.resend_in'),
        resend: t('seller.otp.resend'),
      }}
    />
  );
}

/* More than one seller on this login → pick one. The portal lists bare
   seller IDs; here the business name leads so nobody has to know an ID. */
export function SelectSeller({
  accounts,
  onPick,
  onSignOut,
}: {
  accounts: SellerAccount[];
  onPick: (a: SellerAccount) => void;
  onSignOut: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col bg-background-subtle">
      <div className="border-b border-border bg-card px-4 py-5">
        <h1 className="text-xl font-semibold">{t('seller.pick.title')}</h1>
        <p className="mt-1 text-sm text-foreground-secondary">{t('seller.pick.subtitle')}</p>
      </div>
      <div className="flex-1 space-y-3 p-3">
        {accounts.map((a) => (
          <button
            key={a.id}
            onClick={() => onPick(a)}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm active:scale-[0.99]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
              <Store size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{a.name}</span>
              <span className="block text-xs text-foreground-secondary">
                {a.id} · {t(`seller.role.${a.role}`)}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-foreground-secondary" />
          </button>
        ))}
      </div>
      <p className="p-4 text-center text-sm text-foreground-secondary">
        {t('seller.pick.wrong')}{' '}
        <button onClick={onSignOut} className="font-semibold text-primary">
          {t('seller.pick.sign_out')}
        </button>
      </p>
    </div>
  );
}

/* Signed in, but no seller has added this number yet — the portal's
   "No seller assigned". Nothing to do here but sign out. */
export function NoSellerScreen({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid h-full place-items-center bg-background-subtle p-6">
      <EmptyState
        icon={<UserX strokeWidth={1.75} />}
        title={t('seller.pick.none_title')}
        description={t('seller.pick.none_help')}
        action={
          <Button variant="secondary" onClick={onSignOut}>
            {t('seller.pick.sign_out')}
          </Button>
        }
      />
    </div>
  );
}
