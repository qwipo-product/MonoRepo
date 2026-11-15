// CDS User — Orders (route /cds/orders). Replica of the LBNP Orders screen (src/pages/orders/OrdersPage.tsx) with the
// CDS store's own orders. The handover OTP reaches the CDS User by SMS; it is not shown on this screen.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import dayjs, { type Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DataLoading from '../../../components/DataLoading';
import Paginator from '../../../components/Paginator';
import { cdsApi, type OrderRow } from '../../../api/services/cds.service';
import { ORDER_STATUS } from '../../../cds/status';
import type { OrderStatus } from '../../../cds/types';
import { formatDateDMY } from '../../../utils/helpers';
import { ngNumber } from '../../orders/useInstance';
import { ErrorBox, useLoad } from '../ui';
import '../../../components/FiltersModal.css';
import '../../orders/OrdersPage.css';
import './CuOrders.css';

interface CuOrderFilters {
  status: OrderStatus | '';
  startDate: string;
  endDate: string;
  searchText: string;
}

const EMPTY_FILTERS: CuOrderFilters = { status: '', startDate: '', endDate: '', searchText: '' };
const FILTERS_KEY = 'cdsCuOrderFilters';
const PAGE_SIZES = [5, 10, 25, 50];
/** Orders whose accepted units are at the store and still to be delivered (the KPI cards). */
const TO_DELIVER: OrderStatus[] = ['READY_FOR_DELIVERY', 'DELIVERY_PLANNED', 'OUT_FOR_DELIVERY'];
const STATUS_OPTIONS = Object.keys(ORDER_STATUS) as OrderStatus[];

const isYmd = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Status, dates and search text survive a reload (like LBNP); page number and size always reset. */
function readSavedFilters(): CuOrderFilters {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return EMPTY_FILTERS;
    const p = JSON.parse(raw) as Partial<CuOrderFilters>;
    return {
      status: p.status && p.status in ORDER_STATUS ? p.status : '',
      startDate: isYmd(p.startDate) ? p.startDate : '',
      endDate: isYmd(p.endDate) ? p.endDate : '',
      searchText: typeof p.searchText === 'string' ? p.searchText : '',
    };
  } catch {
    return EMPTY_FILTERS;
  }
}

function saveFilters(f: CuOrderFilters) {
  try {
    if (f.status || f.startDate || f.endDate || f.searchText) localStorage.setItem(FILTERS_KEY, JSON.stringify(f));
    else localStorage.removeItem(FILTERS_KEY);
  } catch {
    // storage not available — filters just do not survive a reload
  }
}

/** "5th Jan 2025", as on the LBNP filter chips. */
function formatChipDate(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  const day = d.getDate();
  const suffix = day >= 11 && day <= 20 ? 'th' : day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${day}${suffix} ${month} ${d.getFullYear()}`;
}


const COLUMNS: { key: string; header: string; icon: string; align: 'center' | 'left' }[] = [
  { key: 'createdDate', header: 'Created Date', icon: 'fas fa-calendar', align: 'center' },
  { key: 'orderDate', header: 'Order Date', icon: 'fas fa-calendar', align: 'center' },
  { key: 'orderNo', header: 'Order Number', icon: 'fas fa-file-invoice', align: 'left' },
  { key: 'retailer', header: 'Retailer Name', icon: 'fas fa-store', align: 'left' },
  { key: 'distributor', header: 'Distributor', icon: 'fas fa-industry', align: 'left' },
  { key: 'mobile', header: 'Mobile Number', icon: 'fas fa-phone', align: 'left' },
  { key: 'status', header: 'Status', icon: 'fas fa-info-circle', align: 'center' },
  { key: 'tripNumber', header: 'Trip Number', icon: 'fas fa-truck', align: 'center' },
  { key: 'actions', header: 'Actions', icon: 'fas fa-cogs', align: 'center' },
];

export function CuOrdersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CuOrderFilters>(readSavedFilters);
  const [searchText, setSearchText] = useState(filters.searchText);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const searchTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);
  useEffect(() => saveFilters(filters), [filters]);

  // ---------------------------------------------------------------- data
  const orders = useLoad(
    () => cdsApi.searchOrders({
      statuses: filters.status ? [filters.status] : [],
      search: filters.searchText || undefined,
      fromDate: filters.startDate || undefined,
      toDate: filters.endDate || undefined,
      pageNumber,
      pageSize,
    }),
    [filters, pageNumber, pageSize],
  );
  // KPI cards always describe the orders still to be delivered, whatever filters are active (as LBNP).
  const toDeliver = useLoad(() => cdsApi.searchOrders({ statuses: TO_DELIVER, pageSize: 0 }), []);
  const trips = useLoad(() => cdsApi.searchTrips({ types: ['RETAILER_DELIVERY'], pageSize: 0 }), []);

  const tripNoById = useMemo(() => new Map((trips.data?.rows ?? []).map((t) => [t.id, t.tripNo])), [trips.data]);
  const kpi = useMemo(() => {
    const rows = toDeliver.data?.rows ?? [];
    return {
      customers: new Set(rows.map((o) => o.retailerId)).size,
      orders: rows.length,
      weightKg: rows.reduce((a, o) => a + o.lines.reduce((b, l) => b + Math.max(0, l.acceptedQty - l.deliveredQty) * l.unitWeightKg, 0), 0),
    };
  }, [toDeliver.data]);


  const rows = orders.data?.rows ?? [];
  const total = orders.data?.total ?? 0;

  // ---------------------------------------------------------------- search + filters
  const applyFilters = (next: CuOrderFilters) => {
    setFilters(next);
    setPageNumber(1);
  };

  const onSearchInput = (value: string) => {
    setSearchText(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      if (value.length >= 3 || value.length === 0) {
        setFilters((f) => ({ ...f, searchText: value }));
        setPageNumber(1);
      }
    }, 400);
  };

  const clearFilters = () => {
    window.clearTimeout(searchTimer.current);
    setSearchText('');
    applyFilters(EMPTY_FILTERS);
  };

  const hasActiveFilters = !!filters.status || (!!filters.startDate && !!filters.endDate);
  const statusChip = filters.status ? `Status: ${ORDER_STATUS[filters.status].label}` : '';
  const dateChip = filters.startDate && filters.endDate
    ? filters.startDate === filters.endDate
      ? `Date: ${formatChipDate(filters.startDate)}`
      : `Date: ${formatChipDate(filters.startDate)} - ${formatChipDate(filters.endDate)}`
    : '';

  const onPage = (e: { pageIndex: number; pageSize: number }) => {
    setPageSize(e.pageSize);
    setPageNumber(e.pageIndex + 1);
  };

  // ---------------------------------------------------------------- table
  const renderCell = (row: OrderRow, key: string) => {
    switch (key) {
      case 'createdDate':
        return <td key={key} className="text-center py-2 px-2 small">{formatDateDMY(row.createdAt)}</td>;
      case 'orderDate':
        return <td key={key} className="text-center py-2 px-2 small">{formatDateDMY(row.confirmedAt)}</td>;
      case 'orderNo':
        return (
          <td key={key} className="text-start py-2 px-2 small">
            {row.orderNo}
            <div className="text-muted" style={{ fontSize: 11 }} title="Seller order reference">{row.sellerOrderRef}</div>
          </td>
        );
      case 'retailer':
        return <td key={key} className="text-start py-2 px-2 small" style={{ maxWidth: 160 }}>{row.retailerName || '-'}</td>;
      case 'distributor':
        return <td key={key} className="text-start py-2 px-2 small" style={{ maxWidth: 160 }}>{row.distributorName || '-'}</td>;
      case 'mobile':
        return <td key={key} className="text-start py-2 px-2 small">{row.retailerPhone || '-'}</td>;
      case 'status': {
        const st = ORDER_STATUS[row.status];
        return (
          <td key={key} className="text-center py-2 px-3 small">
            <span className={`status-badge cu-order-tone ${st?.tone ?? 'grey'}`}>{st?.label ?? row.status}</span>
          </td>
        );
      }
      case 'tripNumber': {
        const tripNo = row.deliveryTripId ? tripNoById.get(row.deliveryTripId) : undefined;
        return (
          <td key={key} className="text-center py-2 px-2 small">
            {row.deliveryTripId && tripNo ? (
              <Link className="text-primary text-decoration-none" to={`/cds/trips/${row.deliveryTripId}`}>{tripNo}</Link>
            ) : (
              <span className="text-muted">-</span>
            )}
          </td>
        );
      }
      case 'actions':
        return (
          <td key={key} className="text-center py-2 px-2 small">
            <div className="d-flex align-items-center justify-content-center gap-2 flex-nowrap">
              <button className="btn btn-sm text-primary" title="View Order" aria-label="View Order" onClick={() => navigate(`/cds/orders/${row.id}`)}>
                <i className="fas fa-eye" />
              </button>
            </div>
          </td>
        );
      default:
        return <td key={key} />;
    }
  };

  return (
    <div className="orders-page container-fluid p-3 bg-light h-100">
      {/* A. Header */}
      <div className="px-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <div className="d-flex align-items-center">
              <i className="fas fa-shopping-bag text-primary me-2 fs-5" />
              <h1 className="fs-3 mb-0 fw-bold">Orders</h1>
            </div>
            <p className="text-muted small mb-0">Track, manage, and fulfill customer orders with ease.</p>
          </div>
        </div>
      </div>


      {/* B. Search row */}
      <div className="px-3">
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative flex-grow-1">
            <input
              type="text"
              className="form-control form-control-sm pe-4 retailer-search"
              autoComplete="off"
              aria-label="Search orders"
              placeholder="Search by retailer name, mobile number, or order number"
              value={searchText}
              onChange={(e) => onSearchInput(e.target.value)}
            />
            {searchText && (
              <button
                type="button"
                title="Clear search"
                className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted"
                onClick={clearFilters}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
          <button className="btn btn-sm btn-outline-primary d-flex align-items-center text-nowrap" onClick={() => setShowFiltersModal(true)}>
            <i className="fas fa-filter me-1 fs-6" />
            Filters
          </button>
        </div>
      </div>

      {/* C. Applied filters */}
      {hasActiveFilters && (
        <div className="px-3 mt-2 filterArea">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small">Applied filters:</span>
            {statusChip && (
              <div className="filter-badge">
                <span>{statusChip}</span>
                <button className="badge-close-btn" aria-label="Remove status filter" onClick={() => applyFilters({ ...filters, status: '' })}><i className="fas fa-times" /></button>
              </div>
            )}
            {dateChip && (
              <div className="filter-badge">
                <span>{dateChip}</span>
                <button className="badge-close-btn" aria-label="Remove date filter" onClick={() => applyFilters({ ...filters, startDate: '', endDate: '' })}><i className="fas fa-times" /></button>
              </div>
            )}
            <button className="btn btn-sm text-primary border-0 ms-auto" onClick={clearFilters}>Clear all</button>
          </div>
        </div>
      )}

      {/* D. KPI cards (not clickable) */}
      <div className="stats-grid px-3 mt-3">
        <div className="stat-card">
          <div className="stat-left">
            <div className="stat-label">No. of Customers</div>
            <div className="stat-value">{kpi.customers}</div>
            <div className="stat-subtitle">To be delivered</div>
          </div>
          <div className="stat-right">
            <div className="stat-icon stat-icon--customers"><i className="fas fa-users" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-left">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{kpi.orders}</div>
            <div className="stat-subtitle">To be delivered</div>
          </div>
          <div className="stat-right">
            <div className="stat-icon stat-icon--orders"><i className="fas fa-chart-line" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-left">
            <div className="stat-label">Total Weight</div>
            <div className="stat-value">{ngNumber(kpi.weightKg, 1, 1)} Kgs</div>
            <div className="stat-subtitle">To be delivered</div>
          </div>
          <div className="stat-right">
            <div className="stat-icon stat-icon--weight"><i className="fas fa-weight-hanging" /></div>
          </div>
        </div>
      </div>

      {/* E. Table card */}
      <div className="p-3">
        <div className="mat-card mat-elevation-z3">
          <div className="mat-card-content p-0">
            {orders.error && <ErrorBox text={orders.error} onRetry={orders.reload} />}
            <div className="table-responsive">
              {orders.loading ? (
                <DataLoading overlay={false} message="Loading orders..." showTip />
              ) : (
                <table className="mat-mdc-table w-100">
                  <thead>
                    <tr className="mat-mdc-header-row bg-white small">
                      {COLUMNS.map((c) => (
                        <th key={c.key} className={`text-uppercase fw-bold small bg-white py-2 px-2 ${c.align === 'center' ? 'text-center' : 'text-start'}`}>
                          <i className={`${c.icon} me-1 text-primary`} />
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="mat-mdc-row small">
                        {COLUMNS.map((c) => renderCell(row, c.key))}
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr className="mat-mdc-no-data-row">
                        <td colSpan={COLUMNS.length} className="py-4">
                          <div className="text-center text-muted small">
                            <i className="fas fa-inbox fs-3 mb-2" />
                            <p className="mb-0 mt-2 small">No orders found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {/* F. Paginator */}
          {total > 0 && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-1 bg-white">
              <div className="text-muted small" />
              <div className="bg-transparent shadow-none" aria-label="Select page of orders">
                <Paginator length={total} pageIndex={pageNumber - 1} pageSize={pageSize} pageSizeOptions={PAGE_SIZES} onPage={onPage} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showFiltersModal && (
        <CuOrderFiltersModal
          filters={filters}
          onClose={() => setShowFiltersModal(false)}
          onApply={(f) => {
            applyFilters({ ...filters, ...f });
            setShowFiltersModal(false);
          }}
          onClear={() => {
            clearFilters();
            setShowFiltersModal(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Filters modal (markup of the LBNP FiltersModal, order mode)

function CuOrderFiltersModal({ filters, onClose, onApply, onClear }: {
  filters: CuOrderFilters;
  onClose: () => void;
  onApply: (f: Pick<CuOrderFilters, 'status' | 'startDate' | 'endDate'>) => void;
  onClear: () => void;
}) {
  const today = useMemo(() => dayjs().endOf('day'), []);
  const [f, setF] = useState({ status: filters.status, startDate: filters.startDate, endDate: filters.endDate });

  const apply = () => {
    let { startDate, endDate } = f;
    if (startDate && endDate && endDate < startDate) {
      void Swal.fire({ icon: 'warning', text: 'End date cannot be less than start date', showConfirmButton: true, confirmButtonText: 'OK' });
      return;
    }
    if (startDate && !endDate) endDate = startDate;
    if (endDate && !startDate) startDate = endDate;
    onApply({ status: f.status, startDate, endDate });
  };

  const dateField = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <DatePicker
      value={value ? dayjs(value) : null}
      onChange={(d: Dayjs | null) => onChange(d && d.isValid() ? d.format('YYYY-MM-DD') : '')}
      maxDate={today}
      format="M/D/YYYY"
      slotProps={{ textField: { size: 'small', placeholder, fullWidth: true, inputProps: { readOnly: true, placeholder, 'aria-label': placeholder } } }}
    />
  );

  return (
    <div className="modal-overlay fm-overlay" onClick={onClose}>
      <div className="modal-content filters-modal" role="dialog" aria-modal="true" aria-label="Order Filters" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Filters</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div className="filter-grid">
            <div className="filter-row">
              <div className="filter-col">
                <label>Order Start Date</label>
                {dateField(f.startDate, (v) => setF((p) => ({ ...p, startDate: v })), 'Order Start Date')}
              </div>
              <div className="filter-col">
                <label>Order End Date</label>
                {dateField(f.endDate, (v) => setF((p) => ({ ...p, endDate: v })), 'Order End Date')}
              </div>
            </div>
            <div className="filter-row">
              <div className="filter-col">
                <label htmlFor="cu-order-status">Status</label>
                <select id="cu-order-status" className="fm-input" value={f.status} onChange={(e) => setF((p) => ({ ...p, status: e.target.value as OrderStatus | '' }))}>
                  <option value=""> All </option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS[s].label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-col" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClear}>Clear All</button>
          <button className="save-btn" onClick={apply}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
