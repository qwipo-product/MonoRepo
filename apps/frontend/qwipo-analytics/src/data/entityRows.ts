// Entity-grain rows for attention drill-downs (outlets, brands).

export interface EntityRow {
  name: string;
  sub: string;
  mid: string;
  right: string;
  rightSub?: string;
  tone?: 'error' | 'warning';
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
