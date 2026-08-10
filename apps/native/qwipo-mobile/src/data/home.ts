// Mock home-feed data for the RN prototype. Emoji/initials stand in for the web
// build's image assets so the app runs with no asset pipeline.

export interface Distributor {
  id: string;
  title: string;
  short: string;
}
export interface Category {
  id: string;
  name: string;
  emoji: string;
}
export interface Brand {
  id: string;
  name: string;
}

export const DISTRIBUTORS: Distributor[] = [
  { id: 'd1', title: 'Freedom Oil', short: 'SSKT' },
  { id: 'd2', title: 'Aashirvaad Atta', short: 'Balaji' },
  { id: 'd3', title: 'Sona Masoori Rice', short: 'Annapurna' },
  { id: 'd4', title: 'Cow Ghee', short: 'Sri Krishna' },
  { id: 'd5', title: 'MTR Masala', short: 'Omkar' },
];

export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Cooking Oils & Ghee', emoji: '🛢️' },
  { id: 'c2', name: 'Rice & Rice Products', emoji: '🌾' },
  { id: 'c3', name: 'Atta, Flours & Sooji', emoji: '🥖' },
  { id: 'c4', name: 'Dals & Pulses', emoji: '🫘' },
  { id: 'c5', name: 'Masala & Seasoning', emoji: '🌶️' },
  { id: 'c6', name: 'Snacks & Namkeen', emoji: '🍜' },
  { id: 'c7', name: 'Beverages', emoji: '🍵' },
  { id: 'c8', name: 'Dairy & Cheese', emoji: '🧀' },
];

export const BRANDS: Brand[] = [
  { id: 'b1', name: 'Freedom' },
  { id: 'b2', name: 'Aashirvaad' },
  { id: 'b3', name: 'Tata' },
  { id: 'b4', name: 'MTR' },
  { id: 'b5', name: 'GRB' },
  { id: 'b6', name: 'Priya Gold' },
  { id: 'b7', name: 'Red Label' },
  { id: 'b8', name: 'Himalaya' },
];
