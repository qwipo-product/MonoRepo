/* Mock geocoding for the location picker.

   Stands in for Google Places: `PLACES` is the "search index", `nearestPlace`
   is the reverse-geocode (pin position → address), and coordinates are a plain
   0–1000 grid rather than lat/lng, since the map itself is drawn rather than
   tiled.

   To swap in the real thing, replace the three functions below —
   searchPlaces (Autocomplete), nearestPlace (Geocoding reverse lookup) and
   CURRENT_PLACE_ID (navigator.geolocation) — and keep the Place shape. Nothing
   else in the flow reads the grid coordinates. */

export interface Place {
  id: string;
  /** Short name shown as the address title, e.g. "Rai Durg". */
  name: string;
  /** Locality line under the title. */
  locality: string;
  city: string;
  state: string;
  pincode: string;
  /** Position on the drawn map, 0–1000 on both axes. */
  x: number;
  y: number;
}

export const PLACES: Place[] = [
  { id: 'rai-durg', name: 'Rai Durg', locality: 'Rai Durg, Hitech City', city: 'Hyderabad', state: 'Telangana', pincode: '500032', x: 420, y: 380 },
  { id: 'gachibowli', name: 'Gachibowli', locality: 'Gachibowli, Serilingampally', city: 'Hyderabad', state: 'Telangana', pincode: '500032', x: 250, y: 470 },
  { id: 'madhapur', name: 'Madhapur', locality: 'Madhapur, Serilingampally', city: 'Hyderabad', state: 'Telangana', pincode: '500081', x: 560, y: 300 },
  { id: 'hitech-city', name: 'Hitech City', locality: 'HITEC City, Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081', x: 480, y: 250 },
  { id: 'kondapur', name: 'Kondapur', locality: 'Kondapur, Serilingampally', city: 'Hyderabad', state: 'Telangana', pincode: '500084', x: 300, y: 240 },
  { id: 'jubilee-hills', name: 'Jubilee Hills', locality: 'Jubilee Hills, Shaikpet', city: 'Hyderabad', state: 'Telangana', pincode: '500033', x: 700, y: 400 },
  { id: 'banjara-hills', name: 'Banjara Hills', locality: 'Banjara Hills, Khairatabad', city: 'Hyderabad', state: 'Telangana', pincode: '500034', x: 790, y: 520 },
  { id: 'kukatpally', name: 'Kukatpally', locality: 'Kukatpally, Balanagar', city: 'Hyderabad', state: 'Telangana', pincode: '500072', x: 380, y: 100 },
  { id: 'miyapur', name: 'Miyapur', locality: 'Miyapur, Serilingampally', city: 'Hyderabad', state: 'Telangana', pincode: '500049', x: 160, y: 120 },
  { id: 'ameerpet', name: 'Ameerpet', locality: 'Ameerpet, Khairatabad', city: 'Hyderabad', state: 'Telangana', pincode: '500016', x: 690, y: 200 },
  { id: 'begumpet', name: 'Begumpet', locality: 'Begumpet, Secunderabad', city: 'Hyderabad', state: 'Telangana', pincode: '500016', x: 830, y: 260 },
  { id: 'secunderabad', name: 'Secunderabad', locality: 'Secunderabad, Sitaphalmandi', city: 'Hyderabad', state: 'Telangana', pincode: '500003', x: 900, y: 120 },
  { id: 'kothaguda', name: 'Kothaguda', locality: 'Kothaguda, Serilingampally', city: 'Hyderabad', state: 'Telangana', pincode: '500084', x: 360, y: 320 },
  { id: 'nanakramguda', name: 'Nanakramguda', locality: 'Nanakramguda, Gachibowli', city: 'Hyderabad', state: 'Telangana', pincode: '500032', x: 200, y: 620 },
  { id: 'manikonda', name: 'Manikonda', locality: 'Manikonda, Puppalaguda', city: 'Hyderabad', state: 'Telangana', pincode: '500089', x: 520, y: 620 },
];

/** Where "Use current location" drops the pin. */
export const CURRENT_PLACE_ID = 'rai-durg';

export function placeById(id: string): Place {
  return PLACES.find((p) => p.id === id) ?? PLACES[0];
}

/** Autocomplete — matches on name, locality or pincode. */
export function searchPlaces(query: string): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.locality.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.pincode.startsWith(q)
  ).slice(0, 6);
}

/** Reverse geocode — the place nearest the dropped pin. */
export function nearestPlace(x: number, y: number): Place {
  let best = PLACES[0];
  let bestD = Infinity;
  for (const p of PLACES) {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

/** One-line address for a pin, e.g. "Rai Durg, Hitech City, Hyderabad, 500032". */
export function formatPlace(p: Place): string {
  return `${p.locality}, ${p.city}, ${p.pincode}`;
}
