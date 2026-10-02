import { CalendarDays, MapPin, Phone, Route, Store, Truck, Zap } from 'lucide-react';
import { useI18n } from '@mockups/i18n';
import type { SellerOrder, SellerOrderLogistics } from '@mockups/types';
import { formatDay } from '../format';
import { tabOf } from '../orders';
import { InfoBlock, InfoPair, InfoRow } from './InfoBlock';

const fullAddress = (o: SellerOrder) => `${o.buyer.address}, ${o.buyer.area}, ${o.buyer.city} ${o.buyer.pincode}`;

/* Where and when an order's goods go. Cards show the area, pincode and
   mobile; the order page shows the full address. */
export function DeliveryPanel({ order, compact }: { order: SellerOrder; compact?: boolean }) {
  const { t } = useI18n();
  const delivered = tabOf(order) === 'delivered';
  return (
    <InfoBlock>
      <InfoPair>
        <BeatRow beat={order.beatName} />
        <InfoRow
          icon={<CalendarDays size={14} className="text-primary" />}
          label={t(delivered ? 'seller.orders.delivered_on' : 'seller.orders.expected_delivery')}
          value={formatDay(order.deliveryDate)}
        />
      </InfoPair>
      {compact ? (
        <InfoPair>
          <InfoRow icon={<MapPin size={14} className="text-primary" />} label={t('seller.detail.area')} value={`${order.buyer.area} · ${order.buyer.pincode}`} />
          <MobileRow mobile={order.buyer.mobile} />
        </InfoPair>
      ) : (
        <InfoRow icon={<MapPin size={14} className="text-primary" />} label={t('seller.detail.address')} value={fullAddress(order)} />
      )}
    </InfoBlock>
  );
}

/** The beat — or "Quick delivery" when no beat applies. */
export function BeatRow({ beat }: { beat: string | null }) {
  const { t } = useI18n();
  return (
    <InfoRow
      icon={beat ? <Route size={14} className="text-primary" /> : <Zap size={14} className="text-warning-foreground" />}
      label={t('seller.detail.beat')}
      value={beat ?? t('seller.orders.quick_delivery')}
    />
  );
}

export function MobileRow({ mobile }: { mobile: string }) {
  const { t } = useI18n();
  return <InfoRow icon={<Phone size={14} className="text-primary" />} label={t('seller.detail.mobile')} value={mobile} href={`tel:${mobile}`} />;
}

/* Who has the order now, once it's with a 3PL partner or a dark store: the
   partner, the portal's logistics status, and the tracking number. */
export function LogisticsBlock({ logistics }: { logistics: SellerOrderLogistics }) {
  const { t } = useI18n();
  return (
    <span className="flex items-start gap-2 rounded-md border border-info-border bg-info-subtle p-2.5 text-info-foreground">
      {logistics.via === 'LOGISTICS' ? <Truck size={15} className="mt-0.5 shrink-0" /> : <Store size={15} className="mt-0.5 shrink-0" />}
      <span className="min-w-0 text-xs">
        <span className="block font-semibold">
          {t(logistics.via === 'LOGISTICS' ? 'seller.logistics.with_3pl' : 'seller.logistics.with_dark').replace('{partner}', logistics.partner)}
        </span>
        <span className="block">
          {t(`seller.logistics.status.${logistics.status}`)}
          {logistics.awb && ` · ${t('seller.logistics.awb').replace('{awb}', logistics.awb)}`}
        </span>
      </span>
    </span>
  );
}
