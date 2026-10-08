import type { Product } from './products';
import { allVendorsOffline, cheapestVendorId, type WholesalerProduct } from './wholesaler';
import { isSellerOffline } from './sellerStatus';

/* The compact product a Home rail shows — a name, what it earns and what it
   costs. Both rails take this shape (Previously Ordered, Trending), so a
   distributor SKU and a wholesale SKU render identically whichever tab
   they're on. A wholesale line is quoted at its cheapest vendor: the rail is
   a teaser, and choosing a vendor belongs on the card the buyer lands on. */
export interface ProductTeaser {
  id: string;
  name: string;
  image: string;
  margin: string;
  price: number;
  mrp?: number;
  /** Set when the card should show as offline: the distributor's name, or a
      wholesale line's vendor when every vendor of it is offline. */
  offlineSeller?: string;
}

export const teaserFromProduct = (p: Product): ProductTeaser => ({
  id: p.id,
  name: p.name,
  image: p.image,
  margin: p.margin,
  price: p.price,
  mrp: p.mrp,
  offlineSeller: isSellerOffline(p.seller) ? p.seller : undefined,
});

export const teaserFromWholesale = (p: WholesalerProduct): ProductTeaser => {
  const v = p.vendors.find((x) => x.id === cheapestVendorId(p)) ?? p.vendors[0];
  return {
    id: p.id,
    name: p.name,
    image: p.image,
    margin: v.margin,
    price: v.price,
    mrp: v.mrp,
    offlineSeller: allVendorsOffline(p) ? v.name : undefined,
  };
};
