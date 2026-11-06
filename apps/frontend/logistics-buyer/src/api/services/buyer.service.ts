// Port of BuyerService (spec 00 §13.2) — base config key `buyerUrl`.
import { getConfig } from '../config';
import { http, HttpError } from '../http';

const base = () => getConfig().buyerUrl;

export const buyerService = {
  async getBuyerById(id: string) {
    const res = await http.get<any>(`${base()}/buyer/${id}`, { params: { type: 'Id' } });
    return res.data;
  },
  updateBuyer(b: { id: string; name?: string; businessName?: string; email?: string; mobileNumber?: string }) {
    return http.put<any>(`${base()}/buyer`, { id: b.id, updateAttributes: { name: b.name, businessName: b.businessName, email: b.email, mobileNumber: b.mobileNumber } });
  },
  /** Never throws: resolves `{success:true}` or `{success:false, message}`. */
  async verifyMobileNumber(mobile: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await http.get<any>(`${base()}/buyer/verify/${mobile}`);
      if (res?.success) return { success: true };
      return { success: false, message: res?.error?.message || 'Verification failed' };
    } catch (e) {
      const err = e as HttpError;
      if (err.status === 404) return { success: false, message: 'User with this mobile number not found' };
      return { success: false, message: err.error?.message || 'An error occurred during verification' };
    }
  },
  register(body: Record<string, unknown>) {
    return http.post<any>(`${base()}/buyer`, body);
  },
};
