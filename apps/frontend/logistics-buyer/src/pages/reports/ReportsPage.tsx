// Reports (/reports, spec 08 §8): Performance Report download. Login-only route (no requiredPage), Bootstrap markup.
import { useState } from 'react';
import Swal from 'sweetalert2';
import { authService } from '../../api/services/auth.service';
import { reportsService } from '../../api/services/reports.service';
import './ReportsPage.css';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function showSuccess(title: string, text: string) {
  Swal.fire({ icon: 'success', title, text, showConfirmButton: false, timer: 1500 });
}
function showWarning(title: string, text: string) {
  Swal.fire({ icon: 'warning', title, text, showConfirmButton: false, timer: 1500 });
}

export default function ReportsPage() {
  const [buyerId] = useState(() => authService.getCurrentUser()?.id || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  // `max` is today in UTC (as-built: in IST 00:00–05:29 the local today cannot be picked)
  const [today] = useState(() => new Date().toISOString().split('T')[0]);

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
  };

  // No loading state: repeated clicks fire repeated downloads (as-built).
  const downloadReport = async () => {
    if (!fromDate && !toDate) return showWarning('Warning', 'Please select both start date and end date to download the report');
    if (!fromDate) return showWarning('Warning', 'Please select a start date to download the report');
    if (!toDate) return showWarning('Warning', 'Please select an end date to download the report');
    if (new Date(toDate) < new Date(fromDate)) return showWarning('Warning', 'End date cannot be before start date');

    const params = { endDate: toDate, startDate: fromDate, buyerId }; // buyerId is sent even when empty
    try {
      const blob = await reportsService.downloadPerformanceReport(params);
      if (blob && blob.type === XLSX_MIME) {
        const file = new Blob([blob], { type: XLSX_MIME });
        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        // Dead branch in the original: `Performance_Report_<YYYY-MM-DD>.xlsx` when the first param value == 5 (never — it is endDate).
        a.download = (Object.values(params)[0] as unknown) == 5 ? `Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx` : 'Performance_Report.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.log('Unexpected response:', blob); // nothing downloaded, success still shown (as-built)
      }
      showSuccess('Success', 'Performance Report downloaded successfully');
    } catch (e) {
      console.error('Error downloading performance report:', e);
      showWarning('Warning!', 'No records found for the selected period.'); // every error maps to this text
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
          <p className="text-muted small">.</p>
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
                    <input type="date" id="fromDate" name="fromDate" className="form-control" max={today} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted" htmlFor="toDate">
                    To Date
                  </label>
                  <div className="input-group">
                    <input type="date" id="toDate" name="toDate" className="form-control" max={today} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center mt-5">
                <button className="btn btn-outline-secondary me-2" onClick={clearFilters}>
                  Clear Filters
                </button>
                <button className="btn btn-primary" onClick={downloadReport}>
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
