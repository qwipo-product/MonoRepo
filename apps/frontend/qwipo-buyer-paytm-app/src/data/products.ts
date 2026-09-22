import type { PackPill } from '@mockups/components';

export type Source = 'distributor' | 'wholesaler';

export interface Product {
  id: string;
  name: string;
  /** Short display name for the sheet header (brand + product, no pack). */
  shortName: string;
  /** Merchandising category — drives the "in Categories" search group. */
  category: string;
  caseLabel: string;
  /** Pieces per case — drives the pack tiers in the selling-units sheet. */
  caseSize: number;
  image: string;
  variants: PackPill[];
  seller: string;
  source: Source;
  delivery: string;
  margin: string;
  price: number;
  mrp: number;
  deliveryDay: string;
  mov: number;
}

// Inline mock data — a real build would pull these from @mockups/mock-data.
export const PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Freedom Refined Sunflower Oil - 1 L Packet X 16 Nos', shortName: 'Freedom Refined Sunflower Oil',
    category: 'Cooking Oils & Ghee', caseLabel: 'Case: 16 pc', caseSize: 16, image: '🛢️',
    variants: [{ id: '1l', label: '1 L' }, { id: '5l', label: '5 L' }, { id: '15kg', label: '15 kg' }],
    seller: 'Sri Sai Krishna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin',
    price: 165, mrp: 185, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p2', name: 'Aashirvaad Atta - 10 kg Bag X 4 Nos', shortName: 'Aashirvaad Atta',
    category: 'Atta, Flours & Sooji', caseLabel: 'Case: 4 pc', caseSize: 4, image: '🌾',
    variants: [{ id: '5kg', label: '5 kg' }, { id: '10kg', label: '10 kg' }],
    seller: 'Sri Sai Krishna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '9% Margin',
    price: 420, mrp: 465, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p3', name: 'Fortune Besan - 500 G Packet X 20 Nos', shortName: 'Fortune Besan',
    category: 'Atta, Flours & Sooji', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🫘',
    variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 kg' }],
    seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '11% Margin',
    price: 55, mrp: 62, deliveryDay: 'Tomorrow', mov: 5000,
  },
  {
    id: 'p4', name: 'Maggi 2-Minute Noodles - 280 G Packet X 24 Nos', shortName: 'Maggi 2-Minute Noodles',
    category: 'Snacks & Namkeen', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🍜',
    variants: [{ id: '280g', label: '280 g' }, { id: '560g', label: '560 g' }],
    seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '10% Margin',
    price: 57, mrp: 60, deliveryDay: 'Tomorrow', mov: 5000,
  },
  {
    id: 'p5', name: 'Mysore Sandal Soap - 150 G Carton X 72 Nos', shortName: 'Mysore Sandal Soap',
    category: 'Personal Care', caseLabel: 'Case: 72 pc', caseSize: 72, image: '🧼',
    variants: [
      { id: 's20', label: '20 g' }, { id: 's40', label: '40 g' }, { id: 's75', label: '75 g' },
      { id: 's100', label: '100 g' }, { id: 's125', label: '125 g' }, { id: 's150', label: '150 g' },
      { id: 's3x150', label: '3 × 150 g' }, { id: 's6x150', label: '6 × 150 g' },
    ],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin',
    price: 42, mrp: 48, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p6', name: 'Mysore Sandal Dhoop - 24 Sticks Box X 120 Nos', shortName: 'Mysore Sandal Dhoop',
    category: 'Personal Care', caseLabel: 'Case: 120 pc', caseSize: 120, image: '🪔',
    variants: [
      { id: 'd12', label: '12 Sticks' }, { id: 'd24', label: '24 Sticks' }, { id: 'd40', label: '40 Sticks' },
      { id: 'd80', label: '80 Sticks' }, { id: 'd100g', label: '100 g' }, { id: 'd200g', label: '200 g' },
      { id: 'dp3', label: 'Pack of 3' }, { id: 'dp6', label: 'Pack of 6' }, { id: 'dp12', label: 'Pack of 12' },
      { id: 'dcup', label: 'Cup Dhoop' },
    ],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '14% Margin',
    price: 45, mrp: 50, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p7', name: 'Mysore Sandal Talcum Powder - 100 G Bottle X 48 Nos', shortName: 'Mysore Sandal Talcum Powder',
    category: 'Personal Care', caseLabel: 'Case: 48 pc', caseSize: 48, image: '🧴',
    variants: [
      { id: 't60', label: '60 g' }, { id: 't100', label: '100 g' },
      { id: 't200', label: '200 g' }, { id: 't300', label: '300 g' },
    ],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '11% Margin',
    price: 88, mrp: 98, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p8', name: 'Close Up Red Hot Toothpaste - 150 G Tube X 36 Nos', shortName: 'Close Up Red Hot Toothpaste',
    category: 'Personal Care', caseLabel: 'Case: 36 pc', caseSize: 36, image: '🪥',
    variants: [
      { id: 'cu40', label: '40 g' }, { id: 'cu80', label: '80 g' },
      { id: 'cu120', label: '120 g' }, { id: 'cu150', label: '150 g' },
    ],
    seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '13% Margin',
    price: 48, mrp: 55, deliveryDay: 'Tomorrow', mov: 5000,
  },
  {
    id: 'p9', name: 'Dabur Red Tooth Powder - 100 G Box X 48 Nos', shortName: 'Dabur Red Tooth Powder',
    category: 'Personal Care', caseLabel: 'Case: 48 pc', caseSize: 48, image: '🦷',
    variants: [
      { id: 'dr50', label: '50 g' }, { id: 'dr100', label: '100 g' }, { id: 'dr200', label: '200 g' },
    ],
    seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '15% Margin',
    price: 62, mrp: 70, deliveryDay: 'Tomorrow', mov: 5000,
  },
  {
    id: 'p10', name: 'Red Label Tea - 250 G Pack X 40 Nos', shortName: 'Red Label Tea',
    category: 'Beverages', caseLabel: 'Case: 40 pc', caseSize: 40, image: '🍵',
    variants: [
      { id: 'rl100', label: '100 g' }, { id: 'rl250', label: '250 g' },
      { id: 'rl500', label: '500 g' }, { id: 'rl1kg', label: '1 kg' },
    ],
    seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '12% Margin',
    price: 135, mrp: 150, deliveryDay: 'Tomorrow', mov: 5000,
  },

  // ── Coverage fill: every distributor + distributor category + brand gets ≥1
  // product (each with 1–2 variants), so no storefront / category / brand page
  // is ever empty. Distributor source, Beat-day delivery.
  {
    id: 'p11', name: 'Tata Sampann Sona Masoori Rice - 26 kg Bag X 1 No', shortName: 'Tata Sampann Sona Masoori Rice',
    category: 'Rice & Rice Products', caseLabel: 'Case: 1 pc', caseSize: 1, image: '🍚',
    variants: [{ id: '5kg', label: '5 kg' }, { id: '26kg', label: '26 kg' }],
    seller: 'Annapurna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '8% Margin',
    price: 2500, mrp: 2750, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p12', name: 'Madhur Toor Dal - 1 kg Pack X 12 Nos', shortName: 'Madhur Toor Dal',
    category: 'Dals & Pulses', caseLabel: 'Case: 12 pc', caseSize: 12, image: '🫘',
    variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 kg' }],
    seller: 'Annapurna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '10% Margin',
    price: 145, mrp: 165, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p13', name: 'GRB Pure Cow Ghee - 1 L Jar X 12 Nos', shortName: 'GRB Pure Cow Ghee',
    category: 'Dairy & Cheese', caseLabel: 'Case: 12 pc', caseSize: 12, image: '🧈',
    variants: [{ id: '500ml', label: '500 ml' }, { id: '1l', label: '1 L' }],
    seller: 'Sri Krishna Agencies', source: 'distributor', delivery: 'Free Delivery', margin: '9% Margin',
    price: 3250.5, mrp: 3600, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p14', name: 'Gokul Cow Ghee - 500 ml Jar X 12 Nos', shortName: 'Gokul Cow Ghee',
    category: 'Dairy & Cheese', caseLabel: 'Case: 12 pc', caseSize: 12, image: '🧈',
    variants: [{ id: '200ml', label: '200 ml' }, { id: '500ml', label: '500 ml' }],
    seller: 'Sri Krishna Agencies', source: 'distributor', delivery: 'Free Delivery', margin: '11% Margin',
    price: 310, mrp: 350, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p15', name: 'MTR Sambar Masala - 200 g Box X 24 Nos', shortName: 'MTR Sambar Masala',
    category: 'Masala & Seasoning', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🥘',
    variants: [{ id: '100g', label: '100 g' }, { id: '200g', label: '200 g' }],
    seller: 'Balaji Distributors', source: 'distributor', delivery: 'Free Delivery', margin: '14% Margin',
    price: 92, mrp: 105, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p16', name: 'Eastern Chilli Powder - 500 g Pack X 20 Nos', shortName: 'Eastern Chilli Powder',
    category: 'Masala & Seasoning', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🌶️',
    variants: [{ id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }],
    seller: 'Balaji Distributors', source: 'distributor', delivery: 'Free Delivery', margin: '13% Margin',
    price: 165, mrp: 185, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p17', name: 'Cycle Pure Agarbatti - 3-in-1 Pack X 48 Nos', shortName: 'Cycle Pure Agarbatti',
    category: 'Personal Care', caseLabel: 'Case: 48 pc', caseSize: 48, image: '🕯️',
    variants: [{ id: 'small', label: 'Small' }, { id: 'big', label: 'Big' }],
    seller: 'Vijaya Traders', source: 'distributor', delivery: 'Free Delivery', margin: '18% Margin',
    price: 45, mrp: 55, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p18', name: 'Priya Gold Butter Bite Biscuits - 200 g Pack X 24 Nos', shortName: 'Priya Gold Butter Bite Biscuits',
    category: 'Snacks & Namkeen', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🍪',
    variants: [{ id: '75g', label: '75 g' }, { id: '200g', label: '200 g' }],
    seller: 'Vijaya Traders', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin',
    price: 35, mrp: 40, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p19', name: 'Vicco Turmeric Skin Cream - 70 g Tube X 36 Nos', shortName: 'Vicco Turmeric Skin Cream',
    category: 'Personal Care', caseLabel: 'Case: 36 pc', caseSize: 36, image: '🧴',
    variants: [{ id: '30g', label: '30 g' }, { id: '70g', label: '70 g' }],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '15% Margin',
    price: 95, mrp: 110, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p20', name: 'Himalaya Neem Face Wash - 100 ml Tube X 36 Nos', shortName: 'Himalaya Neem Face Wash',
    category: 'Personal Care', caseLabel: 'Case: 36 pc', caseSize: 36, image: '🧼',
    variants: [{ id: '50ml', label: '50 ml' }, { id: '100ml', label: '100 ml' }],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '16% Margin',
    price: 120, mrp: 140, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    // Distributor-source Beverages + Red Label brand (p10 is wholesaler-source,
    // which the distributor listing filters out — so the distributor flow needs
    // its own).
    id: 'p21', name: 'Red Label Tea - 250 g Pack X 40 Nos', shortName: 'Red Label Tea',
    category: 'Beverages', caseLabel: 'Case: 40 pc', caseSize: 40, image: '🍵',
    variants: [{ id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }],
    seller: 'Vijaya Traders', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin',
    price: 135, mrp: 150, deliveryDay: 'Fri (Beat day)', mov: 500,
  },

  // ── Tata Consumer Products (TCPL) — real SKUs from TCP's own Salesforce
  // scheme export (TCP-Schemes-Sample 2.xlsx), tagged to TCP's live Slab,
  // BOGO (Flat with Multiples) and Flat Schemes. See data/tcpl.ts. Prices
  // are invented (the export has trade payout %, not consumer price) but
  // plausible.
  {
    id: 'p22', name: 'Tata Salt Black Salt - 100 g Sachet X 180 Nos', shortName: 'Tata Salt Black Salt Sachet',
    category: 'Masala & Seasoning', caseLabel: 'Case: 180 pc', caseSize: 180, image: '🧂',
    variants: [{ id: '100g', label: '100 g' }, { id: '70g', label: '70 g' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '10% Margin',
    price: 8.5, mrp: 10, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
  {
    id: 'p23', name: 'Tata Salt Black Salt - 100 g Crusher X 30 Nos', shortName: 'Tata Salt Black Salt Crusher',
    category: 'Masala & Seasoning', caseLabel: 'Case: 30 pc', caseSize: 30, image: '🧂',
    variants: [{ id: '100g', label: '100 g' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '11% Margin',
    price: 82, mrp: 95, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
  {
    id: 'p24', name: 'Soulfull Masala Oats+ Masala - 500 g Pack X 30 Nos', shortName: 'Soulfull Masala Oats+ (Masala)',
    category: 'Snacks & Namkeen', caseLabel: 'Case: 30 pc', caseSize: 30, image: '🥣',
    variants: [{ id: '500g', label: '500 g' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '13% Margin',
    price: 155, mrp: 180, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
  {
    id: 'p25', name: 'Soulfull Masala Oats+ Tomato - 500 g Pack X 30 Nos', shortName: 'Soulfull Masala Oats+ (Tomato)',
    category: 'Snacks & Namkeen', caseLabel: 'Case: 30 pc', caseSize: 30, image: '🥣',
    variants: [{ id: '500g', label: '500 g' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '13% Margin',
    price: 155, mrp: 180, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
  {
    id: 'p26', name: 'TT 1868 Tea Lovers Bliss Gift Box - 20 g X 6 Nos', shortName: 'TT 1868 Tea Lovers Bliss Gift Box',
    category: 'Beverages', caseLabel: 'Case: 12 pc', caseSize: 12, image: '🎁',
    variants: [{ id: 'set6', label: 'Set of 6' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '9% Margin',
    price: 210, mrp: 250, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
  {
    id: 'p27', name: 'TT 1868 Davos Assorted Gift Pack - 120 g X 6 Nos', shortName: 'TT 1868 Davos Assorted Gift Pack',
    category: 'Beverages', caseLabel: 'Case: 6 pc', caseSize: 6, image: '🎁',
    variants: [{ id: 'set6', label: 'Set of 6' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '9% Margin',
    price: 580, mrp: 650, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
  {
    id: 'p28', name: 'Soulfull Ragi Bites Strawberry Wafer - 50 g X 24 Nos', shortName: 'Soulfull Ragi Bites Strawberry Wafer',
    category: 'Snacks & Namkeen', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🍪',
    variants: [{ id: '50g', label: '50 g' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin',
    price: 17, mrp: 20, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
  {
    id: 'p29', name: 'Soulfull Ragi Bites Choco Wafer - 50 g X 24 Nos', shortName: 'Soulfull Ragi Bites Choco Wafer',
    category: 'Snacks & Namkeen', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🍪',
    variants: [{ id: '50g', label: '50 g' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin',
    price: 17, mrp: 20, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
  {
    id: 'p30', name: 'Tata Salt Crystal - 20 kg (25 x 80 g Child Packs) X 10 Nos', shortName: 'Tata Salt Crystal 20 kg',
    category: 'Masala & Seasoning', caseLabel: 'Case: 10 pc', caseSize: 10, image: '🧂',
    variants: [{ id: '20kg', label: '20 kg' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '8% Margin',
    price: 190, mrp: 220, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },

  // ── Offer-pattern coverage — one SKU per scheme type (BOGO, Freebie, Case
  // Bonus, Combo, Slab), spread across the three sellers below, so every
  // pattern has a demo beyond the TCPL set. See data/coupons.ts for the
  // matching Offer entries — the cart starts empty, so which of these end up
  // qualified vs. short is up to whatever quantity the buyer actually adds.
  {
    id: 'p31', name: 'Everest Garam Masala - 100 g Pack X 24 Nos', shortName: 'Everest Garam Masala',
    category: 'Masala & Seasoning', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🌶️',
    variants: [{ id: '50g', label: '50 g' }, { id: '100g', label: '100 g' }],
    seller: 'Sri Sai Krishna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '13% Margin',
    price: 42, mrp: 48, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p32', name: 'Lifebuoy Handwash - 200 ml Bottle X 24 Nos', shortName: 'Lifebuoy Handwash',
    category: 'Personal Care', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🧴',
    variants: [{ id: '200ml', label: '200 ml' }, { id: '500ml', label: '500 ml' }],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '14% Margin',
    price: 65, mrp: 75, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p33', name: 'Tata Tea Gold - 1 kg Pack X 20 Nos', shortName: 'Tata Tea Gold',
    category: 'Beverages', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🍵',
    variants: [{ id: '250g', label: '250 g' }, { id: '1kg', label: '1 kg' }],
    seller: 'Sri Sai Krishna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '10% Margin',
    price: 480, mrp: 520, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p34', name: 'Vim Dishwash Bar - 300 g Pack X 36 Nos', shortName: 'Vim Dishwash Bar',
    category: 'Personal Care', caseLabel: 'Case: 36 pc', caseSize: 36, image: '🧽',
    variants: [{ id: '155g', label: '155 g' }, { id: '300g', label: '300 g' }],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin',
    price: 38, mrp: 44, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p35', name: 'Surf Excel Easy Wash Detergent - 1 kg Pack X 20 Nos', shortName: 'Surf Excel Easy Wash Detergent',
    category: 'Personal Care', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🧺',
    variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 kg' }],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '11% Margin',
    price: 118, mrp: 135, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p36', name: 'Sunfeast Marie Gold Biscuits - 1 kg Pack X 12 Nos', shortName: 'Sunfeast Marie Gold Biscuits',
    category: 'Snacks & Namkeen', caseLabel: 'Case: 12 pc', caseSize: 12, image: '🍪',
    variants: [{ id: '250g', label: '250 g' }, { id: '1kg', label: '1 kg' }],
    seller: 'Sri Sai Krishna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '9% Margin',
    price: 92, mrp: 105, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    // Stacked — BOGO + Slab together, so one card shows two live scheme
    // states at once instead of the usual one.
    id: 'p37', name: 'Colgate Strong Teeth Toothpaste - 200 g Pack X 12 Nos', shortName: 'Colgate Strong Teeth Toothpaste',
    category: 'Personal Care', caseLabel: 'Case: 12 pc', caseSize: 12, image: '🪥',
    variants: [{ id: '100g', label: '100 g' }, { id: '200g', label: '200 g' }],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '13% Margin',
    price: 88, mrp: 100, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    // Stacked — Freebie + Case Bonus together.
    id: 'p38', name: 'Tata Sampann Toor Dal - 1 kg Pack X 12 Nos', shortName: 'Tata Sampann Toor Dal',
    category: 'Dals & Pulses', caseLabel: 'Case: 12 pc', caseSize: 12, image: '🫘',
    variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 kg' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '10% Margin',
    price: 148, mrp: 168, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
  {
    // The kitchen-sink SKU — BOGO + Freebie + Case Bonus + Slab + Combo
    // (paired with Tata Salt Black Salt Sachet, p22) all live at once.
    id: 'p39', name: 'Tata Salt Iodised - 1 kg Pack X 20 Nos', shortName: 'Tata Salt Iodised',
    category: 'Masala & Seasoning', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🧂',
    variants: [{ id: '1kg', label: '1 kg' }],
    seller: 'Tata Consumer Products', source: 'distributor', delivery: 'Free Delivery', margin: '9% Margin',
    price: 24, mrp: 28, deliveryDay: 'Mon (Beat day)', mov: 2000,
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

/** Pack tiers offered in the selling-units sheet: single, half-case, full case. */
export function packTiers(caseSize: number) {
  const half = Math.max(2, Math.round(caseSize / 2));
  const uniq = Array.from(new Set([1, half, caseSize])).filter((n) => n <= caseSize);
  return uniq.map((pcs) => ({ id: `t${pcs}`, label: `1 X ${pcs}`, pcs }));
}

export interface Coupon {
  id: string;
  title: string;
  detail: string;
  code: string;
}

export const COUPONS: Coupon[] = [
  { id: 'c1', title: 'Flat ₹500 OFF', detail: 'On orders above ₹6,000', code: 'QWIPO500' },
  { id: 'c2', title: '10% OFF up to ₹400', detail: 'First 3 orders', code: 'WELCOME10' },
  { id: 'c3', title: 'Free delivery', detail: 'On all orders above ₹3,500', code: 'FREESHIP' },
];
