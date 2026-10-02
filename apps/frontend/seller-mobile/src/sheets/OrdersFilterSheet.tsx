import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button, Chip, Sheet } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';
import { NO_FILTERS, filterCount, type OrderFilters } from '../orders';

/* Every order filter in one bottom sheet — order type, who cancelled, and
   company — instead of extra rows above the list. The delivery-day chips
   stay on the page because they are the daily one-tap filter. */
export function OrdersFilterSheet({
  open,
  filters,
  companies,
  showCancelledBy,
  onChange,
  onClose,
}: {
  open: boolean;
  filters: OrderFilters;
  companies: string[];
  showCancelledBy: boolean;
  onChange: (next: OrderFilters) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const set = (patch: Partial<OrderFilters>) => onChange({ ...filters, ...patch });
  const toggleCompany = (c: string) =>
    set({ companies: filters.companies.includes(c) ? filters.companies.filter((x) => x !== c) : [...filters.companies, c] });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<SlidersHorizontal size={18} />}
      title={t('seller.ofilter.title')}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth disabled={filterCount(filters) === 0} onClick={() => onChange(NO_FILTERS)}>
            {t('seller.ofilter.clear')}
          </Button>
          <Button fullWidth onClick={onClose}>
            {t('seller.ofilter.show')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Group label={t('seller.ofilter.type')}>
          {(['all', 'beat', 'nonbeat'] as const).map((v) => (
            <Chip key={v} selected={filters.type === v} onClick={() => set({ type: v })}>
              {t(`seller.ofilter.type.${v}`)}
            </Chip>
          ))}
        </Group>
        {showCancelledBy && (
          <Group label={t('seller.ofilter.cancelled_by')}>
            {(['all', 'CUSTOMER', 'SELLER'] as const).map((v) => (
              <Chip key={v} selected={filters.cancelledBy === v} onClick={() => set({ cancelledBy: v })}>
                {t(`seller.ofilter.cancelled_by.${v}`)}
              </Chip>
            ))}
          </Group>
        )}
        <Group label={t('seller.ofilter.company')}>
          <Chip selected={filters.companies.length === 0} onClick={() => set({ companies: [] })}>
            {t('seller.ofilter.all_companies')}
          </Chip>
          {companies.map((c) => (
            <Chip key={c} selected={filters.companies.includes(c)} onClick={() => toggleCompany(c)}>
              {c}
            </Chip>
          ))}
        </Group>
      </div>
    </Sheet>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
