// Port of the beat-clusters service (chunk XXBWFWOZ) — base `{buyerUrl}/beat_clusters`. These calls THROW on HTTP error.
import { getConfig } from '../config';
import { http } from '../http';

export interface Cluster {
  id: string;
  name: string;
  createdAt: string;
  beats: { id: string; beatName: string }[];
  vehicleIds: string[];
  [k: string]: unknown;
}
export interface ClusterVehicle {
  id: string;
  registrationNumber: string;
  name?: string | null;
  volumetricCapacityKg?: string | null;
  weightCapacityKg?: string | null;
  state: 'available' | 'assigned' | 'inactive';
  assignedClusterId: string | null;
  assignedClusterName: string | null;
  [k: string]: unknown;
}
export interface ClusterBody {
  buyerId: string;
  name: string;
  beatIds: string[];
  vehicleIds: string[];
}

const base = () => `${getConfig().buyerUrl}/beat_clusters`;

export const clustersService = {
  async list(buyerId: string, search?: string): Promise<Cluster[]> {
    const params: Record<string, string> = { buyerId };
    if (search) params.search = search;
    const res = await http.get<any>(base(), { params });
    return res?.data?.clusters ?? [];
  },
  async getById(id: string, buyerId: string): Promise<Cluster | null> {
    const res = await http.get<any>(`${base()}/${id}`, { params: { buyerId } });
    return res?.data ?? null;
  },
  async availableVehicles(buyerId: string, search?: string): Promise<ClusterVehicle[]> {
    const params: Record<string, string> = { buyerId };
    if (search) params.search = search;
    const res = await http.get<any>(`${base()}/available-vehicles`, { params });
    return res?.data?.vehicles ?? [];
  },
  async create(body: ClusterBody) {
    const res = await http.post<any>(base(), body);
    return res?.data;
  },
  async update(id: string, body: ClusterBody) {
    const res = await http.put<any>(`${base()}/${id}`, body);
    return res?.data;
  },
  async remove(id: string, buyerId: string) {
    const res = await http.delete<any>(`${base()}/${id}`, { params: { buyerId } });
    return res?.data;
  },
};
