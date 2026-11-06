import type { ServiceabilityBeat } from "./serviceability-data";

// Fictional service areas. GeoJSON positions use longitude, then latitude.
function demoZone(west: number, south: number, east: number, north: number) {
  return {
    type: "FeatureCollection" as const,
    features: [{
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "Polygon" as const,
        coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
      },
    }],
  };
}

export const kphbZone = demoZone(78.38, 17.47, 78.42, 17.51);
export const alwalZone = demoZone(78.49, 17.49, 78.53, 17.53);

// Fictional delivery beats. The Hyderabad distributors (seller-1, 5, 6
// and 7 in mock-store.ts) reach into the KPHB and Alwal dark-store
// polygons, so each store page lists several sellers and companies.
export const demoBeats: ServiceabilityBeat[] = [
  {
    id: "beat-demo-west", sellerId: "seller-1", sellerName: "ABC Distributors",
    companyId: "co-itc", companyName: "ITC Limited", beatName: "KPHB Colony",
    deliveryDays: ["Monday", "Thursday"], polygonFileName: "kphb-colony.geojson",
    polygonData: kphbZone, createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "beat-demo-north", sellerId: "seller-1", sellerName: "ABC Distributors",
    companyId: "co-freedom", companyName: "Gemini Edibles & Fats India Private Limited",
    beatName: "Alwal", deliveryDays: ["Tuesday", "Friday"],
    polygonFileName: "alwal.geojson", polygonData: alwalZone,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "beat-kphb-south", sellerId: "seller-5", sellerName: "Sri Venkateswara Traders",
    companyId: "co-adani", companyName: "Adani Wilmar Limited", beatName: "KPHB Phase 1–4",
    deliveryDays: ["Monday", "Wednesday", "Friday"], polygonFileName: "kphb-phase-1-4.geojson",
    polygonData: demoZone(78.38, 17.47, 78.42, 17.49), createdAt: "2026-04-12T00:00:00Z",
  },
  {
    id: "beat-kphb-north", sellerId: "seller-5", sellerName: "Sri Venkateswara Traders",
    companyId: "co-srikrupa", companyName: "Sri Krupa Industries", beatName: "KPHB Phase 6–9",
    deliveryDays: ["Tuesday", "Saturday"], polygonFileName: "kphb-phase-6-9.geojson",
    polygonData: demoZone(78.38, 17.49, 78.42, 17.51), createdAt: "2026-04-12T00:00:00Z",
  },
  {
    id: "beat-kukatpally", sellerId: "seller-6", sellerName: "Deccan FMCG Distributors",
    companyId: "co-freedom", companyName: "Gemini Edibles & Fats India Private Limited",
    beatName: "Kukatpally – Moosapet", deliveryDays: ["Monday", "Thursday"],
    polygonFileName: "kukatpally-moosapet.geojson",
    polygonData: demoZone(78.39, 17.47, 78.43, 17.5), createdAt: "2026-05-03T00:00:00Z",
  },
  {
    id: "beat-alwal-main", sellerId: "seller-6", sellerName: "Deccan FMCG Distributors",
    companyId: "co-adani", companyName: "Adani Wilmar Limited", beatName: "Alwal Main Road",
    deliveryDays: ["Wednesday", "Saturday"], polygonFileName: "alwal-main-road.geojson",
    polygonData: demoZone(78.49, 17.49, 78.53, 17.52), createdAt: "2026-05-03T00:00:00Z",
  },
  {
    id: "beat-kphb-east", sellerId: "seller-7", sellerName: "Lakshmi Ganapathi Agencies",
    companyId: "co-itc", companyName: "ITC Limited", beatName: "KPHB – Balanagar",
    deliveryDays: ["Monday", "Thursday"], polygonFileName: "kphb-balanagar.geojson",
    polygonData: demoZone(78.4, 17.48, 78.43, 17.51), createdAt: "2026-06-18T00:00:00Z",
  },
  {
    id: "beat-alwal-east", sellerId: "seller-7", sellerName: "Lakshmi Ganapathi Agencies",
    companyId: "co-itc", companyName: "ITC Limited", beatName: "Old Alwal – Lothkunta",
    deliveryDays: ["Tuesday", "Friday"], polygonFileName: "old-alwal-lothkunta.geojson",
    polygonData: demoZone(78.5, 17.5, 78.54, 17.53), createdAt: "2026-06-18T00:00:00Z",
  },
];
