// The distributor's side of the catalogue — the seller logged into the seller
// app, their products (My SKU), customers, offers (QPS schemes). Read-only
// seed; the seller-mobile app copies it and changes the copy during a demo.
// Shapes and words mirror the seller portal.

import type { SellerAccount, SellerCustomer, SellerCustomerAddress, SellerScheme, SellerSku, SellerSkuDetails } from '@mockups/types';

// ── The seller logins ──
export const sellerAccounts: SellerAccount[] = [
  {
    id: 'SLR-10482',
    name: 'Sri Sai Krishna Traders',
    role: 'OWNER',
    gstId: '36AAKFS4821M1Z5',
    address: '4-7-112, Industrial Estate Road, Moosapet, Hyderabad 500018',
    contactName: 'Krishna Murthy',
    phone: '9900000002',
  },
  {
    id: 'SLR-10517',
    name: 'Sai Krishna Agencies — Secunderabad',
    role: 'STAFF',
    gstId: '36AAKFS4821M2Z4',
    address: '12-2-30, Rashtrapati Road, Secunderabad 500003',
    contactName: 'Krishna Murthy',
    phone: '9900000002',
  },
];

// ── Products (My SKU) ──
const skuRows: Omit<SellerSku, 'details'>[] = [
  { code: 'FRD-SUN-1L', productId: 'freedom-sunflower', name: 'Freedom Refined Sunflower Oil', shortName: 'Freedom Sun 1L', company: 'Gemini Edible & Fats India', brand: 'Freedom', category: 'Cooking Oils & Ghee', pack: '1 L pouch', mrp: 185, price: 165, active: true, inStock: true, gstPct: 5, minQty: 6, maxQty: 240, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-10-01' },
  { code: 'FRD-GNT-1L', productId: 'freedom-groundnut', name: 'Freedom Double Filtered Groundnut Oil', shortName: 'Freedom GNut 1L', company: 'Gemini Edible & Fats India', brand: 'Freedom', category: 'Cooking Oils & Ghee', pack: '1 L pouch', mrp: 235, price: 210, active: true, inStock: true, gstPct: 5, minQty: 6, maxQty: 240, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-29' },
  { code: 'FTN-SOY-1L', productId: 'fortune-soya', name: 'Fortune Soya Health Refined Oil', shortName: 'Fortune Soya 1L', company: 'Adani Wilmar', brand: 'Fortune', category: 'Cooking Oils & Ghee', pack: '1 L pouch', mrp: 170, price: 155, active: true, inStock: true, gstPct: 5, minQty: 6, maxQty: 240, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-28' },
  { code: 'ASV-GHE-1L', productId: 'aashirvaad-ghee', name: 'Aashirvaad Svasti Pure Cow Ghee', shortName: 'Svasti Ghee 1L', company: 'ITC Limited', brand: 'Aashirvaad', category: 'Cooking Oils & Ghee', pack: '1 L', mrp: 699, price: 640, active: true, inStock: false, gstPct: 12, minQty: 2, maxQty: 60, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-10-02' },
  { code: 'ASV-ATA-5K', productId: 'aashirvaad-atta', name: 'Aashirvaad Shudh Chakki Atta', shortName: 'Ashv Atta 5kg', company: 'ITC Limited', brand: 'Aashirvaad', category: 'Atta & Flours', pack: '5 kg bag', mrp: 295, price: 265, active: true, inStock: true, gstPct: 0, minQty: 2, maxQty: 100, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-30' },
  { code: 'ASV-MLT-5K', productId: 'aashirvaad-multigrain', name: "Aashirvaad Nature's Super Foods Multigrain Atta", shortName: 'Ashv Multi 5kg', company: 'ITC Limited', brand: 'Aashirvaad', category: 'Atta & Flours', pack: '5 kg bag', mrp: 345, price: 318, active: true, inStock: true, gstPct: 0, minQty: 2, maxQty: 100, returnable: false, cancellable: true, cod: true, missingFields: ['Product images', 'Short Description'], updatedAt: '2026-09-26' },
  { code: 'TTA-SLT-1K', productId: 'tata-salt', name: 'Tata Salt Iodised', shortName: 'Tata Salt 1kg', company: 'Tata Consumer Products', brand: 'Tata Salt', category: 'Salt, Sugar & Spices', pack: '1 kg', mrp: 30, price: 27, active: true, inStock: true, gstPct: 0, minQty: 10, maxQty: 500, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-30' },
  { code: 'TTA-TEA-500', productId: 'tata-tea-gold', name: 'Tata Tea Gold', shortName: 'Tea Gold 500g', company: 'Tata Consumer Products', brand: 'Tata Tea', category: 'Tea & Coffee', pack: '500 g', mrp: 320, price: 290, active: true, inStock: true, gstPct: 5, minQty: 3, maxQty: 120, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-27' },
  { code: 'HUL-SRF-1K', productId: 'surf-excel', name: 'Surf Excel Quick Wash Detergent Powder', shortName: 'Surf QW 1kg', company: 'Hindustan Unilever', brand: 'Surf Excel', category: 'Cleaning', pack: '1 kg', mrp: 140, price: 125, active: true, inStock: true, gstPct: 18, minQty: 6, maxQty: 240, returnable: true, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-29' },
  { code: 'NES-MAG-70', productId: 'maggi-masala', name: 'Maggi 2-Minute Masala Noodles', shortName: 'Maggi 70g x12', company: 'Nestlé India', brand: 'Maggi', category: 'Snacks & Noodles', pack: '70 g × 12', mrp: 168, price: 156, active: true, inStock: true, gstPct: 12, minQty: 2, maxQty: 100, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-25' },
  { code: 'PRL-GLU-250', productId: 'parle-g', name: 'Parle-G Original Glucose Biscuits', shortName: 'Parle-G 250g', company: 'Parle Products', brand: 'Parle-G', category: 'Biscuits', pack: '250 g', mrp: 28, price: 25, active: true, inStock: true, gstPct: 18, minQty: 12, maxQty: 600, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-24' },
  { code: 'ITC-MAR-250', productId: 'itc-sunfeast-marie', name: 'Sunfeast Marie Light Biscuits', shortName: 'Marie 250g', company: 'ITC Limited', brand: 'Sunfeast', category: 'Biscuits', pack: '250 g', mrp: 35, price: 30, active: true, inStock: true, gstPct: 18, minQty: 12, maxQty: 600, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-24' },
  { code: 'ITC-BNG-FP', productId: 'itc-bingo-mad-angles', name: 'Bingo Mad Angles Tomato Madness', shortName: 'Bingo MA FP', company: 'ITC Limited', brand: 'Bingo', category: 'Snacks & Noodles', pack: 'Family pack', mrp: 22, price: 20, active: true, inStock: true, gstPct: 12, minQty: 12, maxQty: 600, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-23' },
  { code: 'AML-BTR-500', productId: 'amul-butter', name: 'Amul Pasteurised Salted Butter', shortName: 'Amul Btr 500g', company: 'Amul', brand: 'Amul', category: 'Dairy', pack: '500 g', mrp: 305, price: 285, active: true, inStock: true, gstPct: 12, minQty: 2, maxQty: 80, returnable: false, cancellable: false, cod: true, missingFields: [], updatedAt: '2026-09-30' },
  { code: 'ASV-SLT-1K', productId: 'aashirvaad-salt', name: 'Aashirvaad Iodised Crystal Salt', shortName: 'Ashv Salt 1kg', company: 'ITC Limited', brand: 'Aashirvaad', category: 'Salt, Sugar & Spices', pack: '1 kg', mrp: 28, price: 24, active: false, inStock: true, gstPct: 0, minQty: 10, maxQty: 500, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-12' },
  { code: 'BRT-GDY-200', productId: 'britannia-good-day', name: 'Britannia Good Day Cashew Cookies', shortName: 'Good Day 200g', company: 'Britannia Industries', brand: 'Britannia', category: 'Biscuits', pack: '200 g', mrp: 40, price: 36, active: true, inStock: false, gstPct: 18, minQty: 12, maxQty: 600, returnable: false, cancellable: true, cod: false, missingFields: ['Manufacturer / Packer Address', 'Customer Care Phone'], updatedAt: '2026-09-20' },
  { code: 'MTR-RSM-200', productId: 'mtr-rasam-mix', name: 'MTR Rasam Powder', shortName: 'MTR Rasam 200g', company: 'MTR Foods', brand: 'MTR', category: 'Salt, Sugar & Spices', pack: '200 g', mrp: 95, price: 86, active: false, inStock: false, gstPct: 5, minQty: 6, maxQty: 240, returnable: false, cancellable: true, cod: true, missingFields: [], updatedAt: '2026-09-08' },
];

// The rest of each product's portal form. Shared defaults first, then what
// differs per product. An empty string is a field the seller hasn't filled
// in yet — those are the product's missingFields.
const MAKERS: Record<string, string> = {
  'Gemini Edible & Fats India': 'Gemini Edible & Fats India Pvt Ltd, Plot 1, Sy No 225, Kattedan Industrial Area, Hyderabad 500077',
  'Adani Wilmar': 'Adani Wilmar Ltd, Fortune House, Navrangpura, Ahmedabad 380009',
  'ITC Limited': 'ITC Limited, Virginia House, 37 JL Nehru Road, Kolkata 700071',
  'Tata Consumer Products': 'Tata Consumer Products Ltd, 1 Bishop Lefroy Road, Kolkata 700020',
  'Hindustan Unilever': 'Hindustan Unilever Ltd, Unilever House, BD Sawant Marg, Andheri East, Mumbai 400099',
  'Nestlé India': 'Nestlé India Ltd, 100/101 World Trade Centre, Barakhamba Lane, New Delhi 110001',
  'Parle Products': 'Parle Products Pvt Ltd, North Level Crossing, Vile Parle East, Mumbai 400057',
  'Amul': 'Gujarat Co-operative Milk Marketing Federation Ltd, Amul Dairy Road, Anand 388001',
  'Britannia Industries': '',
  'MTR Foods': 'MTR Foods Pvt Ltd, No 1 2nd Cross, Hosur Road, Bengaluru 560068',
};

const base: Omit<SellerSkuDetails, 'groupName' | 'shortDescription' | 'longDescription' | 'measureUnit' | 'unitValue' | 'skuWeight' | 'dimensionsCm' | 'categoryId'> = {
  weightMeasure: 'Gram',
  innerPack: 1,
  unitsPerCase: 12,
  sellingUnits: [1, 6, 12],
  gstCessPct: null,
  fulfillmentId: 'Store Delivery',
  locationId: 'WH-MOOSAPET-01',
  timeToShip: '1 day',
  customerCare: { name: 'Krishna Murthy', email: 'care@saikrishnatraders.in', phone: '9900000002' },
  manufacturerAddress: '',
  countryOfOrigin: 'India',
  images: 3,
};

const DETAILS: Record<string, Partial<SellerSkuDetails>> = {
  'FRD-SUN-1L': { groupName: 'Freedom Sunflower Oil', shortDescription: 'Refined sunflower oil, light and healthy for daily cooking.', longDescription: 'Freedom Refined Sunflower Oil 1 L pouch. Rich in Vitamin E, low absorption.', measureUnit: 'Liter', unitValue: 1, skuWeight: 920, unitsPerCase: 16, sellingUnits: [1, 4, 16], dimensionsCm: [20, 14, 6], categoryId: 'Edible Oil' },
  'FRD-GNT-1L': { groupName: 'Freedom Groundnut Oil', shortDescription: 'Double filtered groundnut oil with natural flavour.', longDescription: 'Freedom Double Filtered Groundnut Oil 1 L pouch for frying and tempering.', measureUnit: 'Liter', unitValue: 1, skuWeight: 920, unitsPerCase: 16, sellingUnits: [1, 4, 16], dimensionsCm: [20, 14, 6], categoryId: 'Edible Oil' },
  'FTN-SOY-1L': { groupName: 'Fortune Soya Oil', shortDescription: 'Refined soyabean oil with omega 3 and 6.', longDescription: 'Fortune Soya Health Refined Soyabean Oil 1 L pouch.', measureUnit: 'Liter', unitValue: 1, skuWeight: 920, unitsPerCase: 16, sellingUnits: [1, 4, 16], dimensionsCm: [20, 14, 6], categoryId: 'Edible Oil' },
  'ASV-GHE-1L': { groupName: 'Aashirvaad Ghee', shortDescription: 'Pure cow ghee with rich aroma and granular texture.', longDescription: 'Aashirvaad Svasti Pure Cow Ghee 1 L carton.', measureUnit: 'Liter', unitValue: 1, skuWeight: 910, unitsPerCase: 12, dimensionsCm: [10, 10, 18], categoryId: 'Ghee & Vanaspati' },
  'ASV-ATA-5K': { groupName: 'Aashirvaad Atta', shortDescription: 'Whole wheat chakki atta for soft rotis.', longDescription: 'Aashirvaad Shudh Chakki Atta 5 kg, 100% whole wheat, 0% maida.', measureUnit: 'Kilogram', unitValue: 5, weightMeasure: 'Kilogram', skuWeight: 5, unitsPerCase: 4, sellingUnits: [1, 2, 4], dimensionsCm: [36, 24, 10], categoryId: 'Atta, Flours & Sooji' },
  'ASV-MLT-5K': { groupName: 'Aashirvaad Atta', shortDescription: '', longDescription: "Aashirvaad Nature's Super Foods Multigrain Atta 5 kg.", measureUnit: 'Kilogram', unitValue: 5, weightMeasure: 'Kilogram', skuWeight: 5, unitsPerCase: 4, sellingUnits: [1, 2, 4], dimensionsCm: [36, 24, 10], categoryId: 'Atta, Flours & Sooji', images: 0 },
  'TTA-SLT-1K': { groupName: 'Tata Salt', shortDescription: 'Vacuum evaporated iodised salt.', longDescription: 'Tata Salt Iodised 1 kg pouch, desh ka namak.', measureUnit: 'Kilogram', unitValue: 1, weightMeasure: 'Kilogram', skuWeight: 1, unitsPerCase: 25, sellingUnits: [1, 5, 25], dimensionsCm: [18, 12, 5], categoryId: 'Salt, Sugar & Jaggery' },
  'TTA-TEA-500': { groupName: 'Tata Tea', shortDescription: 'Premium Assam leaf tea with 15% long leaves.', longDescription: 'Tata Tea Gold 500 g pack, rich taste and aroma.', measureUnit: 'Gram', unitValue: 500, skuWeight: 500, unitsPerCase: 24, sellingUnits: [1, 6, 24], dimensionsCm: [16, 10, 6], categoryId: 'Tea' },
  'HUL-SRF-1K': { groupName: 'Surf Excel', shortDescription: 'Quick wash detergent powder that removes tough stains.', longDescription: 'Surf Excel Quick Wash Detergent Powder 1 kg.', measureUnit: 'Kilogram', unitValue: 1, weightMeasure: 'Kilogram', skuWeight: 1, unitsPerCase: 24, sellingUnits: [1, 6, 24], dimensionsCm: [22, 15, 6], categoryId: 'Detergents & Dishwash' },
  'NES-MAG-70': { groupName: 'Maggi Noodles', shortDescription: '2-minute masala instant noodles.', longDescription: 'Maggi 2-Minute Masala Noodles 70 g, pack of 12.', measureUnit: 'Gram', unitValue: 70, skuWeight: 840, innerPack: 12, unitsPerCase: 8, sellingUnits: [1, 4, 8], dimensionsCm: [30, 20, 12], categoryId: 'Noodles, Pasta & Vermicelli' },
  'PRL-GLU-250': { groupName: 'Parle-G', shortDescription: 'Original glucose biscuits.', longDescription: 'Parle-G Original Glucose Biscuits 250 g family pack.', measureUnit: 'Gram', unitValue: 250, skuWeight: 250, unitsPerCase: 48, sellingUnits: [1, 12, 48], dimensionsCm: [18, 6, 5], categoryId: 'Biscuits & Cookies' },
  'ITC-MAR-250': { groupName: 'Sunfeast Biscuits', shortDescription: 'Light and crispy Marie biscuits.', longDescription: 'Sunfeast Marie Light Biscuits 250 g pack.', measureUnit: 'Gram', unitValue: 250, skuWeight: 250, unitsPerCase: 48, sellingUnits: [1, 12, 48], dimensionsCm: [18, 6, 5], categoryId: 'Biscuits & Cookies' },
  'ITC-BNG-FP': { groupName: 'Bingo Snacks', shortDescription: 'Tomato flavoured crunchy chips.', longDescription: 'Bingo Mad Angles Tomato Madness family pack.', measureUnit: 'Gram', unitValue: 130, skuWeight: 130, unitsPerCase: 36, sellingUnits: [1, 12, 36], dimensionsCm: [30, 20, 6], categoryId: 'Chips & Corn Snacks' },
  'AML-BTR-500': { groupName: 'Amul Butter', shortDescription: 'Pasteurised salted table butter.', longDescription: 'Amul Pasteurised Salted Butter 500 g carton. Keep refrigerated.', measureUnit: 'Gram', unitValue: 500, skuWeight: 500, unitsPerCase: 20, sellingUnits: [1, 5, 20], dimensionsCm: [14, 7, 6], categoryId: 'Dairy & Cheese', timeToShip: 'Same day' },
  'ASV-SLT-1K': { groupName: 'Aashirvaad Salt', shortDescription: 'Iodised crystal salt.', longDescription: 'Aashirvaad Iodised Crystal Salt 1 kg pouch.', measureUnit: 'Kilogram', unitValue: 1, weightMeasure: 'Kilogram', skuWeight: 1, unitsPerCase: 25, sellingUnits: [1, 5, 25], dimensionsCm: [18, 12, 5], categoryId: 'Salt, Sugar & Jaggery' },
  'BRT-GDY-200': { groupName: 'Britannia Good Day', shortDescription: 'Cashew cookies with rich buttery taste.', longDescription: 'Britannia Good Day Cashew Cookies 200 g.', measureUnit: 'Gram', unitValue: 200, skuWeight: 200, unitsPerCase: 48, sellingUnits: [1, 12, 48], dimensionsCm: [17, 6, 5], categoryId: 'Biscuits & Cookies', customerCare: { name: 'Krishna Murthy', email: 'care@saikrishnatraders.in', phone: '' } },
  'MTR-RSM-200': { groupName: 'MTR Masalas', shortDescription: 'Ready rasam powder with traditional taste.', longDescription: 'MTR Rasam Powder 200 g pouch.', measureUnit: 'Gram', unitValue: 200, skuWeight: 200, unitsPerCase: 40, sellingUnits: [1, 10, 40], dimensionsCm: [16, 11, 3], categoryId: 'Masalas & Spices' },
};

export const sellerSkus: SellerSku[] = skuRows.map((s) => ({
  ...s,
  details: { ...base, manufacturerAddress: MAKERS[s.company] ?? '', ...DETAILS[s.code] } as SellerSkuDetails,
}));

// ── Customers ──
const addr = (
  line: string,
  area: string,
  pincode: string,
  serviceability: SellerCustomerAddress['serviceability'],
  label = 'Shop'
): SellerCustomerAddress => ({ label, line, area, city: 'Hyderabad', state: 'Telangana', pincode, primary: true, serviceability });

export const sellerCustomers: SellerCustomer[] = [
  {
    customerId: 'CUS-200341', storeName: 'Sri Lakshmi Kirana', ownerName: 'Ramesh Goud', mobile: '9848012345', gstn: '36BQTPG2231K1ZR',
    addresses: [addr('Shop 4, Road No. 1, KPHB Phase 3', 'Kukatpally', '500072', [
      { company: 'ITC Limited', beat: 'KPHB Monday Beat', days: ['Monday'] },
      { company: 'Tata Consumer Products', beat: 'KPHB Saturday Beat', days: ['Saturday'] },
    ])],
    companies: [
      { name: 'ITC Limited', registeredOn: '2026-03-14', status: 'ACTIVE' },
      { name: 'Tata Consumer Products', registeredOn: '2026-05-02', status: 'ACTIVE' },
    ],
  },
  {
    customerId: 'CUS-200352', storeName: 'Balaji General Stores', ownerName: 'Srinivas Rao', mobile: '9849023456',
    addresses: [addr('7-1-212, Balkampet Road', 'Ameerpet', '500016', [
      { company: 'Hindustan Unilever', beat: 'Ameerpet Thursday Beat', days: ['Thursday'] },
    ])],
    companies: [
      { name: 'Hindustan Unilever', registeredOn: '2026-02-20', status: 'ACTIVE' },
      { name: 'Nestlé India', registeredOn: '2026-06-11', status: 'ACTIVE' },
    ],
  },
  {
    customerId: 'CUS-200367', storeName: 'Venkateswara Super Market', ownerName: 'Padma Reddy', mobile: '9866034567', email: 'venkateswara.dsnr@gmail.com', gstn: '36AJRPR7712L1Z9',
    addresses: [addr('Plot 18, Chaitanyapuri Main Road', 'Dilsukhnagar', '500060', [
      { company: 'Adani Wilmar', beat: 'Dilsukhnagar Tuesday Beat', days: ['Tuesday'] },
      { company: 'Tata Consumer Products', beat: 'Dilsukhnagar Tuesday Beat', days: ['Tuesday'] },
    ])],
    companies: [
      { name: 'Adani Wilmar', registeredOn: '2026-01-08', status: 'ACTIVE' },
      { name: 'Tata Consumer Products', registeredOn: '2026-01-08', status: 'ACTIVE' },
      { name: 'Amul', registeredOn: '2026-04-19', status: 'ACTIVE' },
    ],
  },
  {
    customerId: 'CUS-200375', storeName: 'Hanuman Provision Store', ownerName: 'Mahesh Yadav', mobile: '9885045678',
    addresses: [addr('Shop 2, Allwyn Colony X Road', 'Miyapur', '500049', [
      { company: 'ITC Limited', beat: 'KPHB Monday Beat', days: ['Monday'] },
    ])],
    companies: [
      { name: 'ITC Limited', registeredOn: '2026-04-02', status: 'ACTIVE' },
      { name: 'Adani Wilmar', registeredOn: '2026-07-21', status: 'BLOCKED' },
    ],
  },
  {
    customerId: 'CUS-200388', storeName: 'Annapurna Traders', ownerName: 'Lakshmi Devi', mobile: '9908056789', gstn: '36AAEFA9921C1Z2',
    addresses: [addr('9-1-120, SD Road, near Clock Tower', 'Secunderabad', '500003', [
      { company: 'Adani Wilmar', beat: 'Secunderabad Saturday Beat', days: ['Saturday'] },
      { company: 'Tata Consumer Products', beat: 'Secunderabad Saturday Beat', days: ['Saturday'] },
    ])],
    companies: [
      { name: 'Adani Wilmar', registeredOn: '2025-12-10', status: 'ACTIVE' },
      { name: 'Tata Consumer Products', registeredOn: '2026-02-01', status: 'ACTIVE' },
    ],
  },
  {
    customerId: 'CUS-200394', storeName: 'Ganesh Kirana & General', ownerName: 'Ravi Kumar', mobile: '9959067890',
    // No beat reaches LB Nagar yet — this shop only gets quick (next-day) delivery.
    addresses: [addr('Shop 11, Sagar Ring Road', 'LB Nagar', '500074', [])],
    companies: [{ name: 'Adani Wilmar', registeredOn: '2026-08-30', status: 'ACTIVE' }],
  },
  {
    customerId: 'CUS-200402', storeName: 'Sai Ram Daily Needs', ownerName: 'Anil Sharma', mobile: '9703078901',
    addresses: [addr('2-3-45, Ramanthapur Road', 'Uppal', '500039', [
      { company: 'Tata Consumer Products', beat: 'Uppal Wednesday Beat', days: ['Wednesday'] },
    ])],
    companies: [{ name: 'Tata Consumer Products', registeredOn: '2026-05-17', status: 'ACTIVE' }],
  },
  {
    customerId: 'CUS-200417', storeName: 'Durga Bhavani Stores', ownerName: 'Suresh Naidu', mobile: '9440089012',
    addresses: [addr('1-8-302, Begumpet Main Road', 'Begumpet', '500016', [
      { company: 'Hindustan Unilever', beat: 'Ameerpet Thursday Beat', days: ['Thursday'] },
    ])],
    companies: [{ name: 'Hindustan Unilever', registeredOn: '2026-09-18', status: 'ACTIVE' }],
  },
  {
    customerId: 'CUS-200425', storeName: 'Mahalakshmi Departmental', ownerName: 'Kavitha Rao', mobile: '9391090123',
    addresses: [addr('Shop 7, Nizampet Road', 'Nizampet', '500090', [
      { company: 'ITC Limited', beat: 'KPHB Monday Beat', days: ['Monday'] },
    ])],
    companies: [{ name: 'ITC Limited', registeredOn: '2026-03-03', status: 'BLOCKED' }],
  },
];

// ── Offers (QPS schemes) ──
export const sellerSchemes: SellerScheme[] = [
  { code: 'QPS-1042', skuCode: 'FRD-SUN-1L', validFrom: '2026-09-15', validTill: '2026-10-31', status: 'ACTIVE', slabs: [{ min: 1, max: 23, discountPct: 0 }, { min: 24, max: 47, discountPct: 3 }, { min: 48, max: null, discountPct: 5 }] },
  { code: 'QPS-1051', skuCode: 'ASV-ATA-5K', validFrom: '2026-09-20', validTill: '2026-10-20', status: 'ACTIVE', slabs: [{ min: 1, max: 9, discountPct: 0 }, { min: 10, max: null, discountPct: 4 }] },
  { code: 'QPS-1063', skuCode: 'PRL-GLU-250', validFrom: '2026-10-01', validTill: '2026-11-15', status: 'INACTIVE', slabs: [{ min: 1, max: 47, discountPct: 0 }, { min: 48, max: 95, discountPct: 2 }, { min: 96, max: null, discountPct: 4 }] },
  { code: 'QPS-0988', skuCode: 'HUL-SRF-1K', validFrom: '2026-08-01', validTill: '2026-08-31', status: 'EXPIRED', slabs: [{ min: 1, max: 11, discountPct: 0 }, { min: 12, max: null, discountPct: 5 }] },
];
