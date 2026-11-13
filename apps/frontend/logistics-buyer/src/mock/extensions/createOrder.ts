// Seed extension for Create Order / Customer Master: extra customer-master rows that cover every UI state of
// /customer-master (system / connector / manual / missing source, empty or malformed coordinates, no business
// name or mobile, bulk customers, never-updated rows) and enough rows for two pages at 25/page.
// These extra customers have no orders, so editing them shows "Customer updated successfully.".
import type { MockDatabase, Rng } from '../seed';
import type { DbCustomer } from '../types';

interface Extra {
  uid: string;
  business: string;
  owner: string;
  mobile: string;
  lat: string | null;
  lng: string | null;
  address: string;
  locality: string;
  pincode: string;
  updatedBy: string | null;
  bulk?: boolean;
  status?: string;
  neverUpdated?: boolean;
}

const EXTRAS: Extra[] = [
  { uid: 'DLR00517', business: 'SRI VENKATA SAI KIRANA & GENERAL STORE', owner: 'Venkatesh Rao', mobile: '9876501234', lat: '17.2934908', lng: '78.5338018', address: '3-4-12, Gandhi Nagar Road, Vanasthalipuram', locality: 'Vanasthalipuram', pincode: '500070', updatedBy: 'system' },
  { uid: 'DLR00602', business: 'NEW BHARAT PROVISIONS', owner: 'Mohan Das', mobile: '9848012345', lat: '', lng: '', address: '', locality: 'Kothapet', pincode: '500035', updatedBy: 'connector' },
  { uid: 'DLR00611', business: '', owner: 'Sunitha Devi', mobile: '9701234567', lat: '17.4381', lng: '78.4472', address: '7-1-55, Srinivasa Nagar, Ameerpet', locality: 'Ameerpet', pincode: '500016', updatedBy: 'manual' },
  { uid: 'DLR00634', business: 'KRISHNA WHOLESALE TRADERS', owner: 'Gopal Krishna', mobile: '', lat: '17.36912', lng: '78.52231', address: '16-2-140, Main Road, Dilsukhnagar', locality: 'Dilsukhnagar', pincode: '500060', updatedBy: 'system', bulk: true },
  { uid: 'DLR00655', business: 'SAI DURGA FANCY & GENERAL', owner: 'Durga Prasad', mobile: '9963012345', lat: null, lng: null, address: '2-3-77, Bus Stop Road, Uppal', locality: 'Uppal', pincode: '500039', updatedBy: null, neverUpdated: true },
  { uid: 'DLR00671', business: 'METRO CASH POINT KIRANA', owner: 'Imran Khan', mobile: '9100012345', lat: '17', lng: '78.4', address: '9-4-86, Seven Tombs Road, Tolichowki', locality: 'Tolichowki', pincode: '500008', updatedBy: 'connector' },
  { uid: 'DLR00688', business: 'LAKSHMI NARASIMHA BULK STORES', owner: 'Narasimha Reddy', mobile: '8019912345', lat: '17.49348812345678', lng: '78.39961234567891', address: '5-36/2, Prashanth Nagar, Kukatpally', locality: 'Kukatpally', pincode: '500072', updatedBy: 'manual', bulk: true },
  { uid: 'DLR00702', business: 'RAINBOW MINI MART', owner: 'Swapna K', mobile: '7095512345', lat: '17.4402', lng: '78.4991', address: '1-8-303, Regimental Bazaar, Secunderabad', locality: 'Secunderabad', pincode: '500003', updatedBy: 'system', status: 'Inactive' },
  { uid: 'DLR00719', business: 'GREEN VALLEY PROVISIONS', owner: 'Ravi Teja', mobile: '6300412345', lat: '17.3462', lng: '78.5517', address: '3-12-90, Ring Road, LB Nagar', locality: 'LB Nagar', pincode: '500074', updatedBy: 'connector' },
];

export const seed = (db: MockDatabase, rng: Rng) => {
  // Some core rows are maintained by the "system" source (grey badge); the rest stay connector / manual.
  db.customers.forEach((c, i) => {
    if (i % 7 === 2) c.updated_by = 'system';
  });

  const now = new Date();
  const localityBeat = (locality: string) => {
    const owner = db.customers.find((c) => c.locality === locality);
    return owner?.beatId || db.beats[0]?.id || '';
  };
  EXTRAS.forEach((e, i) => {
    const created = new Date(now);
    created.setDate(created.getDate() - rng.int(20, 50));
    const updated = new Date(now);
    updated.setDate(updated.getDate() - (i % 4));
    updated.setHours(9 + i, rng.int(0, 59), 0, 0);
    const row: DbCustomer = {
      id: rng.uuid(),
      customer_unique_id: e.uid,
      buyer_id: db.buyer.id,
      mobile_number: e.mobile,
      business_name: e.business,
      customer_name: e.owner,
      latitude: e.lat as string,
      longitude: e.lng as string,
      address: e.address,
      status: e.status || 'Active',
      created_at: created.toISOString(),
      updated_at: e.neverUpdated ? (null as unknown as string) : updated.toISOString(),
      created_by: null,
      updated_by: e.updatedBy as string,
      is_bulk_order: !!e.bulk,
      locality: e.locality,
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: e.pincode,
      beatId: localityBeat(e.locality),
    };
    db.customers.push(row);
  });
};
