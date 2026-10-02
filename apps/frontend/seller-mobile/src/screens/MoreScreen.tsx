import { useState, type ReactNode } from 'react';
import { ArrowLeftRight, ChevronRight, ClipboardList, Headset, Languages, LogOut, MessageCircle, Percent, Settings, Store, UserRound } from 'lucide-react';
import { Button, SelectableCard, Sheet, cn } from '@mockups/ui';
import { useI18n, type LangCode } from '@mockups/i18n';
import type { SellerAccount } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';

const LANGS: { code: LangCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
];

/* More — everything that isn't Orders, Products or Customers, as one list of
   labelled rows. Sign out asks first. */
export function MoreScreen({
  account,
  canSwitchSeller,
  onOpen,
  onSwitchSeller,
  onSignOut,
}: {
  account: SellerAccount;
  canSwitchSeller: boolean;
  onOpen: (page: 'offers' | 'store' | 'order-settings' | 'communication' | 'profile' | 'support') => void;
  onSwitchSeller: () => void;
  onSignOut: () => void;
}) {
  const { t, lang, setLang } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.more.title')} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        <section className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
            <Store size={20} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{account.name}</div>
            <div className="text-xs text-foreground-secondary">
              {account.id} · {t(`seller.role.${account.role}`)}
            </div>
          </div>
        </section>

        <ul className="divide-y divide-border rounded-lg border border-border bg-card shadow-sm">
          <Row icon={<Percent size={18} />} label={t('seller.more.offers')} onClick={() => onOpen('offers')} />
          <Row icon={<Settings size={18} />} label={t('seller.more.store')} onClick={() => onOpen('store')} />
          <Row icon={<ClipboardList size={18} />} label={t('seller.more.order_settings')} onClick={() => onOpen('order-settings')} />
          <Row icon={<MessageCircle size={18} />} label={t('seller.more.communication')} onClick={() => onOpen('communication')} />
          <Row icon={<UserRound size={18} />} label={t('seller.more.profile')} onClick={() => onOpen('profile')} />
          <Row icon={<Headset size={18} />} label={t('seller.more.support')} onClick={() => onOpen('support')} />
        </ul>

        <ul className="divide-y divide-border rounded-lg border border-border bg-card shadow-sm">
          <Row
            icon={<Languages size={18} />}
            label={t('seller.more.language')}
            value={LANGS.find((l) => l.code === lang)?.label ?? 'English'}
            onClick={() => setLangOpen(true)}
          />
          {canSwitchSeller && <Row icon={<ArrowLeftRight size={18} />} label={t('seller.more.switch_seller')} onClick={onSwitchSeller} />}
          <Row icon={<LogOut size={18} />} label={t('seller.more.sign_out')} danger onClick={() => setSignOutOpen(true)} />
        </ul>
      </div>

      <Sheet open={langOpen} onClose={() => setLangOpen(false)} title={t('seller.more.language')} subtitle={t('seller.more.language_help')}>
        <div className="space-y-2">
          {LANGS.map((l) => (
            <SelectableCard
              key={l.code}
              radio
              selected={lang === l.code}
              onClick={() => {
                setLang(l.code);
                setLangOpen(false);
              }}
              className="w-full p-3 pr-10 text-left text-sm font-medium"
            >
              {l.label}
            </SelectableCard>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title={t('seller.more.sign_out_title')}
        subtitle={t('seller.more.sign_out_help')}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setSignOutOpen(false)}>
              {t('seller.action.go_back')}
            </Button>
            <Button
              variant="destructive"
              fullWidth
              onClick={() => {
                setSignOutOpen(false);
                onSignOut();
              }}
            >
              {t('seller.more.sign_out_yes')}
            </Button>
          </div>
        }
      />
    </div>
  );
}

function Row({ icon, label, value, danger, onClick }: { icon: ReactNode; label: string; value?: string; danger?: boolean; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} className="flex min-h-14 w-full items-center gap-3 px-3 text-left active:bg-muted">
        <span className={cn('shrink-0', danger ? 'text-error-foreground' : 'text-primary')}>{icon}</span>
        <span className={cn('flex-1 text-sm font-medium', danger && 'text-error-foreground')}>{label}</span>
        {value && <span className="text-sm text-foreground-secondary">{value}</span>}
        {!danger && <ChevronRight size={16} className="shrink-0 text-foreground-secondary" />}
      </button>
    </li>
  );
}
