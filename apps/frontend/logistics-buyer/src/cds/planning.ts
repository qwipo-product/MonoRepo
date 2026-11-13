// Pure route maths for CDS plans: distance and multi-stop sequencing. Types only, so Node tests can load it.
import type { GeoPoint } from './types.ts';

// ---------------------------------------------------------------- geo

const R_KM = 6371;
/** Straight-line distance in km. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(h));
}
/** City roads are ~30% longer than the straight line. */
export const ROAD_FACTOR = 1.3;
export const AVG_SPEED_KMPH = 22;
export const SERVICE_MINUTES_PER_STOP = 10;

const pathKm = (pts: GeoPoint[]) => pts.slice(1).reduce((s, p, i) => s + haversineKm(pts[i], p), 0);

/**
 * Orders intermediate stops for the shortest path from `start` through every point (and on to `end` if given):
 * nearest-neighbour construction improved with 2-opt. Returns the visiting order as indices into `points`.
 */
export function sequenceStops(start: GeoPoint, points: GeoPoint[], end?: GeoPoint | null): number[] {
  if (points.length <= 1) return points.map((_, i) => i);
  const remaining = points.map((_, i) => i);
  const order: number[] = [];
  let cur = start;
  while (remaining.length) {
    let bi = 0;
    let bd = Infinity;
    remaining.forEach((idx, k) => {
      const d = haversineKm(cur, points[idx]);
      if (d < bd) { bd = d; bi = k; }
    });
    const [next] = remaining.splice(bi, 1);
    order.push(next);
    cur = points[next];
  }
  const cost = (o: number[]) => pathKm([start, ...o.map((i) => points[i]), ...(end ? [end] : [])]);
  let best = order;
  let bestCost = cost(best);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const cand = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
        const c = cost(cand);
        if (c + 1e-9 < bestCost) { best = cand; bestCost = c; improved = true; }
      }
    }
  }
  return best;
}

export function routeMetrics(path: GeoPoint[], serviceStops: number) {
  const distanceKm = Math.round(pathKm(path) * ROAD_FACTOR * 10) / 10;
  const etaMinutes = Math.round((distanceKm / AVG_SPEED_KMPH) * 60 + serviceStops * SERVICE_MINUTES_PER_STOP);
  return { distanceKm, etaMinutes };
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
