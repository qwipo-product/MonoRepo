import { formatInrExact } from '@mockups/components';
import type { SellerCustomer, SellerCustomerAddress, SellerOrder } from '@mockups/types';
import { formatDay } from './format';
import { liveLines, orderTotal } from './orders';

/* Share a shop's location (and an order's delivery facts) on WhatsApp —
   for a delivery agent or anyone else. Opens WhatsApp with the message
   ready; the seller picks the chat. Labels follow the app language; store
   names and addresses stay as they are. */

type T = (key: string) => string;

/** Open WhatsApp with this message; the seller chooses who gets it. */
export const shareToWhatsApp = (text: string) => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');

const mapLink = (lat: number | null, lng: number | null, address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${lat !== null && lng !== null ? `${lat},${lng}` : encodeURIComponent(address)}`;

const lines = (parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join('\n');

export function customerShareText(c: SellerCustomer, a: SellerCustomerAddress, t: T) {
  const address = `${a.line}, ${a.area}, ${a.city} ${a.pincode}`;
  const located = a.lat !== null && a.lng !== null;
  return lines([
    `📍 *${c.storeName}*`,
    `${c.ownerName} · ${c.mobile}`,
    address,
    `${t('seller.share.beat')}: ${a.serviceability[0]?.beat ?? t('seller.orders.quick_delivery')}`,
    `${t('seller.share.map')}: ${mapLink(a.lat, a.lng, address)}`,
    !located && t('seller.share.no_location'),
  ]);
}

export function orderShareText(o: SellerOrder, t: T) {
  const b = o.buyer;
  const address = `${b.address}, ${b.area}, ${b.city} ${b.pincode}`;
  const located = b.lat !== null && b.lng !== null;
  const items = liveLines(o).length;
  const pay =
    o.paymentMode === 'COD'
      ? t('seller.share.collect').replace('{amount}', formatInrExact(orderTotal(o)))
      : t('seller.payment.PREPAID');
  return lines([
    `📦 *${t('seller.share.order').replace('{id}', o.id)}*`,
    `📍 *${b.storeName}*`,
    `${b.ownerName} · ${b.mobile}`,
    address,
    `${t('seller.share.beat')}: ${o.beatName ?? t('seller.orders.quick_delivery')}`,
    `${t('seller.share.deliver_on')}: ${formatDay(o.deliveryDate)}`,
    `${pay} · ${t(items === 1 ? 'seller.share.items_one' : 'seller.share.items_many').replace('{n}', String(items))}`,
    `${t('seller.share.map')}: ${mapLink(b.lat, b.lng, address)}`,
    !located && t('seller.share.no_location'),
  ]);
}
