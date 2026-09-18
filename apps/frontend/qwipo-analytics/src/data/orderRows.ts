// Sample order rows for the KPI drill-through drawer. A representative page —
// the drawer says "showing 25 of 1,142"; the full register is the report.
export type Stage = 'created' | 'accepted' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface OrderRow {
  id: string;
  date: string;
  outlet: string;
  distributor: string;
  status: Stage;
  value: number; // ₹
  /** delivered_at, for delivered rows */
  delivered?: string;
}

export const stageLabel: Record<Stage, string> = {
  created: 'Order placed', accepted: 'Accepted', packed: 'Packed', shipped: 'Shipped',
  delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned',
};

export const orderRows: OrderRow[] = [
  { id: 'QW-ONDC-260822-QQ6G6Q', date: '22 Aug', outlet: 'Lakshmi Kirana General Store', distributor: 'S R Enterprises', status: 'created', value: 1140 },
  { id: 'QW-ONDC-260822-VWT389', date: '22 Aug', outlet: 'Deekshith Milk Point & General', distributor: 'Sri Balaji Agencies', status: 'accepted', value: 5432 },
  { id: 'QW-ONDC-260822-P5KBR2', date: '22 Aug', outlet: 'Pujaa Kirana and General Store', distributor: 'S R Enterprises', status: 'created', value: 570 },
  { id: 'QW-ONDC-260822-DZB2SX', date: '22 Aug', outlet: 'SR Kirana & General Stores', distributor: 'Annapurna Traders', status: 'accepted', value: 984 },
  { id: 'QW-ONDC-260822-MPZMWK', date: '22 Aug', outlet: 'Laxmi Venkateshwara Kirana', distributor: 'Sai Krishna Agencies', status: 'accepted', value: 3260 },
  { id: 'QW-ONDC-260821-MMH3G2', date: '21 Aug', outlet: 'Sri Venkateswara Milk Parlour', distributor: 'Annapurna Traders', status: 'delivered', value: 5280, delivered: '22 Aug' },
  { id: 'QW-ONDC-260821-X3VR2K', date: '21 Aug', outlet: 'Masha Allah Kirana & General', distributor: 'SS Enterprises', status: 'delivered', value: 1591, delivered: '23 Aug' },
  { id: 'QW-ONDC-260821-3D6PGG', date: '21 Aug', outlet: 'Natural Organic Oils', distributor: 'S R Enterprises', status: 'delivered', value: 6710, delivered: '22 Aug' },
  { id: 'QW-ONDC-260821-CRHQB3', date: '21 Aug', outlet: 'Ambika Traders', distributor: 'Sri Balaji Agencies', status: 'cancelled', value: 3360 },
  { id: 'QW-ONDC-260821-9N27DH', date: '21 Aug', outlet: 'Ambika Traders', distributor: 'Sri Balaji Agencies', status: 'delivered', value: 5150, delivered: '24 Aug' },
  { id: 'QW-ONDC-260820-YXZFWH', date: '20 Aug', outlet: 'Corner Mart', distributor: 'Vijaya Distributors', status: 'cancelled', value: 3975 },
  { id: 'QW-ONDC-260820-5V5X6E', date: '20 Aug', outlet: 'Corner Mart', distributor: 'Vijaya Distributors', status: 'delivered', value: 1308, delivered: '21 Aug' },
  { id: 'QW-ONDC-260820-YN5X84', date: '20 Aug', outlet: 'Rupa Kirana and General Store', distributor: 'Sri Balaji Agencies', status: 'delivered', value: 7530, delivered: '22 Aug' },
  { id: 'QW-ONDC-260820-MX5B33', date: '20 Aug', outlet: 'Sri Sai Balaji Rice Traders', distributor: 'Lakshmi Agencies', status: 'accepted', value: 528 },
  { id: 'QW-ONDC-260819-K2NF8Q', date: '19 Aug', outlet: 'Jai Bhavani Kirana', distributor: 'Vijaya Distributors', status: 'returned', value: 2140 },
  { id: 'QW-ONDC-260819-T7WQ4L', date: '19 Aug', outlet: 'Sri Manikanta Super Market', distributor: 'Sri Balaji Agencies', status: 'delivered', value: 8940, delivered: '20 Aug' },
  { id: 'QW-ONDC-260819-H3JZ9M', date: '19 Aug', outlet: 'New Bharat Kirana', distributor: 'Lakshmi Agencies', status: 'cancelled', value: 1720 },
  { id: 'QW-ONDC-260818-B8XC2V', date: '18 Aug', outlet: 'Om Sai Provision Stores', distributor: 'S R Enterprises', status: 'delivered', value: 4380, delivered: '19 Aug' },
  { id: 'QW-ONDC-260818-W4KD7N', date: '18 Aug', outlet: 'Balaji Grand Bazar', distributor: 'Sri Balaji Agencies', status: 'delivered', value: 12480, delivered: '21 Aug' },
  { id: 'QW-ONDC-260818-R9PL5T', date: '18 Aug', outlet: 'Sri Lakshmi Ganapathi Stores', distributor: 'Sai Krishna Agencies', status: 'accepted', value: 2895 },
  { id: 'QW-ONDC-260817-F6QM3X', date: '17 Aug', outlet: 'Vijayalakshmi Vegetable & Kirana', distributor: 'Annapurna Traders', status: 'delivered', value: 6077, delivered: '18 Aug' },
  { id: 'QW-ONDC-260817-Z2HN8W', date: '17 Aug', outlet: 'Jyothi Kirana & General Store', distributor: 'S R Enterprises', status: 'cancelled', value: 6175 },
  { id: 'QW-ONDC-260817-L5VB4J', date: '17 Aug', outlet: 'Sri Anjaneya Traders', distributor: 'Vijaya Distributors', status: 'delivered', value: 3420, delivered: '19 Aug' },
  { id: 'QW-ONDC-260816-G8TS6K', date: '16 Aug', outlet: 'Sri Kanyaka Traders', distributor: 'Sri Balaji Agencies', status: 'delivered', value: 63960, delivered: '17 Aug' },
  { id: 'QW-ONDC-260816-D4RW9P', date: '16 Aug', outlet: 'Vuaja Laxmi Kiranam', distributor: 'Lakshmi Agencies', status: 'delivered', value: 5800, delivered: '18 Aug' },
];

/** Mock paging: each "page" replays the sample rows a week earlier with fresh
 *  ids (real build: keyset pagination against ClickHouse). */
export const MAX_PAGES = 5;
const shiftDate = (d: string, weeks: number) => {
  const day = parseInt(d) - weeks * 7;
  return day > 0 ? `${day} Aug` : `${day + 31} Jul`;
};
export function pageRows(page: number): OrderRow[] {
  if (page === 0) return orderRows;
  return orderRows.map((r, i) => ({
    ...r,
    id: `${r.id.slice(0, -2)}${page}${(i % 36).toString(36).toUpperCase()}`,
    date: shiftDate(r.date, page),
    delivered: r.delivered && shiftDate(r.delivered, page),
  }));
}
