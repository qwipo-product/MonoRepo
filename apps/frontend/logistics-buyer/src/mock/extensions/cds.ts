// Seed extension for the CDS (Cross Dock Store) Management System. Retailers come from the existing customer
// master and products from the existing catalogue; nothing in the existing data is changed. It does not use the
// seed RNG, so the other extensions get exactly the same random data as before.
import type { MockDatabase } from '../seed';
import { buildCdsState, type SeedProduct, type SeedRetailer } from '../../cds/seed';

export function seedInputs(db: MockDatabase): { retailers: SeedRetailer[]; products: SeedProduct[] } {
  const retailers = db.customers
    .filter((c) => c.latitude && c.longitude && !Number.isNaN(Number(c.latitude)))
    .map((c) => ({
      id: c.id, code: c.customer_unique_id, name: c.business_name, ownerName: c.customer_name, phone: c.mobile_number, address: c.address,
      locality: c.locality, lat: Number(c.latitude), lng: Number(c.longitude),
    }));
  const products = db.products.map((p) => ({ name: p.name, price: p.sellingPrice, weightKg: p.weightKg, category: p.category }));
  return { retailers, products };
}

export const seed = (db: MockDatabase) => {
  const { retailers, products } = seedInputs(db);
  db.ext.cds = buildCdsState(retailers, products);
};
