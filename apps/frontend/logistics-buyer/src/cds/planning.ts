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

// ---------------------------------------------------------------- CDS service areas (polygons)

/** A polygon ring as [lat, lng] points (closed implicitly). */
export type Ring = [number, number][];

/** Ray casting: is the point inside the ring? Points on an edge count as inside. */
export function pointInPolygon(p: GeoPoint, ring: Ring): boolean {
  if (!ring || ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    if ((xi - p.lng) * (yj - p.lat) === (xj - p.lng) * (yi - p.lat) && Math.min(xi, xj) <= p.lng && p.lng <= Math.max(xi, xj) && Math.min(yi, yj) <= p.lat && p.lat <= Math.max(yi, yj)) return true;
    if (yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Area of a ring in km² (local flat approximation — fine for city-sized areas). */
export function ringAreaKm2(ring: Ring): number {
  if (!ring || ring.length < 3) return 0;
  const lat0 = (ring.reduce((a, [la]) => a + la, 0) / ring.length) * (Math.PI / 180);
  const kx = 111.32 * Math.cos(lat0);
  const ky = 110.57;
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += ring[j][1] * kx * ring[i][0] * ky - ring[i][1] * kx * ring[j][0] * ky;
  return Math.round(Math.abs(s / 2) * 10) / 10;
}

/**
 * The CDS store whose service area holds the retailer: active stores whose polygon contains the point; when
 * polygons overlap, the nearest store. A store without a polygon falls back to its locality list. null → not
 * served by any CDS (3PL).
 */
export function serviceStoreFor<S extends GeoPoint & { id: string; active: boolean; polygon?: Ring; localities?: string[] }>(stores: S[], r: GeoPoint & { locality?: string }): S | null {
  const hits = stores.filter((s) => s.active && (s.polygon && s.polygon.length >= 3 ? pointInPolygon(r, s.polygon) : !!r.locality && !!s.localities?.includes(r.locality)));
  if (hits.length <= 1) return hits[0] ?? null;
  return hits.reduce((a, b) => (haversineKm(r, a) <= haversineKm(r, b) ? a : b));
}
