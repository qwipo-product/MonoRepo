// Payments + Credit Partners — self-contained mock, mirrors bms-customer-app.
//
// Flow (source of truth = qwipo/bms-customer-app):
//   Payments list (vendors w/ outstanding) → Orders + Transactions (tabbed)
//     → Gateway select (enter amount, pick UPI / Rupifi / ePay Later) → pay.
//   Credit Partners → Rupifi / ePay Later statements w/ a repayment link.

/** Gateway kinds a vendor can expose. UPI bundles PaySharp + card rails. */
export type GatewayId = 'upi' | 'rupifi' | 'epaylater';

export interface PaymentVendor {
  id: string;
  name: string;
  /** Emoji/initial glyph for the round avatar. */
  logo: string;
  outstandingAmount: number;
  /** Qwipo-fulfilled shows a single Continue; vendor-fulfilled pays per order. */
  fulfilment: 'qwipo' | 'vendor';
  gateways: GatewayId[];
}

export interface PaymentOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  orderAmount: number;
  outstandingAmount: number;
  status: string;
}

export interface PaymentTxn {
  id: string;
  ref: string;
  date: string;
  amount: number;
  status: 'Success' | 'Pending' | 'Failed';
}

/** A selectable gateway on the pay screen. BNPL kinds carry credit limits. */
export interface GatewayOption {
  id: GatewayId;
  kind: 'upi' | 'bnpl';
  title: string;
  subtitle?: string;
  availableLimit?: number;
  currentLimit?: number;
  minAmount: number;
}

export interface CreditPartner {
  id: string;
  name: string;
  logo: string;
  totalCreditLimit: number;
  usedCreditLimit: number;
  currentBalance: number;
  amountDue: number;
  daysDifference: number;
  repaymentUrl: string;
}

// Only vendors with a positive outstanding amount surface in the list — same
// as the source (it filters outstandingAmount > 0).
export const PAYMENT_VENDORS: PaymentVendor[] = [
  {
    id: 'qwipo',
    name: 'Qwipo',
    logo: 'Q',
    outstandingAmount: 18450,
    fulfilment: 'qwipo',
    gateways: ['upi', 'epaylater'],
  },
  {
    id: 'omkar',
    name: 'Omkar Enterprise',
    logo: '🏬',
    outstandingAmount: 7128,
    fulfilment: 'vendor',
    gateways: ['upi', 'rupifi', 'epaylater'],
  },
  {
    id: 'srisai',
    name: 'Sri Sai Krishna Traders',
    logo: '🛒',
    outstandingAmount: 3640,
    fulfilment: 'vendor',
    gateways: ['upi'],
  },
  {
    // No gateways configured → tapping this shows the "no gateways" warning.
    id: 'karnataka',
    name: 'Karnataka Soaps & Detergents',
    logo: '🧼',
    outstandingAmount: 2260,
    fulfilment: 'vendor',
    gateways: [],
  },
];

// Outstanding orders per vendor (Payments tab).
export const PAYMENT_ORDERS: Record<string, PaymentOrder[]> = {
  qwipo: [
    { id: 'po1', orderNumber: 'QWIP2402204', orderDate: '2026-06-16', orderAmount: 4200, outstandingAmount: 4200, status: 'Delivered' },
    { id: 'po2', orderNumber: 'QWIP2401991', orderDate: '2026-06-11', orderAmount: 9250, outstandingAmount: 9250, status: 'Delivered' },
    { id: 'po3', orderNumber: 'QWIP2401762', orderDate: '2026-06-04', orderAmount: 5000, outstandingAmount: 5000, status: 'Delivered' },
  ],
  omkar: [
    { id: 'po4', orderNumber: 'QWIP2401204', orderDate: '2026-06-05', orderAmount: 7128, outstandingAmount: 7128, status: 'Delivered' },
  ],
  srisai: [
    { id: 'po5', orderNumber: 'QWIP2400204', orderDate: '2026-06-03', orderAmount: 3640, outstandingAmount: 3640, status: 'Delivered' },
  ],
  karnataka: [],
};

// Past settlement transactions per vendor (Transactions tab).
export const PAYMENT_TXNS: Record<string, PaymentTxn[]> = {
  qwipo: [
    { id: 't1', ref: 'PSHRP8842013', date: '2026-06-01', amount: 12000, status: 'Success' },
    { id: 't2', ref: 'PSHRP8840551', date: '2026-05-24', amount: 6500, status: 'Success' },
    { id: 't3', ref: 'PSHRP8838220', date: '2026-05-18', amount: 4300, status: 'Pending' },
  ],
  omkar: [
    { id: 't4', ref: 'PSHRP8831907', date: '2026-05-20', amount: 5200, status: 'Success' },
  ],
  srisai: [],
  karnataka: [],
};

// Gateway eligibility + limits per vendor. Absent id = gateway not offered.
export const GATEWAYS_BY_VENDOR: Record<string, GatewayOption[]> = {
  qwipo: [
    { id: 'upi', kind: 'upi', title: 'UPI', subtitle: 'GooglePay · PhonePe · PaySharp', minAmount: 10 },
    { id: 'epaylater', kind: 'bnpl', title: 'ePay Later', subtitle: 'Buy Now Pay Later', availableLimit: 25000, currentLimit: 50000, minAmount: 125 },
  ],
  omkar: [
    { id: 'upi', kind: 'upi', title: 'UPI', subtitle: 'GooglePay · PhonePe · PaySharp', minAmount: 10 },
    { id: 'rupifi', kind: 'bnpl', title: 'Rupifi', subtitle: 'Buy Now Pay Later', availableLimit: 40000, currentLimit: 75000, minAmount: 120 },
    { id: 'epaylater', kind: 'bnpl', title: 'ePay Later', subtitle: 'Buy Now Pay Later', availableLimit: 18000, currentLimit: 50000, minAmount: 125 },
  ],
  srisai: [
    { id: 'upi', kind: 'upi', title: 'UPI', subtitle: 'GooglePay · PhonePe · PaySharp', minAmount: 10 },
  ],
  karnataka: [],
};

export const CREDIT_PARTNERS: CreditPartner[] = [
  {
    id: 'rupifi',
    name: 'Rupifi',
    logo: '💳',
    totalCreditLimit: 75000,
    usedCreditLimit: 35000,
    currentBalance: 40000,
    amountDue: 12500,
    daysDifference: 8,
    repaymentUrl: 'https://app.rupifi.com/repay',
  },
  {
    id: 'epaylater',
    name: 'ePay Later',
    logo: '🏦',
    totalCreditLimit: 50000,
    usedCreditLimit: 32000,
    currentBalance: 18000,
    amountDue: 9800,
    daysDifference: 3,
    repaymentUrl: 'https://b2r.epaylater.in/login/mobile-no?redirect=Credit%20Statement',
  },
];

/** Short label for the gateway chips shown on a vendor card. */
export const GATEWAY_LABEL: Record<GatewayId, string> = {
  upi: 'UPI',
  rupifi: 'Rupifi',
  epaylater: 'ePay Later',
};
