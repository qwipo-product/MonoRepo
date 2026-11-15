// Prints what the CDS demo seed produces (dev aid): node tests/seed-report.mts
import { buildCdsState } from '../src/cds/seed.ts';
import { products, retailers } from './fixtures.ts';

const s = buildCdsState(retailers, products);
const count = <T>(xs: T[], f: (x: T) => string) => xs.reduce((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {} as Record<string, number>);
console.log('orders     ', JSON.stringify(count(s.orders, (o) => o.status)));
console.log('trips      ', JSON.stringify(count(s.trips, (t) => `${t.type}:${t.status}`)));
console.log('collections', JSON.stringify(count(s.collections, (c) => c.mode)));
console.log('routes     ', JSON.stringify(count(s.plans.filter((p) => p.kind === 'RETAILER_DELIVERY'), (p) => (p.tripIds.length ? 'with trip' : 'waiting for trip'))));
console.log('otps       ', JSON.stringify(count(s.otps, (o) => o.status)));
for (const st of s.stores) console.log(st.id, 'orders', JSON.stringify(count(s.orders.filter((o) => o.cdsStoreId === st.id), (o) => o.status)));
