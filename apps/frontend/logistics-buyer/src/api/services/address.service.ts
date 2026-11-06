// Port of AddressService (chunk QFRO6JWU) — base `{buyerUrl}/addresses`.
import { getConfig } from '../config';
import { http } from '../http';

const base = () => `${getConfig().buyerUrl}/addresses`;

export const addressService = {
  getAddresses: (buyerId: string) => http.get<any>(`${base()}/buyerId/${buyerId}`),
  getDefaultAddress: (buyerId: string) => http.get<any>(`${base()}/buyerId/${buyerId}/default`),
  createAddress: (body: unknown) => http.post<any>(`${base()}/create`, body),
  updateAddress: (body: unknown) => http.put<any>(`${base()}/update`, body),
  /** The original POSTs (not DELETE) to /delete/{id}. */
  deleteAddress: (id: string) => http.post<any>(`${base()}/delete/${id}`, {}),
};
