// Entity-grain rows for attention drill-downs (outlets, brands).

export interface EntityRow {
  name: string;
  sub: string;
  mid?: string;
  right: string;
  rightSub?: string;
  tone?: 'error' | 'warning';
  /** slice keys for drawer quick filters (funnel stage, onboarding week…) */
  tags?: string[];
  /** numeric value + change, when present the drawer offers sorting */
  v?: number;
  delta?: number;
}

/** 148 high-value outlets gone quiet — first page. */
export const quietOutlets: EntityRow[] = [
  { name: 'Balaji Grand Bazar', sub: 'Hyderabad · Kukatpally', mid: 'Last order 4 Aug · 18d', right: '₹48,200', rightSub: '30-day value', tone: 'error' },
  { name: 'Sri Manikanta Super Market', sub: 'Hyderabad · Ameerpet', mid: 'Last order 6 Aug · 16d', right: '₹36,900', rightSub: '30-day value', tone: 'error' },
  { name: 'Om Sai Provision Stores', sub: 'Secunderabad', mid: 'Last order 7 Aug · 15d', right: '₹29,750', rightSub: '30-day value', tone: 'error' },
  { name: 'New Bharat Kirana', sub: 'Warangal', mid: 'Last order 5 Aug · 17d', right: '₹27,400', rightSub: '30-day value', tone: 'error' },
  { name: 'Jai Bhavani Kirana', sub: 'Warangal', mid: 'Last order 8 Aug · 14d', right: '₹24,100', rightSub: '30-day value' },
  { name: 'Corner Mart', sub: 'Nizamabad', mid: 'Last order 8 Aug · 14d', right: '₹22,800', rightSub: '30-day value' },
  { name: 'Sri Lakshmi Ganapathi Stores', sub: 'Hyderabad · LB Nagar', mid: 'Last order 7 Aug · 15d', right: '₹21,300', rightSub: '30-day value' },
  { name: 'Ambika Traders', sub: 'Karimnagar', mid: 'Last order 6 Aug · 16d', right: '₹19,650', rightSub: '30-day value' },
  { name: 'Vijayalakshmi Vegetable & Kirana', sub: 'Sangareddy', mid: 'Last order 8 Aug · 14d', right: '₹18,200', rightSub: '30-day value' },
  { name: 'Sri Anjaneya Traders', sub: 'Hyderabad · Uppal', mid: 'Last order 5 Aug · 17d', right: '₹17,900', rightSub: '30-day value' },
  { name: 'Rupa Kirana and General Store', sub: 'Secunderabad', mid: 'Last order 8 Aug · 14d', right: '₹16,400', rightSub: '30-day value' },
  { name: 'Jyothi Kirana & General Store', sub: 'Hyderabad · Dilsukhnagar', mid: 'Last order 7 Aug · 15d', right: '₹15,850', rightSub: '30-day value' },
];

/** 3 brands declining over 10% (and the SKUs dragging them). */
export const decliningBrands: EntityRow[] = [
  { name: 'Britannia', sub: 'Company: Britannia', mid: 'Dragging: Good Day 100g · Marie Gold 250g', right: '₹3.8L', rightSub: '↓ 14% · −₹0.6L', tone: 'error' },
  { name: 'Red Label', sub: 'Company: HUL', mid: 'Dragging: Red Label 500g · Natural Care 250g', right: '₹1.9L', rightSub: '↓ 11% · −₹0.23L', tone: 'error' },
  { name: 'Parle-G', sub: 'Company: Parle', mid: 'Dragging: Parle-G 800g', right: '₹2.9L', rightSub: '↓ 6% · −₹0.2L', tone: 'warning' },
];


/** Outlets onboarded this period — funnel drill-down (210 total, first page). */
export const funnelOutlets: EntityRow[] = [
  { name: 'Sri Devi Kirana & General', sub: 'Hyderabad · Kukatpally', mid: '6 orders', right: '2 Aug', rightSub: 'Qualified', tags: ['ordered', 'repeat', 'qualified', 'w1'] },
  { name: 'Manjunatha Provision Stores', sub: 'Secunderabad', mid: '4 orders', right: '4 Aug', rightSub: 'Qualified', tags: ['ordered', 'repeat', 'qualified', 'w1'] },
  { name: 'Sai Ram Super Bazar', sub: 'Hyderabad · LB Nagar', mid: '3 orders', right: '9 Aug', rightSub: 'Qualified', tags: ['ordered', 'repeat', 'qualified', 'w2'] },
  { name: 'Bhavani Kirana Stores', sub: 'Warangal', mid: '3 orders · below ₹300 avg', right: '3 Aug', rightSub: 'Repeat', tags: ['ordered', 'repeat', 'w1'] },
  { name: 'Sri Laxmi Traders', sub: 'Nizamabad', mid: '2 orders', right: '10 Aug', rightSub: 'Repeat', tags: ['ordered', 'repeat', 'w2'] },
  { name: 'Venkata Sai Kirana', sub: 'Karimnagar', mid: '2 orders', right: '16 Aug', rightSub: 'Repeat', tags: ['ordered', 'repeat', 'w3'] },
  { name: 'New Style Super Market', sub: 'Hyderabad · Uppal', mid: '1 order', right: '6 Aug', rightSub: 'Ordered once', tags: ['ordered', 'w1'] },
  { name: 'Ganesh Kirana & General', sub: 'Secunderabad', mid: '1 order', right: '11 Aug', rightSub: 'Ordered once', tags: ['ordered', 'w2'] },
  { name: 'Padmavathi Stores', sub: 'Sangareddy', mid: '1 order', right: '17 Aug', rightSub: 'Ordered once', tags: ['ordered', 'w3'] },
  { name: 'Sri Balaji Kiranam', sub: 'Hyderabad · Dilsukhnagar', mid: 'No order yet · 17d', right: '5 Aug', rightSub: 'Silent', tone: 'error', tags: ['silent', 'w1'] },
  { name: 'Anjali General Stores', sub: 'Warangal', mid: 'No order yet · 14d', right: '8 Aug', rightSub: 'Silent', tone: 'error', tags: ['silent', 'w2'] },
  { name: 'Krishna Kirana Point', sub: 'Hyderabad · Kompally', mid: 'No order yet · 8d', right: '14 Aug', rightSub: 'Silent', tone: 'warning', tags: ['silent', 'w2'] },
  { name: 'Mahalakshmi Provision', sub: 'Nizamabad', mid: 'No order yet · 4d', right: '18 Aug', rightSub: 'Silent', tone: 'warning', tags: ['silent', 'w3'] },
  { name: 'Surya Kirana Stores', sub: 'Karimnagar', mid: 'No order yet · today', right: '22 Aug', rightSub: 'Silent', tone: 'warning', tags: ['silent', 'w4'] },
];


/** Full per-dimension rankings for the dimension drawers — no "N others" rows. */
export const dimensionFullRows: Record<string, { name: string; value: number; change: number }[]> = {
  distributor: [
    { name: 'Sri Balaji Agencies', value: 7.9, change: 21 }, { name: 'S R Enterprises', value: 5.6, change: 8 },
    { name: 'Vijaya Distributors', value: 4.4, change: -9 }, { name: 'Annapurna Traders', value: 3.9, change: 4 },
    { name: 'Lakshmi Agencies', value: 3.1, change: 1 }, { name: 'Sai Krishna Agencies', value: 2.9, change: 6 },
    { name: 'Sri Venkateswara Agencies', value: 1.4, change: 7 }, { name: 'Balaji Traders', value: 1.3, change: 3 },
    { name: 'Om Sri Distributors', value: 1.2, change: -2 }, { name: 'Hanuman Agencies', value: 1.1, change: 5 },
    { name: 'Sri Raghavendra Traders', value: 1.0, change: 9 }, { name: 'Krishna Enterprises', value: 0.9, change: 2 },
    { name: 'Durga Agencies', value: 0.9, change: -4 }, { name: 'Sri Sai Distributors', value: 0.8, change: 11 },
    { name: 'Manikanta Agencies', value: 0.7, change: 6 }, { name: 'Vasavi Traders', value: 0.6, change: 1 },
    { name: 'Padmavati Enterprises', value: 0.5, change: -1 }, { name: 'Govinda Agencies', value: 0.4, change: 14 },
  ],
  city: [
    { name: 'Hyderabad', value: 16.2, change: 12 }, { name: 'Secunderabad', value: 7.7, change: 9 },
    { name: 'Warangal', value: 5.5, change: -6 }, { name: 'Nizamabad', value: 4.1, change: 3 },
    { name: 'Karimnagar', value: 2.9, change: 5 }, { name: 'Sangareddy', value: 2.2, change: 2 },
  ],
  company: [
    { name: 'Fortune (AWL)', value: 11.4, change: 18 }, { name: 'ITC', value: 9.1, change: 9 },
    { name: 'HUL', value: 7.3, change: 6 }, { name: 'Parle', value: 4.6, change: 1 },
    { name: 'Britannia', value: 3.8, change: -14 }, { name: 'Unmapped lines', value: 2.4, change: 0 },
  ],
  category: [
    { name: 'Edible oils', value: 12.1, change: 17 }, { name: 'Atta & staples', value: 7.4, change: 8 },
    { name: 'Biscuits', value: 4.1, change: -11 }, { name: 'Detergents', value: 3.9, change: 6 },
    { name: 'Beverages', value: 3.2, change: 4 }, { name: 'Snacks & namkeen', value: 1.2, change: 6 },
    { name: 'Personal care', value: 1.0, change: 3 }, { name: 'Dairy', value: 0.9, change: 8 },
    { name: 'Spices & masala', value: 0.8, change: 2 }, { name: 'Rice & grains', value: 0.7, change: -3 },
    { name: 'Cleaning', value: 0.5, change: 5 }, { name: 'Confectionery', value: 0.4, change: 1 },
  ],
  brand: [
    { name: 'Fortune Oil', value: 11.4, change: 18 }, { name: 'Aashirvaad', value: 5.3, change: 9 },
    { name: 'Sunfeast', value: 3.8, change: -4 }, { name: 'Surf Excel', value: 3.1, change: 6 },
    { name: 'Parle-G', value: 2.9, change: -6 }, { name: 'Tata Salt', value: 1.1, change: 4 },
    { name: 'Red Label', value: 1.0, change: -11 }, { name: 'Maggi', value: 0.95, change: 7 },
    { name: 'Colgate', value: 0.9, change: 3 }, { name: 'Clinic Plus', value: 0.85, change: 5 },
    { name: 'Good Day', value: 0.8, change: -8 }, { name: 'Lifebuoy', value: 0.75, change: 2 },
    { name: 'Everest', value: 0.7, change: 6 }, { name: 'MDH', value: 0.65, change: 4 },
    { name: 'Vim', value: 0.6, change: 1 },
  ],
  sku: [
    { name: 'Fortune Sunflower 1L×12', value: 2.41, change: 19 }, { name: 'Aashirvaad Atta 5kg', value: 2.06, change: 8 },
    { name: 'Surf Excel 1kg', value: 1.38, change: 7 }, { name: 'Parle-G 800g', value: 0.92, change: -5 },
    { name: 'Sunfeast Dark Fantasy', value: 0.71, change: -9 }, { name: 'Tata Salt 1kg', value: 0.62, change: 4 },
    { name: 'Maggi 560g×12', value: 0.58, change: 8 }, { name: 'Red Label 500g', value: 0.55, change: -12 },
    { name: 'Fortune Sunflower 5L', value: 0.52, change: 15 }, { name: 'Clinic Plus 340ml', value: 0.48, change: 5 },
    { name: 'Colgate 200g', value: 0.45, change: 3 }, { name: 'Good Day 100g×24', value: 0.41, change: -7 },
    { name: 'Aashirvaad Atta 10kg', value: 0.38, change: 9 }, { name: 'Lifebuoy 125g×4', value: 0.34, change: 2 },
    { name: 'Everest Chilli 100g', value: 0.31, change: 6 }, { name: 'Vim Bar 300g', value: 0.28, change: 1 },
    { name: 'Surf Excel 500g', value: 0.26, change: 4 }, { name: 'Maggi Masala-e-Magic', value: 0.24, change: 11 },
    { name: 'Parle Monaco 200g', value: 0.22, change: -2 }, { name: 'MDH Deggi Mirch 100g', value: 0.2, change: 3 },
  ],
};
