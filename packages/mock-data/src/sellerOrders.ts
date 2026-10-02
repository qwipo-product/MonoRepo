// Orders a distributor receives — the seller side of the catalogue. Read-only
// seed: the seller-mobile app copies these into its own store and mutates the
// copy when the seller confirms, cancels or delivers.
//
// Statuses are the seller platform's real enum. New = CREATED;
// Confirmed = ACCEPTED | PACKED | SHIPPED; then DELIVERED / CANCELLED.
// Beat orders deliver on their beat's day; quick (non-beat) orders next day.

import type { SellerOrder, SellerOrderBuyer, SellerOrderLine } from '@mockups/types';
import { sellerCustomers, sellerSkus } from './sellerCatalog';

// The buyer on each order is one of the seller's customers, so names,
// mobiles and addresses match the Customers tab.
const buyer = (storeName: string): SellerOrderBuyer => {
  const c = sellerCustomers.find((x) => x.storeName === storeName)!;
  const a = c.addresses.find((x) => x.primary) ?? c.addresses[0];
  return { storeName: c.storeName, ownerName: c.ownerName, mobile: c.mobile, address: a.line, area: a.area, city: a.city, pincode: a.pincode, lat: a.lat, lng: a.lng, gstn: c.gstn };
};
const B = {
  lakshmi: buyer('Sri Lakshmi Kirana'),
  balaji: buyer('Balaji General Stores'),
  venkateswara: buyer('Venkateswara Super Market'),
  hanuman: buyer('Hanuman Provision Store'),
  annapurna: buyer('Annapurna Traders'),
  ganesh: buyer('Ganesh Kirana & General'),
  sairam: buyer('Sai Ram Daily Needs'),
};

// One order line from the seller's own product, at its selling price — or,
// with `offer`, at that slab's discounted price (the QPS saving).
const line = (
  id: string,
  skuCode: string,
  qty: number,
  opts: { status?: SellerOrderLine['status']; offer?: [string, number] } = {}
): SellerOrderLine => {
  const sku = sellerSkus.find((s) => s.code === skuCode)!;
  const base = { id, productId: sku.productId, skuCode, name: sku.name, pack: sku.pack, qty, status: opts.status ?? 'ORDERED' } as const;
  if (!opts.offer) return { ...base, price: sku.price };
  const [offerCode, pct] = opts.offer;
  return { ...base, price: Math.round(sku.price * (1 - pct / 100) * 100) / 100, basePrice: sku.price, offerCode };
};

export const sellerOrders: SellerOrder[] = [
  // ── New (CREATED) ──
  {
    // Atta crosses the 10-unit slab of offer QPS-1051 (4% off).
    id: 'QW-240871', company: 'ITC Limited', marketplace: 'ONDC', channelOrderId: 'ONDC-262408717', placedAt: '2026-10-02T09:12:00+05:30', deliveryDate: '2026-10-05', beatName: 'KPHB Monday Beat', paymentMode: 'COD', status: 'CREATED', buyer: B.lakshmi,
    lines: [
      line('l1', 'ASV-ATA-5K', 12, { offer: ['QPS-1051', 4] }),
      line('l2', 'ITC-MAR-250', 36),
      line('l3', 'ITC-BNG-FP', 24),
    ],
  },
  {
    id: 'QW-240866', company: 'Hindustan Unilever', marketplace: 'ONDC', channelOrderId: 'ONDC-262408667', placedAt: '2026-10-02T08:47:00+05:30', deliveryDate: '2026-10-03', beatName: null, paymentMode: 'COD', status: 'CREATED', buyer: B.balaji,
    lines: [line('l1', 'HUL-SRF-1K', 24)],
  },
  {
    // The item-unavailable case: the DMS reported the ghee out of stock.
    id: 'QW-240859', company: 'ITC Limited', marketplace: 'ONDC', channelOrderId: 'ONDC-262408597', placedAt: '2026-10-02T08:05:00+05:30', deliveryDate: '2026-10-05', beatName: 'KPHB Monday Beat', paymentMode: 'PREPAID', status: 'CREATED', buyer: B.hanuman,
    lines: [
      line('l1', 'ASV-GHE-1L', 6, { status: 'OUT_OF_STOCK' }),
      line('l2', 'ASV-ATA-5K', 8),
      line('l3', 'ITC-MAR-250', 48),
      line('l4', 'ITC-BNG-FP', 24),
    ],
  },
  {
    id: 'QW-240852', company: 'Tata Consumer Products', marketplace: 'ONDC', channelOrderId: 'ONDC-262408527', placedAt: '2026-10-01T19:40:00+05:30', deliveryDate: '2026-10-06', beatName: 'Dilsukhnagar Tuesday Beat', paymentMode: 'COD', status: 'CREATED', buyer: B.venkateswara,
    lines: [line('l1', 'TTA-TEA-500', 12), line('l2', 'TTA-SLT-1K', 30)],
  },
  {
    id: 'QW-240848', company: 'Adani Wilmar', marketplace: 'ONDC', channelOrderId: 'ONDC-262408487', placedAt: '2026-10-01T18:15:00+05:30', deliveryDate: '2026-10-03', beatName: null, paymentMode: 'COD', status: 'CREATED', buyer: B.ganesh,
    lines: [line('l1', 'FTN-SOY-1L', 20)],
  },

  // ── Confirmed (ACCEPTED / PACKED / SHIPPED) ──
  {
    id: 'QW-240831', company: 'Tata Consumer Products', marketplace: 'ONDC', channelOrderId: 'ONDC-262408317', placedAt: '2026-10-01T11:20:00+05:30', deliveryDate: '2026-10-03', beatName: 'Secunderabad Saturday Beat', paymentMode: 'COD', status: 'ACCEPTED', buyer: B.annapurna,
    lines: [line('l1', 'TTA-SLT-1K', 50), line('l2', 'TTA-TEA-500', 6)],
  },
  {
    id: 'QW-240824', company: 'Tata Consumer Products', marketplace: 'ONDC', channelOrderId: 'ONDC-262408247', placedAt: '2026-10-01T10:02:00+05:30', deliveryDate: '2026-10-03', beatName: null, paymentMode: 'PREPAID', status: 'PACKED', buyer: B.sairam,
    logistics: { via: 'LOGISTICS', partner: 'Shiprocket', status: 'READY_FOR_SHIPMENT', awb: 'SR1458823390' },
    lines: [line('l1', 'TTA-TEA-500', 6), line('l2', 'TTA-SLT-1K', 20)],
  },
  {
    id: 'QW-240810', company: 'Tata Consumer Products', marketplace: 'ONDC', channelOrderId: 'ONDC-262408107', placedAt: '2026-09-30T17:30:00+05:30', deliveryDate: '2026-10-03', beatName: 'KPHB Saturday Beat', paymentMode: 'COD', status: 'SHIPPED', buyer: B.lakshmi,
    logistics: { via: 'DARK_STORE', partner: 'Moosapet Dark Store', status: 'OUT_FOR_DELIVERY' },
    lines: [line('l1', 'TTA-SLT-1K', 40)],
  },

  // ── Delivered ──
  {
    id: 'QW-240795', company: 'Nestlé India', marketplace: 'ONDC', channelOrderId: 'ONDC-262407957', placedAt: '2026-09-30T09:10:00+05:30', deliveryDate: '2026-10-01', beatName: null, paymentMode: 'COD', status: 'DELIVERED', buyer: B.balaji,
    lines: [line('l1', 'NES-MAG-70', 10, { status: 'FULFILLED' })],
  },
  {
    id: 'QW-240781', company: 'Amul', marketplace: 'ONDC', channelOrderId: 'ONDC-262407817', placedAt: '2026-09-29T15:45:00+05:30', deliveryDate: '2026-09-30', beatName: null, paymentMode: 'PREPAID', status: 'DELIVERED', buyer: B.venkateswara,
    lines: [line('l1', 'AML-BTR-500', 8, { status: 'FULFILLED' })],
  },

  // ── Cancelled — one by the seller, one by the store from the buyer app ──
  {
    id: 'QW-240776', company: 'ITC Limited', marketplace: 'ONDC', channelOrderId: 'ONDC-262407767', placedAt: '2026-09-29T12:00:00+05:30', deliveryDate: '2026-09-30', beatName: 'KPHB Monday Beat', paymentMode: 'COD', status: 'CANCELLED', buyer: B.hanuman,
    cancelledBy: 'SELLER', cancelledAt: '2026-09-29T14:20:00+05:30', cancelReason: 'One or more items in the order not available',
    lines: [line('l1', 'ASV-GHE-1L', 4, { status: 'CANCELLED' })],
  },
  {
    id: 'QW-240769', company: 'Adani Wilmar', marketplace: 'ONDC', channelOrderId: 'ONDC-262407697', placedAt: '2026-09-28T16:05:00+05:30', deliveryDate: '2026-09-29', beatName: null, paymentMode: 'COD', status: 'CANCELLED', buyer: B.ganesh,
    cancelledBy: 'CUSTOMER', cancelledAt: '2026-09-28T16:40:00+05:30',
    lines: [line('l1', 'FTN-SOY-1L', 12, { status: 'CANCELLED' })],
  },
];
