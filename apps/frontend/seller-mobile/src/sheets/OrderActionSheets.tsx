import { useState } from 'react';
import { CheckCircle2, Truck, XCircle } from 'lucide-react';
import { Button, InlineMessage, SelectableCard, Sheet } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerOrder } from '@mockups/types';
import { CANCEL_REASONS, orderTotal, tabOf, unavailableLines } from '../orders';

/* Confirm / cancel / deliver — one sheet each, for one order or many. The
   order detail page passes one order; the bulk bar on the list passes the
   ticked ones. Same words and steps as the portal's dialogs. */

function OrderRows({ orders }: { orders: SellerOrder[] }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {orders.map((o) => (
        <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{o.buyer.storeName}</div>
            <div className="text-xs text-foreground-secondary">{o.id}</div>
          </div>
          <span className="shrink-0 font-semibold tabular-nums">{formatInrExact(orderTotal(o))}</span>
        </li>
      ))}
    </ul>
  );
}

export function ConfirmSheet({
  orders,
  onClose,
  onConfirm,
}: {
  orders: SellerOrder[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const { t } = useI18n();
  // An order with an item not available needs a look first — bulk confirm
  // leaves it out rather than confirming goods the seller can't send.
  const ready = orders.filter((o) => unavailableLines(o).length === 0);
  const needsCheck = orders.filter((o) => unavailableLines(o).length > 0);
  const n = ready.length;

  return (
    <Sheet
      open={orders.length > 0}
      onClose={onClose}
      icon={<CheckCircle2 size={18} />}
      title={n === 1 ? t('seller.confirm.title_one') : t('seller.confirm.title_many').replace('{n}', String(n))}
      subtitle={t('seller.confirm.help')}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            {t('seller.action.go_back')}
          </Button>
          <Button fullWidth disabled={n === 0} onClick={() => onConfirm(ready.map((o) => o.id))}>
            {n > 1 ? t('seller.confirm.cta_many').replace('{n}', String(n)) : t('seller.confirm.cta_one')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {n > 0 && <OrderRows orders={ready} />}
        {needsCheck.length > 0 && (
          <InlineMessage
            variant="warning"
            title={t('seller.confirm.skipped').replace('{n}', String(needsCheck.length))}
            description={needsCheck.map((o) => o.buyer.storeName).join(', ')}
          />
        )}
      </div>
    </Sheet>
  );
}

export function CancelSheet({
  orders,
  onClose,
  onCancel,
}: {
  orders: SellerOrder[];
  onClose: () => void;
  onCancel: (ids: string[], reason: string) => void;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState<string | null>(null);
  const afterPickup = orders.some((o) => tabOf(o) === 'confirmed');
  const reasons = afterPickup ? CANCEL_REASONS.afterPickup : CANCEL_REASONS.beforePickup;
  const n = orders.length;
  const close = () => {
    setReason(null);
    onClose();
  };

  return (
    <Sheet
      open={n > 0}
      onClose={close}
      icon={<XCircle size={18} />}
      iconClassName="bg-error-subtle text-error-foreground"
      title={n === 1 ? t('seller.cancel.title_one') : t('seller.cancel.title_many').replace('{n}', String(n))}
      subtitle={t('seller.cancel.pick_reason')}
      size="tall"
      footer={
        <div className="space-y-2">
          <p className="text-center text-xs text-foreground-secondary">{t('seller.cancel.warning')}</p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={close}>
              {t('seller.action.go_back')}
            </Button>
            <Button
              variant="destructive"
              fullWidth
              disabled={!reason}
              onClick={() => {
                onCancel(orders.map((o) => o.id), reason!);
                setReason(null);
              }}
            >
              {n > 1 ? t('seller.cancel.cta_many').replace('{n}', String(n)) : t('seller.cancel.cta_one')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        {reasons.map((r) => (
          <SelectableCard key={r} radio selected={reason === r} onClick={() => setReason(r)} className="w-full p-3 pr-10 text-left text-sm">
            {r}
          </SelectableCard>
        ))}
      </div>
    </Sheet>
  );
}

export function DeliverSheet({
  orders,
  onClose,
  onDeliver,
}: {
  orders: SellerOrder[];
  onClose: () => void;
  onDeliver: (ids: string[]) => void;
}) {
  const { t } = useI18n();
  const n = orders.length;
  return (
    <Sheet
      open={n > 0}
      onClose={onClose}
      icon={<Truck size={18} />}
      title={n === 1 ? t('seller.deliver.title_one') : t('seller.deliver.title_many').replace('{n}', String(n))}
      subtitle={t('seller.deliver.help')}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            {t('seller.action.go_back')}
          </Button>
          <Button fullWidth onClick={() => onDeliver(orders.map((o) => o.id))}>
            {n > 1 ? t('seller.deliver.cta_many').replace('{n}', String(n)) : t('seller.deliver.cta_one')}
          </Button>
        </div>
      }
    >
      <OrderRows orders={orders} />
    </Sheet>
  );
}
