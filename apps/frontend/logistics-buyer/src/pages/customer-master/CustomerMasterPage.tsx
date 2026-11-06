// Port of CustomerMasterComponent (chunk SMDAVJ5U) — /customer-master (sidebar "Customers").
// Spec: docs/specs/02-create-order-customer-master.md §3. No in-screen permission gating (as built).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import Paginator from '../../components/Paginator';
import { DEFAULT_PAGE_SIZE_OPTIONS, usePagePermissions } from '../../hooks/usePagePermissions';
import { customerMasterService, type CustomerLocationUpdate, type CustomerMasterRow } from '../../api/services/customerMaster.service';
import UpdateLocationDialog from './UpdateLocationDialog';
import './CustomerMasterPage.css';

/** Angular `date:'dd/MM/yy'` (local time zone). */
function formatDdMmYy(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
}

interface SnackState { key: number; message: string; duration: number }

export default function CustomerMasterPage() {
  const { buyerId } = usePagePermissions('buyer_orders');

  const [rows, setRows] = useState<CustomerMasterRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const statusFilter = ''; // has no UI
  const [editing, setEditing] = useState<CustomerMasterRow | null>(null);
  const [snack, setSnack] = useState<SnackState | null>(null);

  // loadCustomers() reads the component's current fields (like the Angular instance does)
  const state = useRef({ buyerId, searchText, sourceFilter, pageNumber, pageSize });
  useLayoutEffect(() => {
    state.current.buyerId = buyerId;
  }, [buyerId]);
  const searchTimer = useRef<number | undefined>(undefined);

  const loadCustomers = useCallback(async () => {
    const s = state.current;
    if (!s.buyerId) return;
    setIsLoading(true);
    try {
      const res = await customerMasterService.getCustomers({
        buyerId: s.buyerId,
        page: s.pageNumber,
        limit: s.pageSize,
        search: s.searchText.trim() || undefined,
        status: statusFilter || undefined,
        source: s.sourceFilter || undefined,
      });
      if (res) {
        setRows(res.data);
        setTotalCount(res.total);
      }
      // null (error / success:false): the old rows are kept and nothing is shown
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
    return () => window.clearTimeout(searchTimer.current);
  }, [loadCustomers]);

  const showSnack = (message: string, duration: number) => setSnack({ key: Date.now(), message, duration });

  const setPage = (n: number) => {
    state.current.pageNumber = n;
    setPageNumber(n);
  };

  // searchSubject.pipe(debounceTime(400)) → page 1 + reload (no minimum length, no distinct check)
  const onSearchInput = (value: string) => {
    state.current.searchText = value;
    setSearchText(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setPage(1);
      loadCustomers();
    }, 400);
  };

  // clear reloads immediately; a debounced emission already pending still fires (second reload, as built)
  const clearSearch = () => {
    state.current.searchText = '';
    setSearchText('');
    setPage(1);
    loadCustomers();
  };

  const onSourceChange = (value: string) => {
    state.current.sourceFilter = value;
    setSourceFilter(value);
    setPage(1);
    loadCustomers();
  };

  const onPage = (e: { pageIndex: number; pageSize: number }) => {
    setPage(e.pageIndex + 1);
    state.current.pageSize = e.pageSize;
    setPageSize(e.pageSize);
    loadCustomers();
  };

  const onDialogClosed = async (customer: CustomerMasterRow, result?: CustomerLocationUpdate) => {
    setEditing(null);
    if (!result) return;
    try {
      const data = await customerMasterService.updateCustomerLocation(customer.id, state.current.buyerId, result);
      if (data) {
        await loadCustomers();
        if (data.ordersUpdated > 0) showSnack(`Updated. ${data.ordersUpdated} order(s) synced.`, 4000);
        else if (data.skippedOrderStatuses.length > 0) showSnack(`Updated. No orders synced — orders in: ${data.skippedOrderStatuses.join(', ')}.`, 6000);
        else showSnack('Customer updated successfully.', 3000);
      } else {
        showSnack('Failed to update customer.', 3000);
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      showSnack('An error occurred while updating.', 3000);
    }
  };

  const deleteCustomer = async (customer: CustomerMasterRow) => {
    const confirm = await Swal.fire({
      title: 'Delete Customer?',
      text: `Are you sure you want to delete "${customer.business_name || customer.customer_unique_id}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;
    try {
      const ok = await customerMasterService.deleteCustomer(customer.id, state.current.buyerId);
      if (ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Customer record has been deleted.', confirmButtonColor: '#3085d6' }).then(() => loadCustomers());
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete customer. Please try again.', confirmButtonColor: '#3085d6' });
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while deleting.' });
    }
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
          <p className="text-muted small mb-0">Manage customer location data and sync with orders.</p>
        </div>
        <div className="col-md-6">
          <div className="d-flex justify-content-md-end justify-content-start align-items-end gap-2 pt-3">
            <div className="position-relative" style={{ minWidth: 320 }}>
              <input
                type="text"
                className="form-control pe-4"
                autoComplete="off"
                placeholder="Search by name, mobile, UID..."
                value={searchText}
                onChange={(e) => onSearchInput(e.target.value)}
              />
              {searchText && (
                <button
                  type="button"
                  className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted"
                  title="Clear search"
                  onClick={clearSearch}
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            <select className="form-select form-select-sm" style={{ width: 'auto' }} value={sourceFilter} onChange={(e) => onSourceChange(e.target.value)}>
              <option value="">All Sources</option>
              <option value="system">System</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="mat-card mat-elevation-z3">
          <div className="mat-card-content p-0">
            <div className="table-responsive">
              {isLoading ? (
                <DataLoading overlay={false} message="Loading customers..." showTip />
              ) : (
                <table className="mat-mdc-table w-100">
                  <thead>
                    <tr className="mat-mdc-header-row bg-white small">
                      <th className={thLeft}><i className="fas fa-fingerprint me-1 text-primary" />UID</th>
                      <th className={thLeft}><i className="fas fa-building me-1 text-primary" />Business Name</th>
                      <th className={thLeft}><i className="fas fa-phone me-1 text-primary" />Mobile</th>
                      <th className={thCenter}><i className="fas fa-crosshairs me-1 text-primary" />Latitude</th>
                      <th className={thCenter}><i className="fas fa-crosshairs me-1 text-primary" />Longitude</th>
                      <th className={thCenter}><i className="fas fa-box me-1 text-primary" />Bulk</th>
                      <th className={thCenter}><i className="fas fa-clock me-1 text-primary" />Last Updated</th>
                      <th className={thCenter}><i className="fas fa-tag me-1 text-primary" />Source</th>
                      <th className={thCenter}><i className="fas fa-cogs me-1 text-primary" />Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr className="mat-mdc-row small" key={c.id}>
                        <td className="text-left py-2 px-2">{c.customer_unique_id}</td>
                        <td className="text-left py-2 px-2">{c.business_name || '—'}</td>
                        <td className="text-left py-2 px-2">{c.mobile_number || '—'}</td>
                        <td className="text-center py-2 px-2">{c.latitude || '—'}</td>
                        <td className="text-center py-2 px-2">{c.longitude || '—'}</td>
                        <td className="text-center py-2 px-2">
                          {c.is_bulk_order ? <span className="badge bg-warning text-dark">Yes</span> : <span className="badge bg-light text-muted">No</span>}
                        </td>
                        <td className="text-center py-2 px-2">{formatDdMmYy(c.updated_at)}</td>
                        <td className="text-center py-2 px-2">
                          <span className={`badge ${c.updated_by === 'system' ? 'bg-secondary' : 'bg-info text-dark'}`}>{c.updated_by || '—'}</span>
                        </td>
                        <td className="text-center py-2 px-2">
                          <div className="d-inline-flex gap-1">
                            <button type="button" className="btn btn-sm" title="Edit" onClick={() => setEditing(c)}>
                              <i className="fas fa-pen" />
                            </button>
                            <button type="button" className="btn btn-sm" title="Delete" onClick={() => deleteCustomer(c)}>
                              <i className="fas fa-trash text-danger" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr className="mat-row">
                        <td colSpan={10} className="py-4">
                          <div className="text-center text-muted small">
                            <i className="fas fa-users fs-3 mb-2" />
                            <p className="mb-0 mt-2 small">No customers found</p>
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
                  <Paginator length={totalCount} pageIndex={pageNumber - 1} pageSize={pageSize} pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS} onPage={onPage} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpdateLocationDialog
        key={editing?.id ?? 'none'}
        open={!!editing}
        customer={editing}
        onClose={(result) => editing && onDialogClosed(editing, result)}
      />

      <Snackbar
        key={snack?.key}
        open={!!snack}
        autoHideDuration={snack?.duration}
        onClose={(_e, reason) => reason !== 'clickaway' && setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={snack?.message}
        className="customer-master-snackbar"
        action={
          <Button size="small" onClick={() => setSnack(null)} sx={{ color: '#abc7ff' }}>
            Close
          </Button>
        }
      />
    </div>
  );
}
