import { CalendarDays, MapPin, Phone, Route, Zap } from 'lucide-react';
import { useI18n } from '@mockups/i18n';
import type { SellerOrder } from '@mockups/types';
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
