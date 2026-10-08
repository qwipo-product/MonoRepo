/* Seller "Accept Orders" status, as set in the Seller Portal.

   A seller with Accept Orders OFF is shown greyed out with a red "Currently
   Offline" badge everywhere the buyer meets them, and nothing can be done
   with them — no store, no products, no add-to-cart, no checkout. Back ON,
   everything works again, including the items already in the cart.

   Demo: the review sidebar has an Accept Orders switch for the sellers below
   (standing in for the Seller Portal). Every screen reads this one list. */

/** Sellers the review sidebar can switch, and whether they start offline. */
export const DEMO_SELLERS: { name: string; kind: 'Distributor' | 'Wholesaler'; startsOffline: boolean }[] = [
  { name: 'Annapurna Traders', kind: 'Distributor', startsOffline: true },
  { name: 'Vasudha Wholesalers', kind: 'Wholesaler', startsOffline: true },
];

const OFFLINE_SELLERS = new Set<string>(DEMO_SELLERS.filter((s) => s.startsOffline).map((s) => s.name));

export const isSellerOffline = (name: string | undefined | null) => !!name && OFFLINE_SELLERS.has(name);

/** Accept Orders switch. App re-renders after calling this so every screen picks it up. */
export function setAcceptOrders(name: string, accepting: boolean) {
  if (accepting) OFFLINE_SELLERS.delete(name);
  else OFFLINE_SELLERS.add(name);
}

export const offlineMessage = (name: string) => `${name} is currently offline and not accepting orders.`;
