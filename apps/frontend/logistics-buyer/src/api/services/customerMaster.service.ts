// Port of the customer-master service (chunk SMDAVJ5U). Base `{buyerUrl}/buyer-customer-master`.
// Every method swallows errors (returns null / false), exactly like the original.
import { getConfig } from '../config';
import { http } from '../http';

const base = () => `${getConfig().buyerUrl}/buyer-customer-master`;

export interface CustomerMasterRow {
  id: string;
  customer_unique_id: string;
  buyer_id: string;
  mobile_number: string | null;
  business_name: string | null;
  customer_name: string | null;
  latitude: string | null;
  longitude: string | null;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  is_bulk_order: boolean;
}

export interface CustomerListResponse {
  data: CustomerMasterRow[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerLocationUpdate {
  latitude: string;
  longitude: string;
  address?: string;
  is_bulk_order: boolean;
}

export interface CustomerUpdateResult {
  ordersUpdated: number;
  skippedOrderStatuses: string[];
  customer?: CustomerMasterRow;
}

export const customerMasterService = {
  /** GET /buyer-customer-master/?buyerId&page&limit[&search][&status][&source] (note the trailing slash). */
  async getCustomers(q: { buyerId: string; page: number; limit: number; search?: string; status?: string; source?: string }): Promise<CustomerListResponse | null> {
    try {
      const params: Record<string, string | number> = { buyerId: q.buyerId, page: q.page, limit: q.limit };
      if (q.search) params.search = q.search;
      if (q.status) params.status = q.status;
      if (q.source) params.source = q.source;
      const res = await http.get<any>(`${base()}/`, { params });
      return res?.success && res.data ? res.data : null;
    } catch (err) {
      console.error('Error fetching customers:', err);
      return null;
    }
  },

  /** PUT /buyer-customer-master/{id}?buyerId= → data if success && data, else null. */
  async updateCustomerLocation(id: string, buyerId: string, body: CustomerLocationUpdate): Promise<CustomerUpdateResult | null> {
    try {
      const res = await http.put<any>(`${base()}/${id}`, body, { params: { buyerId } });
      return res?.success && res.data ? res.data : null;
    } catch (err) {
      console.error('Error updating customer:', err);
      return null;
    }
  },

  /** DELETE /buyer-customer-master/{id}?buyerId= → success === true; HTTP errors give false. */
  async deleteCustomer(id: string, buyerId: string): Promise<boolean> {
    try {
      const res = await http.delete<any>(`${base()}/${id}`, { params: { buyerId } });
      return res?.success === true;
    } catch (err) {
      console.error('Error deleting customer:', err);
      return false;
    }
  },
};
