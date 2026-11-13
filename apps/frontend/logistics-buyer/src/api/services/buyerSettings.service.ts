// Port of BuyerSettingsService (spec 00 §13.3). Faithful: every method swallows errors and returns null.
import { getConfig } from '../config';
import { http } from '../http';

const base = () => `${getConfig().buyerUrl}/buyer_settings`;

export const buyerSettingsService = {
  async getBuyerSettings(buyerId: string) {
    try {
      const res = await http.get<any>(`${base()}/${buyerId}`);
      return res.data || null;
    } catch (e) {
      console.error('Error getting buyer settings:', e);
      return null;
    }
  },
  async patchBuyerConfig(buyerId: string, body: unknown) {
    try {
      const res = await http.patch<any>(`${base()}/${buyerId}/buyer_config`, body);
      return res.data || null;
    } catch (e) {
      console.error('Error patching buyer_config:', e);
      return null;
    }
  },
  async saveBuyerSettings(body: unknown) {
    try {
      const res = await http.post<any>(base(), body);
      return res.data || null;
    } catch (e) {
      console.error('Error saving buyer settings:', e);
      return null;
    }
  },
};
