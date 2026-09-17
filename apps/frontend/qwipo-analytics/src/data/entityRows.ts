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
