import type { ReactNode } from 'react';
import { CalendarDays, MapPin, Phone, Route, Zap } from 'lucide-react';
import { useI18n } from '@mockups/i18n';
import type { SellerOrder } from '@mockups/types';
import { formatDay } from '../format';
import { tabOf } from '../orders';

const fullAddress = (o: SellerOrder) =>
  `${o.buyer.address}, ${o.buyer.area}, ${o.buyer.city} ${o.buyer.pincode}`;

/* Where and when the goods go — the beat, the delivery date and the shop's
   address. In B2B distribution this is what the team plans the van around,
   so it sits in one tinted block on every order card and on the order page.
   Cards show just the area and pincode; the order page shows the full address. */
export function DeliveryPanel({ order, compact }: { order: SellerOrder; compact?: boolean }) {
  const { t } = useI18n();
  const delivered = tabOf(order) === 'delivered';
  return (
    <div className="space-y-2 rounded-md bg-primary-soft p-2.5 text-foreground">
      <div className="grid grid-cols-2 gap-2">
        <Row
          icon={order.beatName ? <Route size={14} className="text-primary" /> : <Zap size={14} className="text-warning-foreground" />}
          label={t('seller.detail.beat')}
          value={order.beatName ?? t('seller.orders.quick_delivery')}
        />
        <Row
          icon={<CalendarDays size={14} className="text-primary" />}
          label={t(delivered ? 'seller.orders.delivered_on' : 'seller.orders.expected_delivery')}
          value={formatDay(order.deliveryDate)}
        />
      </div>
      {compact ? (
        <div className="grid grid-cols-2 gap-2">
          <Row icon={<MapPin size={14} className="text-primary" />} label={t('seller.detail.area')} value={`${order.buyer.area} · ${order.buyer.pincode}`} />
          <Row
            icon={<Phone size={14} className="text-primary" />}
            label={t('seller.detail.mobile')}
            value={order.buyer.mobile}
            href={`tel:${order.buyer.mobile}`}
          />
        </div>
      ) : (
        <Row icon={<MapPin size={14} className="text-primary" />} label={t('seller.detail.address')} value={fullAddress(order)} />
      )}
    </div>
  );
}

/* `href` makes the value a link — the mobile number dials on tap. */
function Row({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex min-w-0 gap-1.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] text-foreground-secondary">{label}</div>
        {href ? (
          <a href={href} className="text-sm font-semibold leading-snug text-primary underline-offset-2 active:underline">
            {value}
          </a>
        ) : (
          <div className="text-sm font-semibold leading-snug">{value}</div>
        )}
      </div>
    </div>
  );
}
