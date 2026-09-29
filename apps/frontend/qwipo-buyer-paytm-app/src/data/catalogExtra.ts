import type { Product } from './products';
import type { WholesalerProduct } from './wholesaler';

/* Catalogue depth for search.

   The hand-written fixtures above cover one SKU per idea — one oil, two dals —
   which is enough to lay out a screen and nowhere near enough to exercise a
   search box. A retailer typing "oil" expects a wall of results across a dozen
   brands, not one pouch, and the interesting cases (ranking, "dal" not
   matching "Sandal", a SKU carried by both channels) only appear at volume.

   So these are generated from a table rather than written out: brand, what it
   is, and what it costs. Everything else — pack sizes, seller, delivery, the
   wholesale twin — follows from the kind of thing it is. They are ordinary
   catalogue entries once built: they list, they add to the cart, they open a
   selling-units sheet.

   Every SKU here except the jowar pair is carried by BOTH channels, so a
   search shows a distributor card and a wholesaler card for the same thing —
   which is the pairing the results list is built around. */

type Row = [brand: string, what: string, price: number, mrp: number];

// ── Cooking oils. Forty of them across eight brands, plus Freedom's sunflower
// oil in the hand-written set, so "oil" lands on forty-one SKUs.
const OILS: Row[] = [
  ['Freedom', 'Groundnut Oil', 198, 225],
  ['Freedom', 'Rice Bran Oil', 172, 195],
  ['Freedom', 'Kachi Ghani Mustard Oil', 188, 210],
  ['Freedom', 'Gingelly Oil', 245, 275],
  ['Freedom', 'Soyabean Oil', 152, 172],
  ['Freedom', 'Palmolein Oil', 138, 158],
  ['Freedom', 'Coconut Oil', 310, 345],
  ['Freedom', 'Olive Pomace Oil', 540, 605],
  ['Freedom', 'Cottonseed Oil', 162, 184],
  ['Freedom', 'Blended Vegetable Oil', 146, 166],
  ['Freedom', 'Vanaspati Oil', 132, 150],
  ['Freedom', 'Filtered Groundnut Oil', 212, 240],
  ['Fortune', 'Refined Sunflower Oil', 168, 190],
  ['Fortune', 'Soyabean Oil', 149, 168],
  ['Fortune', 'Kachi Ghani Mustard Oil', 185, 208],
  ['Fortune', 'Rice Bran Oil', 175, 198],
  ['Fortune', 'Groundnut Oil', 204, 230],
  ['Fortune', 'Xpert Total Balance Oil', 192, 218],
  ['Gold Winner', 'Refined Sunflower Oil', 164, 186],
  ['Gold Winner', 'Rice Bran Oil', 170, 192],
  ['Gold Winner', 'Groundnut Oil', 196, 222],
  ['Gold Winner', 'Blended Oil', 144, 164],
  ['Sunpure', 'Refined Sunflower Oil', 161, 182],
  ['Sunpure', 'Rice Bran Oil', 167, 189],
  ['Sunpure', 'Groundnut Oil', 194, 219],
  ['Sunpure', 'Mustard Oil', 179, 202],
  ['Dhara', 'Kachi Ghani Mustard Oil', 190, 214],
  ['Dhara', 'Refined Sunflower Oil', 166, 188],
  ['Dhara', 'Groundnut Oil', 200, 226],
  ['Dhara', 'Rice Bran Oil', 173, 196],
  ['Saffola', 'Gold Oil', 215, 242],
  ['Saffola', 'Active Oil', 205, 231],
  ['Saffola', 'Tasty Oil', 188, 212],
  ['Saffola', 'Total Oil', 268, 300],
  ['Gemini', 'Refined Sunflower Oil', 158, 179],
  ['Gemini', 'Groundnut Oil', 191, 216],
  ['Gemini', 'Rice Bran Oil', 165, 187],
  ['Value Choice', 'Refined Sunflower Oil', 142, 165],
  ['Value Choice', 'Palmolein Oil', 124, 145],
  ['Value Choice', 'Mustard Oil', 158, 180],
];

// ── Dals. Twenty-eight here plus the two hand-written toor dals makes thirty,
// which is what "dal" should find — and seven of them are toor dal.
const DALS: Row[] = [
  ['Fortune', 'Toor Dal', 152, 172],
  ['Aashirvaad', 'Toor Dal', 158, 178],
  ['Value Choice', 'Toor Dal', 138, 158],
  ['Rajdhani', 'Toor Dal', 149, 169],
  ['Natureland', 'Toor Dal', 168, 190],
  ['Tata Sampann', 'Moong Dal', 142, 162],
  ['Fortune', 'Moong Dal', 136, 155],
  ['Aashirvaad', 'Moong Dal', 139, 158],
  ['Value Choice', 'Moong Dal', 126, 145],
  ['Rajdhani', 'Moong Dal', 133, 152],
  ['Tata Sampann', 'Urad Dal', 155, 176],
  ['Fortune', 'Urad Dal', 148, 168],
  ['Aashirvaad', 'Urad Dal', 151, 172],
  ['Value Choice', 'Urad Dal', 134, 154],
  ['Rajdhani', 'Urad Dal', 145, 165],
  ['Tata Sampann', 'Chana Dal', 118, 135],
  ['Fortune', 'Chana Dal', 112, 128],
  ['Aashirvaad', 'Chana Dal', 115, 132],
  ['Value Choice', 'Chana Dal', 104, 120],
  ['Rajdhani', 'Chana Dal', 110, 126],
  ['Tata Sampann', 'Masoor Dal', 128, 146],
  ['Fortune', 'Masoor Dal', 122, 140],
  ['Aashirvaad', 'Masoor Dal', 125, 143],
  ['Value Choice', 'Masoor Dal', 114, 131],
  ['Madhur', 'Arhar Dal', 154, 175],
  ['Gemini', 'Chana Dal', 109, 125],
  ['Natureland', 'Masoor Dal', 137, 156],
  ['Rajdhani', 'Moth Dal', 131, 150],
];

// ── Personal care. Here so a misspelt "shampo" has something to correct to.
const SHAMPOOS: Row[] = [
  ['Clinic Plus', 'Shampoo', 88, 102],
  ['Head & Shoulders', 'Shampoo', 165, 188],
  ['Chik', 'Shampoo', 72, 84],
];

// ── White-label staples, so a search on the product rather than the brand has
// something to rank.
const RICE: Row[] = [
  ['Value Choice', 'Sona Masoori Rice', 2280, 2560],
  ['Value Choice', 'Idli Rice', 1980, 2240],
];

/* Distributor-only, with no wholesale twin — the case where a SKU shows up as
   one card rather than a pair. */
const JOWAR: Row[] = [
  ['Value Choice', 'Jowar Flour', 78, 92],
  ['Sri Lalitha', 'Jowar Atta', 84, 98],
];

const SELLERS = [
  'Sri Sai Krishna Traders',
  'Omkar Enterprises',
  'Annapurna Traders',
  'Balaji Distributors',
  'Vijaya Traders',
  'Sri Krishna Agencies',
];

interface Kind {
  category: string;
  image: string;
  /** Pack the name is listed at, and the pieces in a case. */
  pack: string;
  caseSize: number;
  variants: { id: string; label: string }[];
}

const OIL_KIND: Kind = {
  category: 'Cooking Oils & Ghee',
  image: '🛢️',
  pack: '1 L Pouch',
  caseSize: 12,
  variants: [
    { id: '1l-pouch', label: '1 L Pouch' },
    { id: '1l-bottle', label: '1 L Bottle' },
    { id: '5l', label: '5 L Can' },
    { id: '15l', label: '15 L Tin' },
  ],
};
const DAL_KIND: Kind = {
  category: 'Dals & Pulses',
  image: '🫘',
  pack: '1 kg Pack',
  caseSize: 12,
  variants: [
    { id: '500g', label: '500 g' },
    { id: '1kg', label: '1 kg' },
    { id: '5kg', label: '5 kg' },
  ],
};
const SHAMPOO_KIND: Kind = {
  category: 'Personal Care',
  image: '🧴',
  pack: '180 ml Bottle',
  caseSize: 24,
  variants: [
    { id: '90ml', label: '90 ml' },
    { id: '180ml', label: '180 ml' },
    { id: '340ml', label: '340 ml' },
  ],
};
const RICE_KIND: Kind = {
  category: 'Rice & Rice Products',
  image: '🍚',
  pack: '26 kg Bag',
  caseSize: 1,
  variants: [
    { id: '10kg', label: '10 kg' },
    { id: '26kg', label: '26 kg' },
  ],
};
const FLOUR_KIND: Kind = {
  category: 'Atta, Flours & Sooji',
  image: '🌾',
  pack: '1 kg Pack',
  caseSize: 10,
  variants: [
    { id: '500g', label: '500 g' },
    { id: '1kg', label: '1 kg' },
  ],
};

const MARGINS = ['9% Net Margin', '11% Net Margin', '12% Net Margin', '14% Net Margin', '16% Net Margin'];

const GROUPS: { rows: Row[]; kind: Kind }[] = [
  { rows: OILS, kind: OIL_KIND },
  { rows: DALS, kind: DAL_KIND },
  { rows: SHAMPOOS, kind: SHAMPOO_KIND },
  { rows: RICE, kind: RICE_KIND },
  { rows: JOWAR, kind: FLOUR_KIND },
];

let n = 0;
const built: { product: Product; twin: boolean }[] = [];
for (const { rows, kind } of GROUPS) {
  const paired = rows !== JOWAR;
  for (const [brand, what, price, mrp] of rows) {
    n += 1;
    const seller = SELLERS[n % SELLERS.length];
    built.push({
      twin: paired,
      product: {
        id: `p${100 + n}`,
        name: `${brand} ${what} - ${kind.pack} X ${kind.caseSize} Nos`,
        shortName: `${brand} ${what}`,
        category: kind.category,
        caseLabel: `Case: ${kind.caseSize} pc`,
        caseSize: kind.caseSize,
        image: kind.image,
        variants: kind.variants,
        seller,
        source: 'distributor',
        delivery: 'Free Delivery',
        margin: MARGINS[n % MARGINS.length],
        price,
        mrp,
        deliveryDay: n % 2 ? 'Fri (Beat day)' : 'Tomorrow',
        mov: 2000,
      },
    });
  }
}

export const EXTRA_PRODUCTS: Product[] = built.map((b) => b.product);

const VENDORS = [
  { id: 'omkar', name: 'Omkar Enterprises', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
  { id: 'balaji', name: 'Balaji Traders', delivery: 'Delivery by Friday', fee: 'Free' },
  { id: 'vasudha', name: 'Vasudha Wholesalers', delivery: 'Delivery by Wednesday', fee: '₹2/kg' },
];

/* The wholesale twin of each paired SKU. It carries the short name — the same
   name the distributor SKU is listed under before its pack suffix — which is
   what lets the two be shown as one thing bought two ways. */
export const EXTRA_WHOLESALE: WholesalerProduct[] = built
  .filter((b) => b.twin)
  .map(({ product }, i) => ({
    id: `wp${100 + i}`,
    name: product.shortName,
    category: product.category,
    brand: product.shortName.split(' ')[0],
    caseLabel: product.caseLabel,
    caseSize: product.caseSize,
    image: product.image,
    variants: product.variants,
    vendors: [VENDORS[i % 3], VENDORS[(i + 1) % 3]].map((v, k) => ({
      ...v,
      // Wholesale undercuts the distributor, the second vendor by less.
      price: Math.round(product.price * (k === 0 ? 0.94 : 0.97)),
      mrp: product.mrp,
      margin: MARGINS[(i + k) % MARGINS.length],
    })),
  }));
