import { Button, Chip, Sheet } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';

export type CustomerStatusFilter = 'all' | 'active' | 'blocked';

/* The one filter panel for Customers — status and company together, like the
   portal's Filters drawer. Changes apply as you tap; Clear resets both. */
export function CustomersFilterSheet({
  open,
  onClose,
  status,
  onStatus,
  companies,
  picked,
  onPicked,
}: {
  open: boolean;
  onClose: () => void;
  status: CustomerStatusFilter;
  onStatus: (s: CustomerStatusFilter) => void;
  companies: string[];
  picked: string[];
  onPicked: (names: string[]) => void;
}) {
  const { t } = useI18n();
  const toggle = (name: string) => onPicked(picked.includes(name) ? picked.filter((n) => n !== name) : [...picked, name]);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('seller.customers.filter_title')}
      footer={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              onStatus('all');
              onPicked([]);
            }}
          >
            {t('seller.customers.filter_clear')}
          </Button>
          <Button fullWidth onClick={onClose}>
            {t('seller.customers.filter_done')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-semibold">{t('seller.customers.filter_status')}</div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'blocked'] as const).map((s) => (
              <Chip key={s} selected={status === s} onClick={() => onStatus(s)}>
                {t(`seller.customers.status.${s}`)}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-foreground-secondary">{t('seller.customers.filter_blocked_help')}</p>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold">{t('seller.customers.filter_company')}</div>
          <div className="flex flex-wrap gap-2">
            {companies.map((name) => (
              <Chip key={name} selected={picked.includes(name)} onClick={() => toggle(name)}>
                {name}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
