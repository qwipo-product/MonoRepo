/* What one distributor actually covers, read off its own products.

   The Sellers tab used to print the catalogue-wide brand list against every
   seller, so all of them claimed the same brands and the same count — and
   opening one showed something else entirely. A distributor's book is its
   own: it carries a few principals, each principal has a few brands, and
   those brands' products land in whichever categories they belong to. All
   three are derivable from the products, so none of it is stored twice and
   none of it can drift from what the buyer finds inside. */

import { PRODUCTS, type Product } from './products';
import { BRANDS, type HomeBrand, DIST_CATEGORIES, type HomeCategory } from './home';
import { brandOf } from './search';

/** The brand a product belongs to — stated on the product where its name
 *  doesn't give it away, otherwise read off the front of the name. */
export const brandOfProduct = (p: Product): string => p.brand ?? brandOf(p.shortName);

/* Logos come from the home brand list where it has one, because those
   filenames don't always match the brand ("Freedom" ships as Freedon Oil.png).
   Everything else is named after its brand. */
const LOGOS: Record<string, string> = Object.fromEntries(BRANDS.map((b) => [b.name, b.logo]));
const logoFor = (brand: string) => LOGOS[brand] ?? `./brand-logos/${brand}.png`;

export interface SellerFacets {
  /** The principals this distributor carries. */
  companies: string[];
  brands: HomeBrand[];
  /** Every category this seller's products fall into, by name. Counted from
   *  the products rather than matched against the browse tiles: a seller
   *  seen only in Personal Care has one category, not none. */
  categories: string[];
  /** The browse tiles for those categories, where one exists. */
  categoryTiles: HomeCategory[];
  productCount: number;
}

const EMPTY: SellerFacets = { companies: [], brands: [], categories: [], categoryTiles: [], productCount: 0 };

const CACHE = new Map<string, SellerFacets>();

/** Everything the Sellers tab needs to describe one distributor. */
export function facetsForSeller(seller: string): SellerFacets {
  const hit = CACHE.get(seller);
  if (hit) return hit;

  const mine = PRODUCTS.filter((p) => p.seller === seller);
  if (mine.length === 0) {
    CACHE.set(seller, EMPTY);
    return EMPTY;
  }

  const brandNames = [...new Set(mine.map(brandOfProduct))];
  const categoryNames = new Set(mine.map((p) => p.category));

  const facets: SellerFacets = {
    companies: [...new Set(mine.map((p) => p.company).filter((c): c is string => !!c))],
    brands: brandNames.map((name) => ({ id: `${seller}-${name}`, name, logo: logoFor(name) })),
    categories: [...categoryNames],
    // Keep the catalogue's own order and images rather than inventing tiles.
    categoryTiles: DIST_CATEGORIES.filter((c) => categoryNames.has(c.name)),
    productCount: mine.length,
  };
  CACHE.set(seller, facets);
  return facets;
}
