import { useState } from 'react';
import { BadgePercent, Check, Copy, MapPin, MessageCircle, Phone, Share2 } from 'lucide-react';
import { Badge, Button, InlineMessage } from '@mockups/ui';
import { StatusBadge, formatInrExact } from '@mockups/components';
import { sellerCustomers } from '@mockups/mock-data';
import { useI18n } from '@mockups/i18n';
import type { SellerAccount, SellerOrder } from '@mockups/types';
import { DeliveryPanel, LogisticsBlock } from '../components/DeliveryPanel';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProductThumb } from '../components/ProductThumb';
import { formatPlacedAt } from '../format';
import { cancelReasonText, liveLines, mapsLink, offerSavings, orderTotal, tabOf } from '../orders';
import type { OrderAction } from './OrdersScreen';
import { orderShareText, shareToWhatsApp } from '../share';

/* One order, read-only like the portal's order page: the store and where the
   goods go, the order facts, the items with any offer savings. The next step
   sits at the bottom — Confirm on a new order, Mark as delivered on a
   confirmed one. Once a logistics partner or dark store has the order, they
   move it on, so Cancel and Mark as delivered go away. */
export function OrderDetailScreen({
  order,
  account,
  onBack,
  onAction,
}: {
  order: SellerOrder;
  account: SellerAccount;
  onBack: () => void;
  onAction: (action: OrderAction, order: SellerOrder) => void;
}) {
  const { t } = useI18n();
  const tab = tabOf(order);
  const gstn = order.buyer.gstn ?? sellerCustomers.find((c) => c.mobile === order.buyer.mobile)?.gstn;
  const statusLabel = t(order.cancelledBy ? `seller.status.cancelled_by.${order.cancelledBy}` : `seller.status.${order.status}`);
  const savings = offerSavings(order);
  const located = order.buyer.lat !== null && order.buyer.lng !== null;
  // A confirmed order can still be handed over — say so where the actions were.
  const canHandOver = tab === 'confirmed' && (account.hasLogistics || account.hasDarkStore);

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
            description={
              <>
                {cancelReasonText(order, t)}
                {order.cancelledBy === 'CUSTOMER' && <span className="mt-1 block">{t('seller.detail.auto_processed')}</span>}
              </>
            }
          />
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
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" onClick={() => (window.location.href = `tel:${order.buyer.mobile}`)}>
              <Phone size={15} />
              {t('seller.detail.call')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.open(`https://wa.me/91${order.buyer.mobile}`, '_blank')}>
              <MessageCircle size={15} />
              WhatsApp
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.open(mapsLink(order), '_blank')}>
              <MapPin size={15} />
              {t('seller.odetail.map')}
            </Button>
          </div>
          {/* Everything a delivery agent needs — shop, map, date, what to collect. */}
          <Button variant="outlinePrimary" size="sm" fullWidth onClick={() => shareToWhatsApp(orderShareText(order, t))}>
            <Share2 size={15} />
            {t('seller.share.with_agent')}
          </Button>
          {!located && <p className="text-xs font-medium text-warning-foreground">{t('seller.odetail.no_location')}</p>}
        </section>

        {order.logistics && <LogisticsBlock logistics={order.logistics} />}

        <section className="grid grid-cols-2 gap-x-2 gap-y-3 rounded-lg border border-border bg-card p-3 text-xs shadow-sm">
          <Fact label={t('seller.detail.company')} value={order.company} />
          <Fact label={t('seller.detail.marketplace')} value={order.marketplace} />
          {order.channelOrderId && (
            <div className="col-span-2">
              <div className="text-foreground-secondary">{t('seller.odetail.channel_id')}</div>
              <CopyChip value={order.channelOrderId} />
            </div>
          )}
          <Fact label={t('seller.detail.placed')} value={formatPlacedAt(order.placedAt)} />
          <Fact label={t('seller.detail.payment')} value={t(`seller.payment.${order.paymentMode}`)} />
          <Fact label={t('seller.detail.gst')} value={gstn ?? t('seller.detail.gst_none')} />
        </section>

        {/* Items — what the store ordered, as placed */}
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-3 py-2.5 text-sm font-semibold">{t('seller.detail.items').replace('{n}', String(liveLines(order).length))}</div>
          <ul className="divide-y divide-border">
            {order.lines.map((l) => (
              <li key={l.id} className="flex gap-3 p-3">
                <ProductThumb productId={l.productId} alt={l.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-snug">{l.name}</div>
                  <div className="text-xs text-foreground-secondary">
                    {l.pack} · {l.skuCode}
                  </div>
                  <div className="text-xs text-foreground-secondary">
                    {l.basePrice && <span className="mr-1 line-through tabular-nums">{formatInrExact(l.basePrice)}</span>}
                    <span className="tabular-nums">{formatInrExact(l.price)}</span> {t('seller.detail.each')}
                  </div>
                  {l.basePrice && (
                    <div className="mt-1 flex items-center gap-1 text-xs font-medium text-success-foreground">
                      <BadgePercent size={13} className="shrink-0" />
                      {t('seller.detail.offer_line')
                        .replace('{pct}', String(Math.round((1 - l.price / l.basePrice) * 100)))
                        .replace('{saved}', formatInrExact((l.basePrice - l.price) * l.qty))
                        .replace('{code}', l.offerCode ?? '')}
                    </div>
                  )}
                  {l.status === 'OUT_OF_STOCK' && (
                    <Badge variant="warning" className="mt-1">
                      {t('seller.detail.not_available')}
                    </Badge>
                  )}
                </div>
                <div className="shrink-0 text-right text-sm">
                  <div className="text-xs text-foreground-secondary">× {l.qty}</div>
                  <div className="font-semibold tabular-nums">{formatInrExact(l.qty * l.price)}</div>
                </div>
              </li>
            ))}
          </ul>
          {savings > 0 && (
            <div className="flex items-center justify-between border-t border-border px-3 pt-3 text-sm text-success-foreground">
              <span>{t('seller.odetail.qps_total')}</span>
              <span className="font-semibold tabular-nums">−{formatInrExact(savings)}</span>
            </div>
          )}
          <div className={savings > 0 ? 'flex items-center justify-between px-3 pb-3 pt-1' : 'flex items-center justify-between border-t border-border px-3 py-3'}>
            <span className="text-sm font-semibold">{t('seller.orders.order_value')}</span>
            <span className="text-base font-bold tabular-nums">{formatInrExact(orderTotal(order))}</span>
          </div>
        </section>
        {canHandOver && <p className="px-1 text-xs text-foreground-secondary">{t('seller.odetail.hand_over_hint')}</p>}
      </div>

      {/* The next step */}
      {(tab === 'new' || tab === 'confirmed') && (
        <div className="flex gap-3 border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
          <Button variant="secondary" className="flex-1" onClick={() => onAction('cancel', order)}>
            {t('seller.action.cancel')}
          </Button>
          {tab === 'new' ? (
            <Button className="flex-[2]" onClick={() => onAction('confirm', order)}>
              {t('seller.action.confirm_order')}
            </Button>
          ) : (
            <Button className="flex-[2]" onClick={() => onAction('deliver', order)}>
              {t('seller.action.deliver')}
            </Button>
          )}
        </div>
      )}
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

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() =>
        navigator.clipboard?.writeText(value).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          },
          () => undefined
        )
      }
      aria-label={`Copy ${value}`}
      className="mt-0.5 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-semibold text-foreground active:scale-[0.98]"
    >
      {value}
      {copied ? <Check size={13} className="text-success-foreground" /> : <Copy size={13} className="text-foreground-secondary" />}
    </button>
  );
}
