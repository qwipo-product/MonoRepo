// Port of the beats service (chunk YO56CZTV) — base `{buyerUrl}/beats`. These calls THROW on HTTP error.
import { getConfig } from '../config';
import { http } from '../http';

export interface Beat {
  id: string;
  beatName: string;
  area?: string | null;
  clusterId?: string | null;
  clusterName?: string | null;
  [k: string]: unknown;
}
export interface BeatListResponse {
  beats: Beat[];
  totalCount: number;
}
export interface BeatBody {
  buyerId: string;
  beatName: string;
  area: string;
}

const base = () => `${getConfig().buyerUrl}/beats`;

export const beatsService = {
  /** GET /beats — `pageNumber`/`pageSize` are sent as strings; `search` only when truthy. Returns `data` (may be undefined). */
  async list(buyerId: string, opts: { pageNumber?: number | string; pageSize?: number | string; search?: string } = {}): Promise<BeatListResponse | undefined> {
    const params: Record<string, string> = {
      buyerId,
      pageNumber: String(opts.pageNumber ?? '1'),
      pageSize: String(opts.pageSize ?? '25'),
    };
    if (opts.search) params.search = opts.search;
    const res = await http.get<any>(base(), { params });
    return res?.data;
  },
  async create(body: BeatBody) {
    const res = await http.post<any>(base(), body);
    return res?.data;
  },
  async update(id: string, body: BeatBody) {
    const res = await http.put<any>(`${base()}/${id}`, body);
    return res?.data;
  },
  async remove(id: string, buyerId: string) {
    const res = await http.delete<any>(`${base()}/${id}`, { params: { buyerId } });
    return res?.data;
  },
  /** POST /beats/bulk — `area: undefined` keys are dropped by JSON serialisation. */
  async bulkCreate(body: { buyerId: string; beats: { beatName: string; area?: string }[] }) {
    const res = await http.post<any>(`${base()}/bulk`, body);
    return res?.data;
  },
};
