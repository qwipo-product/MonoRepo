import { useState } from 'react';
import { BadgePercent, MessageCircle, Phone } from 'lucide-react';
import { Badge, Button, InlineMessage, QtyStepper, Sheet, cn } from '@mockups/ui';
import { StatusBadge, formatInrExact } from '@mockups/components';
import { sellerCustomers } from '@mockups/mock-data';
import { useI18n } from '@mockups/i18n';
import type { SellerOrder, SellerOrderLine } from '@mockups/types';
import { DeliveryPanel } from '../components/DeliveryPanel';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProductThumb } from '../components/ProductThumb';
import { formatPlacedAt } from '../format';
import { cancelReasonText, liveLines, offerSavings, orderTotal, tabOf } from '../orders';
import type { OrderAction } from './OrdersScreen';


/* One order. On a new order the seller can change a quantity or remove an
   item before confirming — the portal's "Save changes" step. The next step
   is always the one big button at the bottom. */
export function OrderDetailScreen({
  order,
  onBack,
  onAction,
  onSaveAndConfirm,
}: {
  order: SellerOrder;
  onBack: () => void;
  onAction: (action: OrderAction, order: SellerOrder) => void;
  onSaveAndConfirm: (lines: SellerOrderLine[]) => void;
}) {
  const { t } = useI18n();
  const tab = tabOf(order);
  const editable = tab === 'new';
  const [lines, setLines] = useState(order.lines);
  const [reviewing, setReviewing] = useState(false);

  const draft: SellerOrder = { ...order, lines };
  const changes = lines.filter((l, i) => l.qty !== order.lines[i].qty || l.status !== order.lines[i].status);
  const stillUnavailable = lines.filter((l) => l.status === 'OUT_OF_STOCK').length;
  const nothingLeft = liveLines(draft).length === 0;
  const setLine = (id: string, patch: Partial<SellerOrderLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const original = (id: string) => order.lines.find((l) => l.id === id)!;

  const confirm = () => (changes.length > 0 ? setReviewing(true) : onAction('confirm', order));
  const gstn = sellerCustomers.find((c) => c.mobile === order.buyer.mobile)?.gstn;
  const statusLabel = t(order.cancelledBy ? `seller.status.cancelled_by.${order.cancelledBy}` : `seller.status.${order.status}`);
  const savings = offerSavings(draft);

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={order.id} onBack={onBack} right={<StatusBadge status={order.status} label={statusLabel} />} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {order.status === 'CANCELLED' && (
          <InlineMessage
            variant="error"
            title={t(order.cancelledBy === 'CUSTOMER' ? 'seller.detail.cancelled_by_store_on' : 'seller.detail.cancelled_by_you_on').replace(
              '{when}',
              order.cancelledAt ? formatPlacedAt(order.cancelledAt) : '—'
            )}
            description={cancelReasonText(order, t)}
          />
        )}
        {editable && stillUnavailable > 0 && (
          <InlineMessage variant="warning" title={t('seller.detail.unavailable_title')} description={t('seller.detail.unavailable_help')} />
        )}

        {/* Customer and where the goods go */}
        <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div>
            <div className="text-base font-bold leading-snug">{order.buyer.storeName}</div>
            <div className="mt-0.5 text-xs text-foreground-secondary">
              {order.buyer.ownerName} · {order.buyer.mobile}
            </div>
          </div>
          <DeliveryPanel order={order} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => (window.location.href = `tel:${order.buyer.mobile}`)}>
              <Phone size={15} />
              {t('seller.detail.call')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.open(`https://wa.me/91${order.buyer.mobile}`, '_blank')}>
              <MessageCircle size={15} />
              WhatsApp
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-x-2 gap-y-3 rounded-lg border border-border bg-card p-3 text-xs shadow-sm">
          <Fact label={t('seller.detail.company')} value={order.company} />
          <Fact label={t('seller.detail.marketplace')} value={order.marketplace} />
          <Fact label={t('seller.detail.placed')} value={formatPlacedAt(order.placedAt)} />
          <Fact label={t('seller.detail.payment')} value={t(`seller.payment.${order.paymentMode}`)} />
          <Fact label={t('seller.detail.gst')} value={gstn ?? t('seller.detail.gst_none')} />
        </section>

        {/* Items */}
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-3 py-2.5 text-sm font-semibold">
            {t('seller.detail.items').replace('{n}', String(liveLines(draft).length))}
          </div>
          <ul className="divide-y divide-border">
            {lines.map((l) => {
              const removed = l.status === 'CANCELLED';
              const unavailable = l.status === 'OUT_OF_STOCK';
              return (
                <li key={l.id} className={cn('flex gap-3 p-3', removed && 'opacity-60')}>
                  <ProductThumb productId={l.productId} alt={l.name} />
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-sm font-medium leading-snug', removed && 'line-through')}>{l.name}</div>
                    <div className="text-xs text-foreground-secondary">
                      {l.pack} · {l.skuCode}
                    </div>
                    <div className="text-xs text-foreground-secondary">
                      {l.basePrice && <span className="mr-1 line-through tabular-nums">{formatInrExact(l.basePrice)}</span>}
                      <span className="tabular-nums">{formatInrExact(l.price)}</span> {t('seller.detail.each')}
                    </div>
                    {l.basePrice && !removed && (
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-success-foreground">
                        <BadgePercent size={13} className="shrink-0" />
                        {t('seller.detail.offer_line')
                          .replace('{pct}', String(Math.round((1 - l.price / l.basePrice) * 100)))
                          .replace('{saved}', formatInrExact((l.basePrice - l.price) * l.qty))
                          .replace('{code}', l.offerCode ?? '')}
                      </div>
                    )}
                    {unavailable && !editable && (
                      <Badge variant="warning" className="mt-1">
                        {t('seller.detail.not_available')}
                      </Badge>
                    )}

                    {editable && !removed && !unavailable && (
                      <div className="mt-2 flex items-center justify-between">
                        <QtyStepper value={l.qty} min={1} onChange={(qty) => setLine(l.id, { qty })} />
                        <button className="text-sm font-semibold text-error-foreground" onClick={() => setLine(l.id, { status: 'CANCELLED' })}>
                          {t('seller.detail.remove')}
                        </button>
                      </div>
                    )}
                    {/* Same row shape as an available item: the badge where the
                        stepper would be, Remove in the same place. */}
                    {editable && unavailable && (
                      <div className="mt-2 flex h-9 items-center justify-between">
                        <Badge variant="warning">{t('seller.detail.not_available')}</Badge>
                        <button className="text-sm font-semibold text-error-foreground" onClick={() => setLine(l.id, { status: 'CANCELLED' })}>
                          {t('seller.detail.remove')}
                        </button>
                      </div>
                    )}
                    {editable && removed && (
                      <button
                        className="mt-1 text-sm font-semibold text-primary"
                        onClick={() => setLine(l.id, { status: original(l.id).status })}
                      >
                        {t('seller.detail.undo')}
                      </button>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    {!editable && <div className="text-xs text-foreground-secondary">× {l.qty}</div>}
                    <div className={cn('font-semibold tabular-nums', removed && 'line-through')}>{formatInrExact(l.qty * l.price)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          {savings > 0 && (
            <div className="flex items-center justify-between border-t border-border px-3 pt-3 text-sm text-success-foreground">
              <span>{t('seller.detail.offer_savings')}</span>
              <span className="font-semibold tabular-nums">−{formatInrExact(savings)}</span>
            </div>
          )}
          <div className={cn('flex items-center justify-between px-3 py-3', savings > 0 ? 'pt-1' : 'border-t border-border')}>
            <span className="text-sm font-semibold">{t('seller.orders.order_value')}</span>
            <span className="text-base font-bold tabular-nums">{formatInrExact(orderTotal(draft))}</span>
          </div>
        </section>
      </div>

      {/* The next step */}
      {(tab === 'new' || tab === 'confirmed') && (
        <div className="flex gap-3 border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
          <Button variant="secondary" className="flex-1" onClick={() => onAction('cancel', order)}>
            {t('seller.action.cancel')}
          </Button>
          {tab === 'new' ? (
            <Button className="flex-[2]" disabled={stillUnavailable > 0 || nothingLeft} onClick={confirm}>
              {changes.length > 0 ? t('seller.detail.save_confirm') : t('seller.action.confirm_order')}
            </Button>
          ) : (
            <Button className="flex-[2]" onClick={() => onAction('deliver', order)}>
              {t('seller.action.deliver')}
            </Button>
          )}
        </div>
      )}

      {/* What changed, before it goes to the store — the portal's Save Changes. */}
      <Sheet
        open={reviewing}
        onClose={() => setReviewing(false)}
        title={t('seller.detail.changes_title')}
        subtitle={t('seller.detail.changes_help')}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setReviewing(false)}>
              {t('seller.action.go_back')}
            </Button>
            <Button
              fullWidth
              onClick={() => {
                setReviewing(false);
                onSaveAndConfirm(lines);
              }}
            >
              {t('seller.detail.save_confirm')}
            </Button>
          </div>
        }
      >
        <ul className="divide-y divide-border rounded-lg border border-border">
          {changes.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span className="min-w-0 truncate">{l.name}</span>
              <span className="shrink-0 font-medium">
                {l.status === 'CANCELLED' ? (
                  <span className="text-error-foreground">{t('seller.detail.removed')}</span>
                ) : (
                  `${original(l.id).qty} → ${l.qty}`
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-foreground-secondary">{t('seller.detail.new_value')}</span>
          <span className="font-semibold tabular-nums">
            {formatInrExact(orderTotal(order))} → {formatInrExact(orderTotal(draft))}
          </span>
        </div>
      </Sheet>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-foreground-secondary">{label}</div>
      <div className="mt-0.5 font-semibold text-foreground">{value}</div>
    </div>
  );
}
