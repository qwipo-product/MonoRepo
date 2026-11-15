// CDS User Customers (/cds/customers): replica of the LBNP Customers screen (src/pages/customer-master/
// CustomerMasterPage.tsx), view only. Shows the customers served by the user's CDS store. The API returns every row;
// search and pagination are done here. Removed by decision: Source filter, Edit, Delete, Bulk / Last Updated / Source.
import { useMemo, useState } from 'react';
import DataLoading from '../../../components/DataLoading';
import Paginator from '../../../components/Paginator';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../../../hooks/usePagePermissions';
import { cdsApi } from '../../../api/services/cds.service';
import { useLoad } from '../ui';
import '../../customer-master/CustomerMasterPage.css';

const coord = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? String(n) : '—');

export function CuCustomersPage() {
  const { data, error, loading, reload } = useLoad(() => cdsApi.customers(), []);
  const [searchText, setSearchText] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const all = data ?? [];
    if (!q) return all;
    return all.filter((c) => [c.name, c.phone, c.code].some((v) => (v ?? '').toLowerCase().includes(q)));
  }, [data, searchText]);

  const totalCount = filtered.length;
  const page = Math.min(pageNumber, Math.max(1, Math.ceil(totalCount / pageSize)));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onSearchInput = (value: string) => {
    setSearchText(value);
    setPageNumber(1);
  };
  const clearSearch = () => onSearchInput('');
  const onPage = (e: { pageIndex: number; pageSize: number }) => {
    setPageNumber(e.pageIndex + 1);
    setPageSize(e.pageSize);
  };

  const thLeft = 'text-left bg-white text-uppercase fw-bold py-2 px-2 small';
  const thCenter = 'text-center bg-white text-uppercase fw-bold py-2 px-2 small';

  return (
    <div className="customer-master-page container-fluid p-3 bg-light h-100">
      <div className="row px-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center mb-1">
            <i className="fas fa-users text-primary me-2 fs-5" />
            <h1 className="fs-3 mb-0 fw-bold">Customers</h1>
          </div>
          <p className="text-muted small mb-0">View the customers served by your CDS store and their location data.</p>
        </div>
        <div className="col-md-6">
          <div className="d-flex justify-content-md-end justify-content-start align-items-end gap-2 pt-3">
            <div className="position-relative" style={{ minWidth: 320 }}>
              <input
                type="text"
                className="form-control pe-4"
                autoComplete="off"
                placeholder="Search by name, mobile, code..."
                aria-label="Search customers"
                value={searchText}
                onChange={(e) => onSearchInput(e.target.value)}
              />
              {searchText && (
                <button
                  type="button"
                  className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted"
                  title="Clear search"
                  aria-label="Clear search"
                  onClick={clearSearch}
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="mat-card mat-elevation-z3">
          <div className="mat-card-content p-0">
            <div className="table-responsive">
              {loading && !data ? (
                <DataLoading overlay={false} message="Loading customers..." showTip />
              ) : (
                <table className="mat-mdc-table w-100">
                  <thead>
                    <tr className="mat-mdc-header-row bg-white small">
                      <th className={thLeft}><i className="fas fa-fingerprint me-1 text-primary" />Code</th>
                      <th className={thLeft}><i className="fas fa-building me-1 text-primary" />Business Name</th>
                      <th className={thLeft}><i className="fas fa-phone me-1 text-primary" />Mobile</th>
                      <th className={thCenter}><i className="fas fa-crosshairs me-1 text-primary" />Latitude</th>
                      <th className={thCenter}><i className="fas fa-crosshairs me-1 text-primary" />Longitude</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr className="mat-mdc-row small" key={c.id}>
                        <td className="text-left py-2 px-2">{c.code || '—'}</td>
                        <td className="text-left py-2 px-2">{c.name || '—'}</td>
                        <td className="text-left py-2 px-2">{c.phone || '—'}</td>
                        <td className="text-center py-2 px-2">{coord(c.lat)}</td>
                        <td className="text-center py-2 px-2">{coord(c.lng)}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr className="mat-row">
                        <td colSpan={5} className="py-4">
                          <div className="text-center text-muted small">
                            <i className={`fas ${error ? 'fa-triangle-exclamation' : 'fa-users'} fs-3 mb-2`} />
                            {error ? (
                              <p className="mb-0 mt-2 small">
                                {error}{' '}
                                <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={reload}>
                                  Retry
                                </button>
                              </p>
                            ) : (
                              <p className="mb-0 mt-2 small">No customers found</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {totalCount > 0 && (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-1 bg-white">
                <div className="text-muted small" />
                <div className="bg-transparent shadow-none" aria-label="Select page of customers">
                  <Paginator length={totalCount} pageIndex={page - 1} pageSize={pageSize} pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS} onPage={onPage} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
