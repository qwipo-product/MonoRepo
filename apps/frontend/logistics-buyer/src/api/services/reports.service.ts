// Port of the report-download service (chunk GSZLZMEB) — `{buyerUrl}/performance-report/download`.
import { getConfig } from '../config';
import { http } from '../http';

export interface PerformanceReportParams {
  endDate: string;
  startDate: string;
  buyerId: string;
}

export const reportsService = {
  /**
   * GET with `responseType: "blob"`. The query string is built by hand and NOT URL-encoded (as-built).
   * Throws on HTTP error (the page maps every error to the same warning).
   */
  downloadPerformanceReport(p: PerformanceReportParams): Promise<Blob> {
    const url = `${getConfig().buyerUrl}/performance-report/download?startDate=${p.startDate}&endDate=${p.endDate}&buyerId=${p.buyerId}`;
    return http.get<Blob>(url, { responseType: 'blob' });
  },
};
