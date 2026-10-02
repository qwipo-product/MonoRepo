// Orders a distributor receives — the seller side of the catalogue. Read-only
// seed: the seller-mobile app copies these into its own store and mutates the
// copy when the seller confirms, cancels or delivers.
//
// Statuses are the seller platform's real enum. New = CREATED;
// Confirmed = ACCEPTED | PACKED | SHIPPED; then DELIVERED / CANCELLED.
// Beat orders deliver on their beat's day; quick (non-beat) orders next day.

import type { SellerOrder, SellerOrderBuyer } from '@mockups/types';
import { sellerCustomers } from './sellerCatalog';

// The buyer on each order is one of the seller's customers, so names,
// mobiles and addresses match the Customers tab.
const buyer = (storeName: string): SellerOrderBuyer => {
  const c = sellerCustomers.find((x) => x.storeName === storeName)!;
  const a = c.addresses.find((x) => x.primary) ?? c.addresses[0];
  return { storeName: c.storeName, ownerName: c.ownerName, mobile: c.mobile, address: a.line, area: a.area, city: a.city, pincode: a.pincode };
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

export const sellerOrders: SellerOrder[] = [
  // ── New (CREATED) ──
  {
    id: 'QW-240871', placedAt: '2026-10-02T09:12:00+05:30', deliveryDate: '2026-10-05', beatName: 'KPHB Monday Beat', paymentMode: 'COD', status: 'CREATED', buyer: B.lakshmi,
    lines: [
      { id: 'l1', productId: 'freedom-sunflower', name: 'Freedom Refined Sunflower Oil', pack: '1 L pouch', qty: 24, price: 165, status: 'ORDERED' },
      { id: 'l2', productId: 'aashirvaad-atta', name: 'Aashirvaad Shudh Chakki Atta', pack: '5 kg bag', qty: 10, price: 265, status: 'ORDERED' },
      { id: 'l3', productId: 'tata-salt', name: 'Tata Salt Iodised', pack: '1 kg', qty: 30, price: 27, status: 'ORDERED' },
    ],
  },
  {
    id: 'QW-240866', placedAt: '2026-10-02T08:47:00+05:30', deliveryDate: '2026-10-03', beatName: null, paymentMode: 'COD', status: 'CREATED', buyer: B.balaji,
    lines: [
      { id: 'l1', productId: 'surf-excel', name: 'Surf Excel Quick Wash Detergent Powder', pack: '1 kg', qty: 12, price: 125, status: 'ORDERED' },
      { id: 'l2', productId: 'maggi-masala', name: 'Maggi 2-Minute Masala Noodles', pack: '70 g × 12', qty: 8, price: 156, status: 'ORDERED' },
    ],
  },
  {
    // The item-unavailable case: the DMS reported the ghee out of stock.
    id: 'QW-240859', placedAt: '2026-10-02T08:05:00+05:30', deliveryDate: '2026-10-06', beatName: 'Dilsukhnagar Tuesday Beat', paymentMode: 'PREPAID', status: 'CREATED', buyer: B.venkateswara,
    lines: [
      { id: 'l1', productId: 'aashirvaad-ghee', name: 'Aashirvaad Svasti Pure Cow Ghee', pack: '1 L', qty: 6, price: 640, status: 'OUT_OF_STOCK' },
      { id: 'l2', productId: 'amul-butter', name: 'Amul Pasteurised Salted Butter', pack: '500 g', qty: 10, price: 285, status: 'ORDERED' },
      { id: 'l3', productId: 'tata-tea-gold', name: 'Tata Tea Gold', pack: '500 g', qty: 12, price: 290, status: 'ORDERED' },
      { id: 'l4', productId: 'parle-g', name: 'Parle-G Original Glucose Biscuits', pack: '250 g', qty: 48, price: 25, status: 'ORDERED' },
    ],
  },
  {
    id: 'QW-240852', placedAt: '2026-10-01T19:40:00+05:30', deliveryDate: '2026-10-05', beatName: 'KPHB Monday Beat', paymentMode: 'COD', status: 'CREATED', buyer: B.hanuman,
    lines: [
      { id: 'l1', productId: 'fortune-soya', name: 'Fortune Soya Health Refined Oil', pack: '1 L pouch', qty: 20, price: 155, status: 'ORDERED' },
      { id: 'l2', productId: 'itc-sunfeast-marie', name: 'Sunfeast Marie Light Biscuits', pack: '250 g', qty: 36, price: 30, status: 'ORDERED' },
    ],
  },
  {
    id: 'QW-240848', placedAt: '2026-10-01T18:15:00+05:30', deliveryDate: '2026-10-03', beatName: null, paymentMode: 'COD', status: 'CREATED', buyer: B.ganesh,
    lines: [
      { id: 'l1', productId: 'freedom-groundnut', name: 'Freedom Double Filtered Groundnut Oil', pack: '1 L pouch', qty: 15, price: 210, status: 'ORDERED' },
      { id: 'l2', productId: 'itc-bingo-mad-angles', name: 'Bingo Mad Angles Tomato Madness', pack: 'Family pack', qty: 24, price: 20, status: 'ORDERED' },
    ],
  },

  // ── Confirmed (ACCEPTED / PACKED / SHIPPED) ──
  {
    id: 'QW-240831', placedAt: '2026-10-01T11:20:00+05:30', deliveryDate: '2026-10-03', beatName: 'Secunderabad Saturday Beat', paymentMode: 'COD', status: 'ACCEPTED', buyer: B.annapurna,
    lines: [
      { id: 'l1', productId: 'aashirvaad-atta', name: 'Aashirvaad Shudh Chakki Atta', pack: '5 kg bag', qty: 20, price: 265, status: 'ORDERED' },
      { id: 'l2', productId: 'tata-salt', name: 'Tata Salt Iodised', pack: '1 kg', qty: 50, price: 27, status: 'ORDERED' },
    ],
  },
  {
    id: 'QW-240824', placedAt: '2026-10-01T10:02:00+05:30', deliveryDate: '2026-10-03', beatName: null, paymentMode: 'PREPAID', status: 'PACKED', buyer: B.sairam,
    lines: [
      { id: 'l1', productId: 'tata-tea-gold', name: 'Tata Tea Gold', pack: '500 g', qty: 6, price: 290, status: 'ORDERED' },
      { id: 'l2', productId: 'parle-g', name: 'Parle-G Original Glucose Biscuits', pack: '250 g', qty: 60, price: 25, status: 'ORDERED' },
    ],
  },
  {
    id: 'QW-240810', placedAt: '2026-09-30T17:30:00+05:30', deliveryDate: '2026-10-03', beatName: 'KPHB Saturday Beat', paymentMode: 'COD', status: 'SHIPPED', buyer: B.lakshmi,
    lines: [
      { id: 'l1', productId: 'surf-excel', name: 'Surf Excel Quick Wash Detergent Powder', pack: '1 kg', qty: 10, price: 125, status: 'ORDERED' },
    ],
  },

  // ── Delivered ──
  {
    id: 'QW-240795', placedAt: '2026-09-30T09:10:00+05:30', deliveryDate: '2026-10-01', beatName: 'Ameerpet Thursday Beat', paymentMode: 'COD', status: 'DELIVERED', buyer: B.balaji,
    lines: [
      { id: 'l1', productId: 'freedom-sunflower', name: 'Freedom Refined Sunflower Oil', pack: '1 L pouch', qty: 30, price: 165, status: 'FULFILLED' },
      { id: 'l2', productId: 'maggi-masala', name: 'Maggi 2-Minute Masala Noodles', pack: '70 g × 12', qty: 5, price: 156, status: 'FULFILLED' },
    ],
  },
  {
    id: 'QW-240781', placedAt: '2026-09-29T15:45:00+05:30', deliveryDate: '2026-09-30', beatName: null, paymentMode: 'PREPAID', status: 'DELIVERED', buyer: B.venkateswara,
    lines: [
      { id: 'l1', productId: 'amul-butter', name: 'Amul Pasteurised Salted Butter', pack: '500 g', qty: 8, price: 285, status: 'FULFILLED' },
    ],
  },

  // ── Cancelled ──
  {
    id: 'QW-240776', placedAt: '2026-09-29T12:00:00+05:30', deliveryDate: '2026-09-30', beatName: null, paymentMode: 'COD', status: 'CANCELLED', buyer: B.hanuman,
    cancelReason: 'One or more items in the order not available',
    lines: [
      { id: 'l1', productId: 'aashirvaad-ghee', name: 'Aashirvaad Svasti Pure Cow Ghee', pack: '1 L', qty: 4, price: 640, status: 'CANCELLED' },
    ],
  },
];
