import type { Product } from './products';
import { cheapestVendorId, type WholesalerProduct } from './wholesaler';

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
}

export const teaserFromProduct = (p: Product): ProductTeaser => ({
  id: p.id,
  name: p.name,
  image: p.image,
  margin: p.margin,
  price: p.price,
  mrp: p.mrp,
});

export const teaserFromWholesale = (p: WholesalerProduct): ProductTeaser => {
  const v = p.vendors.find((x) => x.id === cheapestVendorId(p)) ?? p.vendors[0];
  return { id: p.id, name: p.name, image: p.image, margin: v.margin, price: v.price, mrp: v.mrp };
};
