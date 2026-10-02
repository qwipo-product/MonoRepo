import { useState } from 'react';
import { CheckCircle2, Store, Truck } from 'lucide-react';
import { Button, Sheet } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';
import type { SellerOrder } from '@mockups/types';

const PARTNER = { LOGISTICS: 'Shiprocket', DARK_STORE: 'Moosapet Dark Store' } as const;

/* The portal's "Move to Logistics" / "Move to Dark Store" for ticked
   confirmed orders: one check, then a result list (the portal's move-result
   dialog). The sheet keeps showing the result after the orders move, until
   Done. */
export function LogisticsSheet({
  via,
  orders,
  onClose,
  onConfirm,
}: {
  via: 'LOGISTICS' | 'DARK_STORE';
  orders: SellerOrder[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const { t } = useI18n();
  const [sent, setSent] = useState<SellerOrder[] | null>(null);
  const list = sent ?? orders;
  const n = list.length;
  const partner = PARTNER[via];
  const Icon = via === 'LOGISTICS' ? Truck : Store;
  const close = () => {
    setSent(null);
    onClose();
  };

  return (
    <Sheet
      open={orders.length > 0 || sent !== null}
      onClose={close}
      icon={sent ? <CheckCircle2 size={18} /> : <Icon size={18} />}
      title={
        sent
          ? t('seller.logistics.sent_title').replace('{n}', String(n)).replace('{partner}', partner)
          : t(n === 1 ? 'seller.logistics.title_one' : 'seller.logistics.title_many').replace('{n}', String(n)).replace('{partner}', partner)
      }
      subtitle={t(sent ? 'seller.logistics.sent_help' : via === 'LOGISTICS' ? 'seller.logistics.help_3pl' : 'seller.logistics.help_dark')}
      footer={
        sent ? (
          <Button fullWidth onClick={close}>
            {t('seller.action.done')}
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={close}>
              {t('seller.action.go_back')}
            </Button>
            <Button
              fullWidth
              onClick={() => {
                setSent(orders);
                onConfirm(orders.map((o) => o.id));
              }}
            >
              {t(via === 'LOGISTICS' ? 'seller.logistics.cta_3pl' : 'seller.logistics.cta_dark').replace('{n}', String(n))}
            </Button>
          </div>
        )
      }
    >
      <ul className="divide-y divide-border rounded-lg border border-border">
        {list.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium">{o.buyer.storeName}</div>
              <div className="text-xs text-foreground-secondary">
                {o.id} · {o.beatName ?? t('seller.orders.quick_delivery')}
              </div>
            </div>
            {sent && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-success-foreground">
                <CheckCircle2 size={14} />
                {t('seller.logistics.sent')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
