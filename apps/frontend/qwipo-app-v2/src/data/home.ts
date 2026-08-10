// Home feed data — references the real assets copied into public/.
// (A production build would read @mockups/mock-data; inlined here to keep v2
// self-contained, matching screenshot 7.)

export interface Distributor {
  id: string;
  logo: string;
  title: string;
  short: string;
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
  '/distributor-banners/Banner1.png',
  '/distributor-banners/Banner2.png',
  '/distributor-banners/Banner3.png',
  '/distributor-banners/Banner4.png',
];

export const DISTRIBUTORS: Distributor[] = [
  { id: 'd1', logo: '/brand-logos/Freedon Oil.png', title: 'Freedom Oil', short: 'SSKT' },
  { id: 'd2', logo: '/brand-logos/Aashirvaad.png', title: 'Aashirvaad Atta', short: 'Balaji' },
  { id: 'd3', logo: '/brand-logos/Sri Lalitha.png', title: 'Sona Masoori Rice', short: 'Annapurna' },
  { id: 'd4', logo: '/brand-logos/Cow.png', title: 'Cow Ghee', short: 'Sri Krishna' },
  { id: 'd5', logo: '/brand-logos/MTR.png', title: 'MTR Masala', short: 'Omkar' },
  { id: 'd6', logo: '/brand-logos/Double Horse.png', title: 'Double Horse', short: 'Vijaya' },
];

export const DIST_CATEGORIES: HomeCategory[] = [
  { id: 'c1', name: 'Cooking Oils & Ghee', image: '/distributor-category-images/Oil & Ghee.png' },
  { id: 'c2', name: 'Rice & Rice Products', image: '/distributor-category-images/Rice and Rice Products.png' },
  { id: 'c3', name: 'Atta, Flours & Sooji', image: '/distributor-category-images/Atta, Flours and Sooji.png' },
  { id: 'c4', name: 'Dals & Pulses', image: '/distributor-category-images/Dals and Pulses.png' },
  { id: 'c5', name: 'Masala & Seasoning', image: '/distributor-category-images/Masala & Seasoning.png' },
  { id: 'c6', name: 'Snacks & Namkeen', image: '/distributor-category-images/Snacks and Namkeen.png' },
  { id: 'c7', name: 'Beverages', image: '/distributor-category-images/Beverages.png' },
  { id: 'c8', name: 'Dairy & Cheese', image: '/distributor-category-images/Dairy and Cheese.png' },
];

export const BRANDS: HomeBrand[] = [
  { id: 'b1', name: 'Freedom', logo: '/brand-logos/Freedon Oil.png' },
  { id: 'b2', name: 'Aashirvaad', logo: '/brand-logos/Aashirvaad.png' },
  { id: 'b3', name: 'Cycle', logo: '/brand-logos/Cycle.png' },
  { id: 'b4', name: 'Tata', logo: '/brand-logos/Tata.png' },
  { id: 'b5', name: 'MTR', logo: '/brand-logos/MTR.png' },
  { id: 'b6', name: 'GRB', logo: '/brand-logos/GRB.png' },
  { id: 'b7', name: 'Priya Gold', logo: '/brand-logos/Priya Gold.png' },
  { id: 'b8', name: 'Vicco', logo: '/brand-logos/Vicco.png' },
  { id: 'b9', name: 'Himalaya', logo: '/brand-logos/Himalaya.png' },
  { id: 'b10', name: 'Eastern', logo: '/brand-logos/Eastern.png' },
  { id: 'b11', name: 'Madhur', logo: '/brand-logos/Madhur.png' },
  { id: 'b12', name: 'Gokul', logo: '/brand-logos/Gokul.png' },
  { id: 'b13', name: 'Mysore Sandal', logo: '/brand-logos/Mysore Sandal.png' },
  { id: 'b14', name: 'Red Label', logo: '/brand-logos/Red Label.png' },
];

// Level-1 category tiles shown at the top of the Wholesaler feed.
export const WHOLESALER_L1: HomeCategory[] = [
  { id: 'l1-groceries', name: 'Groceries', image: '/home-category-cards/groceries.png' },
  { id: 'l1-fmcg', name: 'FMCG', image: '/home-category-cards/fmcg.png' },
];

export interface HomeOffer {
  id: string;
  headline: string;
  brand: string;
  sub: string;
  emoji: string;
  tone: 'primary' | 'success' | 'warning';
}

// Exclusive-offer promo cards (Wholesaler feed).
export const WHOLESALER_OFFERS: HomeOffer[] = [
  { id: 'o1', headline: 'UP TO 30% OFF', brand: 'Tata Sampann', sub: 'Premium Quality Staples', emoji: '🌾', tone: 'warning' },
  { id: 'o2', headline: 'SAVE ₹150', brand: 'Surf Excel', sub: 'Stain-Free Clean', emoji: '🧼', tone: 'primary' },
  { id: 'o3', headline: '25% OFF', brand: 'Aashirvaad', sub: 'Whole Wheat Atta', emoji: '🌾', tone: 'success' },
];

export const WHOLESALER_CATEGORIES: HomeCategory[] = [
  { id: 'w1', name: 'Cooking Oils & Ghee', image: '/wholesaler-category-images/Cooking Oils & Ghee.png' },
  { id: 'w2', name: 'Rice & Rice Products', image: '/wholesaler-category-images/Rice & Rice Products.png' },
  { id: 'w3', name: 'Dals & Pulses', image: '/wholesaler-category-images/Dals & Pulses.png' },
  { id: 'w4', name: 'Sugar & Spices', image: '/wholesaler-category-images/Sugar & Spices.png' },
  { id: 'w5', name: 'Dry Fruits', image: '/wholesaler-category-images/Dry Fruits.png' },
  { id: 'w6', name: 'Beverages', image: '/wholesaler-category-images/Beverages.png' },
];
