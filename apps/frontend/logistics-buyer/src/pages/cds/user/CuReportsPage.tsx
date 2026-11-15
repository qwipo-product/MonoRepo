// CDS User Reports (/cds/reports): replica of the LBNP Reports screen (src/pages/reports/ReportsPage.tsx) with only the
// Performance Report card. The data is the CDS store's own performance report from the CDS API; the Excel file is
// built in the browser with the `xlsx` package (one row per day, then a Total row).
import { useState } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { cdsApi, type Report } from '../../../api/services/cds.service';
import { alertError, useMeta } from '../ui';
import '../../reports/ReportsPage.css';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
/** The CDS performance report returns at most this many days (one row per day). */
const MAX_DAYS = 92;

function showSuccess(title: string, text: string) {
  void Swal.fire({ icon: 'success', title, text, showConfirmButton: false, timer: 1500 });
}
function showWarning(title: string, text: string) {
  void Swal.fire({ icon: 'warning', title, text, showConfirmButton: false, timer: 1500 });
}

const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** `YYYY-MM-DD` plus `n` days (local calendar). */
function addDays(ymd: string, n: number) {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toYmd(d);
}
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`)) / 86400000) + 1;

/** True when no day in the report has any orders, trips or km (the LBNP "no records" case). */
function isEmptyReport(r: Report) {
  return !r.rows.some((row) => r.columns.some((c) => typeof row[c.key] === 'number' && (row[c.key] as number) > 0));
}

/** Report columns as headers, one row per day, then the Total row. */
function downloadWorkbook(r: Report, fileName: string) {
  const aoa: (string | number)[][] = [r.columns.map((c) => c.label), ...r.rows.map((row) => r.columns.map((c) => row[c.key] ?? ''))];
  if (r.totals) aoa.push(r.columns.map((c, i) => (i === 0 ? 'Total' : r.totals?.[c.key] ?? '')));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = r.columns.map((c) => ({ wch: Math.max(12, c.label.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Performance Report');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const url = window.URL.createObjectURL(new Blob([out], { type: XLSX_MIME }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function CuReportsPage() {
  const meta = useMeta();
  const today = meta.data?.today ?? '';
  // Default range: the last 7 days up to today (CDS today). `picked` holds what the user changed or cleared.
  const [picked, setPicked] = useState<{ from?: string; to?: string }>({});
  const [busy, setBusy] = useState(false);
  const fromDate = picked.from ?? (today ? addDays(today, -6) : '');
  const toDate = picked.to ?? today;
  const [deviceToday] = useState(() => toYmd(new Date()));
  const maxDate = today || deviceToday;

  const clearFilters = () => setPicked({ from: '', to: '' });

  const downloadReport = async () => {
    if (!fromDate && !toDate) return showWarning('Warning', 'Please select both start date and end date to download the report');
    if (!fromDate) return showWarning('Warning', 'Please select a start date to download the report');
    if (!toDate) return showWarning('Warning', 'Please select an end date to download the report');
    if (toDate < fromDate) return showWarning('Warning', 'End date cannot be before start date');
    if (daysBetween(fromDate, toDate) > MAX_DAYS) return showWarning('Warning', `Please select a period of ${MAX_DAYS} days or less to download the report`);

    setBusy(true);
    try {
      const report = await cdsApi.report('performance', { from: fromDate, to: toDate });
      if (!report.rows.length || isEmptyReport(report)) return showWarning('Warning!', 'No records found for the selected period.');
      downloadWorkbook(report, `Performance_Report_${fromDate}_to_${toDate}.xlsx`);
      showSuccess('Success', 'Performance Report downloaded successfully');
    } catch (e) {
      void alertError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="reports-page container-fluid py-4 p-3 bg-light h-100">
      <div className="row px-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <i className="fas fa-chart-bar text-primary me-2 fs-5" />
            <h1 className="fs-3 mb-0 fw-bold">Reports</h1>
          </div>
          <p className="text-muted small">Download the performance report of your CDS store.</p>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-lg-12 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">Performance Report</h5>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label small text-muted" htmlFor="fromDate">
                    From Date
                  </label>
                  <div className="input-group">
                    <input type="date" id="fromDate" name="fromDate" className="form-control" max={maxDate} value={fromDate} onChange={(e) => setPicked((p) => ({ ...p, from: e.target.value }))} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted" htmlFor="toDate">
                    To Date
                  </label>
                  <div className="input-group">
                    <input type="date" id="toDate" name="toDate" className="form-control" max={maxDate} value={toDate} onChange={(e) => setPicked((p) => ({ ...p, to: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center mt-5">
                <button className="btn btn-outline-secondary me-2" onClick={clearFilters}>
                  Clear Filters
                </button>
                <button className="btn btn-primary" disabled={busy} onClick={() => void downloadReport()}>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
