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

export const demoBeats: ServiceabilityBeat[] = [
  {
    id: "beat-demo-west", sellerId: "seller-1", sellerName: "ABC Distributors",
    companyId: "co-itc", companyName: "ITC Limited", beatName: "Demo West",
    deliveryDays: ["Monday", "Thursday"], polygonFileName: "demo-west.geojson",
    polygonData: kphbZone, createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "beat-demo-north", sellerId: "seller-1", sellerName: "ABC Distributors",
    companyId: "co-freedom", companyName: "Gemini Edibles & Fats India Private Limited",
    beatName: "Demo North", deliveryDays: ["Tuesday", "Friday"],
    polygonFileName: "demo-north.geojson", polygonData: alwalZone,
    createdAt: "2026-01-01T00:00:00Z",
  },
];
