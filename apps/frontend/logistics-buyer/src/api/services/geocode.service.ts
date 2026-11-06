// Port of the geocode service used by <app-address-autocomplete> (chunk MZXBUYWH). Base `{buyerUrl}/geocode`.
import { getConfig } from '../config';
import { http } from '../http';

export type GeocodeProvider = 'google' | 'geoapify';

export interface GeocodeSuggestion {
  formatted: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lon: number;
}

export const geocodeService = {
  /** GET /geocode/autocomplete?text=&provider= → data || []. Under 3 chars returns [] without calling; errors are logged and give []. */
  async autocomplete(text: string, provider: GeocodeProvider): Promise<GeocodeSuggestion[]> {
    const t = (text || '').trim();
    if (t.length < 3) return [];
    try {
      const res = await http.get<any>(`${getConfig().buyerUrl}/geocode/autocomplete`, { params: { text: t, provider } });
      return res?.data || [];
    } catch (err) {
      console.error('Geocode autocomplete failed:', err);
      return [];
    }
  },
};
