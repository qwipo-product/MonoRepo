// Port of IssueService (spec 06 §3, chunk-6VDY2U2U) — base `{buyerUrl}/issues`, uploads via `fileServicesUrl`.
// Error semantics are reproduced exactly (see the table in spec 06 §3):
//   getByFilters        → mapped object | null (logs "Error fetching issues:")
//   getIssueDetailsById → mapped issue | null on 2xx; the raw *error body* (unmapped) on HTTP error, else null
//   updateIssue / createIssue / fileUpload → raw response | error body | null (never throw)
//   requestIssueStatus  → raw response | error body | re-throws
import { getConfig } from '../config';
import { http, HttpError } from '../http';

const base = () => `${getConfig().buyerUrl}/issues`;

// ---------------------------------------------------------------- types

export interface IssueListFilters {
  pageNumber: number;
  pageSize: number;
  issueId: string;
  buyerId: string;
  logisticsOrderId: string;
  createdDate: string;
  searchText: string;
  status: string;
  level: string;
}

export interface IssueListActor { actor_type?: string; person_name?: string; org_name?: string; created_at?: string; [k: string]: any }
export interface IssueListAction { descriptor_code?: string; created_at?: string; [k: string]: any }
export interface IssueListRef { ref_type?: string; ref_id?: string; created_at?: string; [k: string]: any }

export interface IssueListItem {
  id: string | number;
  issueId: string;
  status: string;
  level: string;
  descriptorShortDesc: string;
  descriptorLongDesc: string;
  buyerOrderId: string;
  createdAt: string;
  updatedAt: string;
  contextDomain: string;
  transactionId: string;
  logisticsOrderId: string;
  buyerId: string;
  direction: string;
  buyerName: string;
  issuerefs: IssueListRef[];
  issueresolutions: any[];
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  consumerName: string;
  originName: string;
  refType: string;
  issueactors: IssueListActor[];
  issueactions: IssueListAction[];
}

export interface IssuePagination { pageNumber: number; pageSize: number; totalCount: number; totalPages: number }
export interface IssueStats { totalIssues: number; open: number; processing: number; resolved: number; closed: number }
export interface IssueListResult { issues: IssueListItem[]; pagination: IssuePagination; stats: IssueStats }

export interface IssueImage { url?: string; src?: string; href?: string; [k: string]: any }

export interface IssueAction {
  id?: string;
  descriptorCode?: string;
  descriptorName?: string;
  descriptorShortDesc?: string;
  descriptorLongDesc?: string;
  descriptorImages?: (IssueImage | string)[];
  createdAt?: string;
  refId?: string;
  refType?: string;
  action?: string;
  [k: string]: any;
}

export interface IssueActor { actorId?: string; actorType?: string; personName?: string; orgName?: string; createdAt?: string; [k: string]: any }
export interface IssueRef { refType?: string; refId?: string; createdAt?: string; [k: string]: any }
export interface IssueResolution { resolutionId?: string; descriptorCode?: string; updatedAt?: string; [k: string]: any }

/** Mapped details object (spec 06 §3.2). `createdAt`/`updatedAt` are PRE-FORMATTED strings. */
export interface IssueDetails {
  id?: string | number;
  issueId?: string;
  transactionId?: string;
  issueTitle?: string;
  issueDescription?: string;
  direction?: string;
  status?: string;
  level?: string;
  providerId?: string;
  providerName?: string;
  orderId?: string;
  resolutions?: IssueResolution[];
  /** Note the spelling (no "s") — the component reads `logisticsOrderId`, which never exists (spec 06 §11). */
  logisticOrderId?: string;
  createdAt?: string;
  updatedAt?: string;
  actions?: IssueAction[];
  actors?: IssueActor[];
  refs?: IssueRef[];
  fulfillmentName?: string;
  // aliases set by the details component
  issueactions?: IssueAction[];
  issueactors?: IssueActor[];
  issuerefs?: IssueRef[];
  [k: string]: any;
}

export interface UpdateIssueBody {
  issueId: string | number | undefined;
  level: string | undefined;
  transactionId: string;
  logisticsOrderId: string;
  actions: Record<string, any>[];
}

// ---------------------------------------------------------------- helpers

/** `formatDateTime` (spec 06 §2.4): dd-mm-yyyy HH:mm:ss (local), or "N/A". */
export function formatIssueDateTime(v: any): string {
  if (v === null || v === undefined || v === 'null' || v === 'undefined' || v === '') return 'N/A';
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'N/A';
    const p = (x: number) => String(x).padStart(2, '0');
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  } catch {
    return 'N/A';
  }
}

const ts = (v: any) => {
  const t = v ? new Date(v).getTime() : 0;
  return isNaN(t) ? 0 : t;
};
/** Newest first by the given date key (missing dates sort as 0). */
const newestFirst = <T extends Record<string, any>>(arr: T[] | undefined | null, key: string): T[] =>
  Array.isArray(arr) ? [...arr].sort((a, b) => ts(b?.[key]) - ts(a?.[key])) : (arr as any);

function mapListIssue(i: any): IssueListItem {
  const actors: IssueListActor[] = i.issueactors || [];
  const refs: IssueListRef[] = i.issuerefs || [];
  const consumer = actors.find((a) => a.actor_type === 'CONSUMER');
  const origin = actors.find((a) => a.actor_type === 'INTERFACING_NP');
  const refType = refs.some((r) => r.ref_type === 'FULFILLMENT') ? 'FULFILLMENT' : refs.some((r) => r.ref_type === 'ORDER') ? 'ORDER' : 'N/A';
  return {
    id: i.id,
    issueId: i.issueId,
    status: i.status,
    level: i.level,
    descriptorShortDesc: i.descriptorShortDesc,
    descriptorLongDesc: i.descriptorLongDesc,
    buyerOrderId: i.buyerOrderId,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    contextDomain: i.contextDomain,
    transactionId: i.transactionId,
    logisticsOrderId: i.logisticsOrderId,
    buyerId: i.buyerId,
    direction: i.direction,
    buyerName: i.buyerName,
    issuerefs: i.issuerefs,
    issueresolutions: i.issueresolutions,
    formattedCreatedAt: formatIssueDateTime(i.createdAt),
    formattedUpdatedAt: formatIssueDateTime(i.updatedAt),
    consumerName: consumer?.person_name || 'N/A',
    originName: origin?.person_name || 'N/A',
    refType,
    issueactors: newestFirst(i.issueactors, 'created_at'),
    issueactions: newestFirst(i.issueactions, 'created_at'),
  };
}

function mapDetails(d: any): IssueDetails {
  return {
    id: d.id,
    issueId: d.issueId,
    transactionId: d.transactionId,
    issueTitle: d.issueTitle,
    issueDescription: d.issueDescription,
    direction: d.direction,
    status: d.status,
    level: d.level,
    providerId: d.providerId,
    providerName: d.providerName,
    orderId: d.orderId,
    resolutions: d.resolutions,
    logisticOrderId: d.logisticOrderId,
    createdAt: formatIssueDateTime(d.createdAt),
    updatedAt: formatIssueDateTime(d.updatedAt),
    actions: newestFirst(d.actions, 'createdAt'),
    actors: newestFirst(d.actors, 'createdAt'),
    refs: newestFirst(d.refs, 'createdAt'),
    fulfillmentName: d.fulfillmentLocation?.deliveryLocation?.address?.name,
  };
}

// ---------------------------------------------------------------- service

export const issueService = {
  /** POST /issues/get_by_filters → `{issues, pagination, stats}` or `null` (never throws). */
  async getByFilters(filters: IssueListFilters): Promise<IssueListResult | null> {
    try {
      const res = await http.post<any>(`${base()}/get_by_filters`, filters);
      if (res?.success && res?.data) {
        return {
          issues: (res.data.issues || []).map(mapListIssue),
          pagination: res.data.pagination,
          stats: res.data.stats,
        };
      }
      return null;
    } catch (e) {
      console.error('Error fetching issues:', e);
      return null;
    }
  },

  /** GET /issues/get_by_id/{id} → mapped issue | null; on HTTP error the raw error body (or null). */
  async getIssueDetailsById(id: string | number): Promise<IssueDetails | null> {
    try {
      const res = await http.get<any>(`${base()}/get_by_id/${id}`);
      if (res?.success && res?.data) return mapDetails(res.data);
      return null;
    } catch (e) {
      const err = e as HttpError;
      return err?.error ? err.error : null;
    }
  },

  /** Raw GET (defined but unused in the original). */
  getIssueDetails(id: string | number) {
    return http.get<any>(`${base()}/get_by_id/${id}`);
  },

  /** POST /issues/update → raw response | error body | null. */
  async updateIssue(body: UpdateIssueBody): Promise<any> {
    try {
      return await http.post<any>(`${base()}/update`, body);
    } catch (e) {
      const err = e as HttpError;
      return err?.error ? err.error : null;
    }
  },

  /** POST /issues → raw response | error body | null. */
  async createIssue(body: Record<string, any>): Promise<any> {
    try {
      return await http.post<any>(`${base()}`, body);
    } catch (e) {
      const err = e as HttpError;
      return err?.error ? err.error : null;
    }
  },

  /** PUT {fileServicesUrl}/documents/logistics_buyer_info_provided (one file per call) → raw | error body | null. */
  async fileUpload(body: { fileName: string; fileExtension: string; fileData: string }): Promise<any> {
    try {
      return await http.put<any>(`${getConfig().fileServicesUrl}/documents/logistics_buyer_info_provided`, body);
    } catch (e) {
      const err = e as HttpError;
      return err?.error ? err.error : null;
    }
  },

  /** POST {buyerUrl}/fulfillment/req_for_issue_status → raw | error body | re-throws. */
  async requestIssueStatus(body: { issueId: any; logisticsOrderId: any; transactionId: any }): Promise<any> {
    try {
      return await http.post<any>(`${getConfig().buyerUrl}/fulfillment/req_for_issue_status`, body);
    } catch (e) {
      const err = e as HttpError;
      if (err?.error) return err.error;
      throw e;
    }
  },
};
