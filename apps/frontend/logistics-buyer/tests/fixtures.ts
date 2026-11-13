// Test fixtures: retailers in CDS-served localities and a small product catalogue (synthetic).
import type { SeedProduct, SeedRetailer } from '../src/cds/seed.ts';

const LOC: [string, number, number][] = [
  ['Uppal', 17.4058, 78.5591], ['Boduppal', 17.4139, 78.5783], ['Tarnaka', 17.427, 78.53], ['Secunderabad', 17.4399, 78.4983],
  ['Dilsukhnagar', 17.3688, 78.5247], ['Kothapet', 17.368, 78.543], ['LB Nagar', 17.3457, 78.5522], ['Saroornagar', 17.353, 78.537],
  ['Kukatpally', 17.4948, 78.3996], ['Moosapet', 17.47, 78.425], ['Ameerpet', 17.4375, 78.4483], ['Begumpet', 17.4447, 78.4664],
  ['Mehdipatnam', 17.395, 78.44], ['Tolichowki', 17.398, 78.415], ['Vanasthalipuram', 17.3258, 78.56],
];
export const retailers: SeedRetailer[] = LOC.flatMap(([locality, lat, lng], i) => [0, 1, 2].map((k) => ({
  id: `rt-${i}-${k}`, code: `RT${100 + i * 3 + k}`, name: `Test Kirana ${i}-${k}`, ownerName: `Owner ${i}-${k}`, phone: `98480${String(10000 + i * 3 + k)}`,
  address: `${k + 1} Main Road, ${locality}`, locality, lat: lat + k * 0.004, lng: lng + k * 0.004,
})));
export const products: SeedProduct[] = ([
  ['Sona Masoori Rice 10 Kg', 612, 10, 'Rice'], ['Chakki Atta 5 Kg', 239, 5, 'Atta'], ['Toor Dal 1 Kg', 158, 1, 'Pulses'], ['Sugar 1 Kg', 46, 1, 'Sugar'],
  ['Sunflower Oil 1 L', 167.5, 0.91, 'Edible Oil'], ['Pooja Oil 450 Ml', 69, 0.42, 'Pooja'], ['Detergent 1 Kg', 99, 1, 'Home Care'], ['Soap 100 G', 31, 0.1, 'Personal Care'],
  ['Chilli Powder 200 G', 62, 0.2, 'Spices'], ['Salt 1 Kg', 22, 1, 'Salt'], ['Tea 250 G', 118, 0.25, 'Beverages'], ['Glucose Biscuits', 8.4, 0.1, 'Biscuits'],
] as [string, number, number, string][]).map(([name, price, weightKg, category]) => ({ name, price, weightKg, category }));
