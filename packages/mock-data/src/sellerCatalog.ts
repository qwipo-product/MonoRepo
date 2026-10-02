// The distributor's side of the catalogue — the seller logged into the seller
// app, their products (My SKU), customers, offers (QPS schemes). Read-only
// seed; the seller-mobile app copies it and changes the copy during a demo.
// Shapes and words mirror the seller portal.

import type { SellerAccount, SellerCustomer, SellerCustomerAddress, SellerScheme, SellerSku } from '@mockups/types';

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
export const sellerSkus: SellerSku[] = [
  { code: 'FRD-SUN-1L', productId: 'freedom-sunflower', name: 'Freedom Refined Sunflower Oil', brand: 'Freedom', category: 'Cooking Oils & Ghee', pack: '1 L pouch', mrp: 185, price: 165, active: true, inStock: true, missingFields: [], updatedAt: '2026-10-01' },
  { code: 'FRD-GNT-1L', productId: 'freedom-groundnut', name: 'Freedom Double Filtered Groundnut Oil', brand: 'Freedom', category: 'Cooking Oils & Ghee', pack: '1 L pouch', mrp: 235, price: 210, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-29' },
  { code: 'FTN-SOY-1L', productId: 'fortune-soya', name: 'Fortune Soya Health Refined Oil', brand: 'Fortune', category: 'Cooking Oils & Ghee', pack: '1 L pouch', mrp: 170, price: 155, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-28' },
  { code: 'ASV-GHE-1L', productId: 'aashirvaad-ghee', name: 'Aashirvaad Svasti Pure Cow Ghee', brand: 'Aashirvaad', category: 'Cooking Oils & Ghee', pack: '1 L', mrp: 699, price: 640, active: true, inStock: false, missingFields: [], updatedAt: '2026-10-02' },
  { code: 'ASV-ATA-5K', productId: 'aashirvaad-atta', name: 'Aashirvaad Shudh Chakki Atta', brand: 'Aashirvaad', category: 'Atta & Flours', pack: '5 kg bag', mrp: 295, price: 265, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-30' },
  { code: 'ASV-MLT-5K', productId: 'aashirvaad-multigrain', name: "Aashirvaad Nature's Super Foods Multigrain Atta", brand: 'Aashirvaad', category: 'Atta & Flours', pack: '5 kg bag', mrp: 345, price: 318, active: true, inStock: true, missingFields: ['Product images', 'Short Description'], updatedAt: '2026-09-26' },
  { code: 'TTA-SLT-1K', productId: 'tata-salt', name: 'Tata Salt Iodised', brand: 'Tata Salt', category: 'Salt, Sugar & Spices', pack: '1 kg', mrp: 30, price: 27, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-30' },
  { code: 'TTA-TEA-500', productId: 'tata-tea-gold', name: 'Tata Tea Gold', brand: 'Tata Tea', category: 'Tea & Coffee', pack: '500 g', mrp: 320, price: 290, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-27' },
  { code: 'HUL-SRF-1K', productId: 'surf-excel', name: 'Surf Excel Quick Wash Detergent Powder', brand: 'Surf Excel', category: 'Cleaning', pack: '1 kg', mrp: 140, price: 125, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-29' },
  { code: 'NES-MAG-70', productId: 'maggi-masala', name: 'Maggi 2-Minute Masala Noodles', brand: 'Maggi', category: 'Snacks & Noodles', pack: '70 g × 12', mrp: 168, price: 156, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-25' },
  { code: 'PRL-GLU-250', productId: 'parle-g', name: 'Parle-G Original Glucose Biscuits', brand: 'Parle-G', category: 'Biscuits', pack: '250 g', mrp: 28, price: 25, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-24' },
  { code: 'ITC-MAR-250', productId: 'itc-sunfeast-marie', name: 'Sunfeast Marie Light Biscuits', brand: 'Sunfeast', category: 'Biscuits', pack: '250 g', mrp: 35, price: 30, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-24' },
  { code: 'ITC-BNG-FP', productId: 'itc-bingo-mad-angles', name: 'Bingo Mad Angles Tomato Madness', brand: 'Bingo', category: 'Snacks & Noodles', pack: 'Family pack', mrp: 22, price: 20, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-23' },
  { code: 'AML-BTR-500', productId: 'amul-butter', name: 'Amul Pasteurised Salted Butter', brand: 'Amul', category: 'Dairy', pack: '500 g', mrp: 305, price: 285, active: true, inStock: true, missingFields: [], updatedAt: '2026-09-30' },
  { code: 'ASV-SLT-1K', productId: 'aashirvaad-salt', name: 'Aashirvaad Iodised Crystal Salt', brand: 'Aashirvaad', category: 'Salt, Sugar & Spices', pack: '1 kg', mrp: 28, price: 24, active: false, inStock: true, missingFields: [], updatedAt: '2026-09-12' },
  { code: 'BRT-GDY-200', productId: 'britannia-good-day', name: 'Britannia Good Day Cashew Cookies', brand: 'Britannia', category: 'Biscuits', pack: '200 g', mrp: 40, price: 36, active: true, inStock: false, missingFields: ['Manufacturer / Packer Address', 'Customer Care Phone'], updatedAt: '2026-09-20' },
  { code: 'MTR-RSM-200', productId: 'mtr-rasam-mix', name: 'MTR Rasam Powder', brand: 'MTR', category: 'Salt, Sugar & Spices', pack: '200 g', mrp: 95, price: 86, active: false, inStock: false, missingFields: [], updatedAt: '2026-09-08' },
];

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
