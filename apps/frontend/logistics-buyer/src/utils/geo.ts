// Small geometry helpers for the cross-dock demo (distances, CDS area polygons, point-in-polygon).

export type LatLng = [number, number];

const R = 6371; // km
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Point `km` away from `c` at `bearingDeg` (0 = north). */
export function offset(c: LatLng, km: number, bearingDeg: number): LatLng {
  const b = rad(bearingDeg);
  const dLat = (km / R) * Math.cos(b);
  const dLng = ((km / R) * Math.sin(b)) / Math.cos(rad(c[0]));
  return [c[0] + (dLat * 180) / Math.PI, c[1] + (dLng * 180) / Math.PI];
}

/** A slightly irregular ring around `c`, so areas look drawn rather than perfect circles. */
export function areaPolygon(c: LatLng, radiusKm: number, wobble: number[] = []): LatLng[] {
  const n = 14;
  return Array.from({ length: n }, (_, i) => offset(c, radiusKm * (1 + (wobble[i % (wobble.length || 1)] ?? 0)), (360 / n) * i));
}

/** Ray-casting point-in-polygon. */
export function inPolygon(p: LatLng, poly: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > p[0] !== yj > p[0] && p[1] < ((xj - xi) * (p[0] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Approximate area of a lat/lng polygon in km² (equirectangular projection; fine at city scale). */
export function polygonAreaKm2(poly: LatLng[]): number {
  if (poly.length < 3) return 0;
  const lat0 = rad(poly[0][0]);
  const pts = poly.map(([la, ln]) => [rad(ln) * R * Math.cos(lat0), rad(la) * R]);
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

/** Nearest-neighbour order of points starting from `start` (used to order trip stops). */
export function nearestNeighbourOrder<T>(start: LatLng, items: T[], pos: (t: T) => LatLng): T[] {
  const left = [...items];
  const out: T[] = [];
  let cur = start;
  while (left.length) {
    let best = 0;
    let bestD = Infinity;
    left.forEach((t, i) => {
      const d = distanceKm(cur, pos(t));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const [t] = left.splice(best, 1);
    out.push(t);
    cur = pos(t);
  }
  return out;
}

/** Road distance estimate: straight-line × 1.3, summed along the path. */
export function pathKm(points: LatLng[]): number {
  let s = 0;
  for (let i = 1; i < points.length; i++) s += distanceKm(points[i - 1], points[i]);
  return Math.round(s * 1.3 * 10) / 10;
}
