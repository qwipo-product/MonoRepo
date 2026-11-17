// Home feed data — references the real assets copied into public/.
// Demo fixtures are local to this app and match the home screen reference.

export interface Distributor {
  id: string;
  logo: string;
  title: string;
  /** Full seller name — scopes the storefront + its product list (p.seller). */
  name: string;
}
export interface HomeCategory {
  id: string;
  name: string;
  image: string;
}
export interface HomeBrand {
  id: string;
  name: string;
  logo: string;
}

export const HERO_BANNERS = [
  './distributor-banners/Banner1.png',
  './distributor-banners/Banner2.png',
  './distributor-banners/Banner3.png',
  './distributor-banners/Banner4.png',
];

export const DISTRIBUTORS: Distributor[] = [
  { id: 'd1', logo: './brand-logos/Freedon Oil.png', title: 'Freedom Oil', name: 'Sri Sai Krishna Traders' },
  { id: 'd2', logo: './brand-logos/Aashirvaad.png', title: 'Aashirvaad Atta', name: 'Karnataka Soaps & Detergents' },
  { id: 'd3', logo: './brand-logos/Sri Lalitha.png', title: 'Sona Masoori Rice', name: 'Annapurna Traders' },
  { id: 'd4', logo: './brand-logos/Cow.png', title: 'Cow Ghee', name: 'Sri Krishna Agencies' },
  { id: 'd5', logo: './brand-logos/MTR.png', title: 'MTR Masala', name: 'Balaji Distributors' },
  { id: 'd6', logo: './brand-logos/Double Horse.png', title: 'Double Horse', name: 'Vijaya Traders' },
  { id: 'd7', logo: './brand-logos/Tata.png', title: 'Tata Salt & Tea', name: 'Tata Consumer Products' },
  /* Cross-dock distributors. They carry brands the bigger distributors carry
     too — which is the point: four small orders become one delivery. */
  { id: 'd8', logo: './brand-logos/GRB.png', title: 'GRB Sweets', name: 'Lakshmi Agencies' },
  { id: 'd9', logo: './brand-logos/Eastern.png', title: 'Eastern Masala', name: 'Venkateswara Traders' },
  { id: 'd10', logo: './brand-logos/Madhur.png', title: 'Madhur Sugar', name: 'Nandi Distributors' },
  { id: 'd11', logo: './brand-logos/Cycle.png', title: 'Cycle Agarbatti', name: 'Godavari Agencies' },
];

export const DIST_CATEGORIES: HomeCategory[] = [
  { id: 'c1', name: 'Cooking Oils & Ghee', image: './distributor-category-images/Oil & Ghee.png' },
  { id: 'c2', name: 'Rice & Rice Products', image: './distributor-category-images/Rice and Rice Products.png' },
  { id: 'c3', name: 'Atta, Flours & Sooji', image: './distributor-category-images/Atta, Flours and Sooji.png' },
  { id: 'c4', name: 'Dals & Pulses', image: './distributor-category-images/Dals and Pulses.png' },
  { id: 'c5', name: 'Masala & Seasoning', image: './distributor-category-images/Masala & Seasoning.png' },
  { id: 'c6', name: 'Snacks & Namkeen', image: './distributor-category-images/Snacks and Namkeen.png' },
  { id: 'c7', name: 'Beverages', image: './distributor-category-images/Beverages.png' },
  { id: 'c8', name: 'Dairy & Cheese', image: './distributor-category-images/Dairy and Cheese.png' },
];

export const BRANDS: HomeBrand[] = [
  { id: 'b1', name: 'Freedom', logo: './brand-logos/Freedon Oil.png' },
  { id: 'b2', name: 'Aashirvaad', logo: './brand-logos/Aashirvaad.png' },
  { id: 'b3', name: 'Cycle', logo: './brand-logos/Cycle.png' },
  { id: 'b4', name: 'Tata', logo: './brand-logos/Tata.png' },
  { id: 'b5', name: 'MTR', logo: './brand-logos/MTR.png' },
  { id: 'b6', name: 'GRB', logo: './brand-logos/GRB.png' },
  { id: 'b7', name: 'Priya Gold', logo: './brand-logos/Priya Gold.png' },
  { id: 'b8', name: 'Vicco', logo: './brand-logos/Vicco.png' },
  { id: 'b9', name: 'Himalaya', logo: './brand-logos/Himalaya.png' },
  { id: 'b10', name: 'Eastern', logo: './brand-logos/Eastern.png' },
  { id: 'b11', name: 'Madhur', logo: './brand-logos/Madhur.png' },
  { id: 'b12', name: 'Gokul', logo: './brand-logos/Gokul.png' },
  { id: 'b13', name: 'Mysore Sandal', logo: './brand-logos/Mysore Sandal.png' },
  { id: 'b14', name: 'Red Label', logo: './brand-logos/Red Label.png' },
];

// Level-1 category tiles shown at the top of the Wholesaler feed.
/* The wholesale catalogue hangs off two level-1 groups. Each one opens its
   own screen listing the categories underneath it — they are separate trades,
   and a buyer restocking shampoo isn't looking through rice. */
export type WholesalerL1 = 'Groceries' | 'FMCG';
export interface WholesalerCategory extends HomeCategory {
  l1: WholesalerL1;
}

export const WHOLESALER_L1: (HomeCategory & { l1: WholesalerL1 })[] = [
  { id: 'l1-groceries', name: 'Groceries', image: './home-category-cards/groceries.png', l1: 'Groceries' },
  { id: 'l1-fmcg', name: 'FMCG', image: './home-category-cards/fmcg.png', l1: 'FMCG' },
];

/* An exclusive offer is artwork, the way a hero banner is — a promotion is
   something a brand designs, not a headline the app sets in its own type.
   `label` is what a screen reader reads and never appears on screen; `brand`
   is what the tap filters the wholesale list by, so it has to match a brand
   the catalogue actually carries. */
export interface HomeOffer {
  id: string;
  image: string;
  label: string;
  brand: string;
}

/* Exclusive-offer promo cards (Wholesaler feed). Eight of them, so the rail
   runs well past the edge of the screen and reads as something to scroll —
   three tiles barely filled the width and looked like the whole list. Each
   brand here carries wholesale stock, so no banner opens an empty list. */
export const WHOLESALER_OFFERS: HomeOffer[] = [
  { id: 'o1', image: './offer-banners/tata-30.svg', label: 'Tata — up to 30% off premium staples', brand: 'Tata' },
  { id: 'o2', image: './offer-banners/surf-excel-150.svg', label: 'Surf Excel — save ₹150 on every case', brand: 'Surf Excel' },
  { id: 'o3', image: './offer-banners/aashirvaad-25.svg', label: 'Aashirvaad — 25% off whole wheat atta', brand: 'Aashirvaad' },
  { id: 'o4', image: './offer-banners/freedom-25.svg', label: 'Freedom — extra ₹25 off per 15 L tin', brand: 'Freedom' },
  { id: 'o5', image: './offer-banners/red-label-bogo.svg', label: 'Red Label — buy 10 cases, get 1 free', brand: 'Red Label' },
  { id: 'o6', image: './offer-banners/grb-18.svg', label: 'GRB — flat 18% off pure cow ghee', brand: 'GRB' },
  { id: 'o7', image: './offer-banners/maggi-12.svg', label: 'Maggi — flat 12% off cases of 24', brand: 'Maggi' },
  { id: 'o8', image: './offer-banners/madhur-200.svg', label: 'Madhur — save ₹200 on bulk sugar', brand: 'Madhur' },
];

export const WHOLESALER_CATEGORIES: WholesalerCategory[] = [
  { id: 'w1', l1: 'Groceries', name: 'Cooking Oils & Ghee', image: './wholesaler-category-images/Cooking Oils & Ghee.png' },
  { id: 'w2', l1: 'Groceries', name: 'Rice & Rice Products', image: './wholesaler-category-images/Rice & Rice Products.png' },
  { id: 'w3', l1: 'Groceries', name: 'Dals & Pulses', image: './wholesaler-category-images/Dals & Pulses.png' },
  { id: 'w4', l1: 'Groceries', name: 'Sugar & Spices', image: './wholesaler-category-images/Sugar & Spices.png' },
  { id: 'w5', l1: 'Groceries', name: 'Dry Fruits', image: './wholesaler-category-images/Dry Fruits.png' },
  { id: 'w6', l1: 'FMCG', name: 'Beverages', image: './wholesaler-category-images/Beverages.png' },
  { id: 'w7', l1: 'FMCG', name: 'Snacks & Namkeen', image: './wholesaler-category-images/Biscuits, Snacks & Namkeen.png' },
  { id: 'w8', l1: 'FMCG', name: 'Personal Care', image: './wholesaler-category-images/Personal Care.png' },
  { id: 'w9', l1: 'FMCG', name: 'Cleaning & Household', image: './wholesaler-category-images/Cleaning & Household.png' },
];

/** The categories under one level-1 group — what its own screen lists. */
export const wholesalerCategoriesIn = (l1: WholesalerL1) =>
  WHOLESALER_CATEGORIES.filter((c) => c.l1 === l1);
