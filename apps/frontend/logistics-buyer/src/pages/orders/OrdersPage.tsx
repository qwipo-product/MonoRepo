// Port of OrdersComponent (chunk TGTOQHBV) — route /orders. Spec: docs/specs/01-orders.md §1.
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import Snackbar from '@mui/material/Snackbar';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { ordersService, type OrderRow } from '../../api/services/orders.service';
import { filterPersistence } from '../../api/services/filterPersistence.service';
import FiltersModal from '../../components/FiltersModal';
import DataLoading from '../../components/DataLoading';
import Paginator from '../../components/Paginator';
import { getOrderStatusClass, getOrderStatusLabel } from '../../utils/helpers';
import { ngNumber, useInstance } from './useInstance';
import DeleteOrderModal from './components/DeleteOrderModal';
import ErrorFixDialog, { type ErrorFixResult } from './components/ErrorFixDialog';
import UpdateDeliveryAddressModal from './components/UpdateDeliveryAddressModal';
import OrdersMapView from './components/OrdersMapView';
import './OrdersPage.css';

interface OrderTempFilters {
  statusId: any;
  startDate: string;
  endDate: string;
  pageSize: number;
  pageNumber: number;
  buyerId: string[];
  customerName: string[];
  id: string[];
  customerMobile: string[];
  searchText: string;
  [k: string]: any;
}

const defaultFilters = (buyerId: string): OrderTempFilters => ({
  statusId: [], startDate: '', endDate: '', pageSize: 25, pageNumber: 1,
  buyerId: [buyerId], customerName: [], id: [], customerMobile: [], searchText: '',
});

/** "5th Jan 2025" — built from new Date("YYYY-MM-DD") (UTC midnight) read with local getters, as built. */
function formatChipDate(value: string): string {
  const d = new Date(value);
  const day = d.getDate();
  const suffix = day >= 11 && day <= 20 ? 'th' : day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${day}${suffix} ${month} ${d.getFullYear()}`;
}

const COLUMNS: { key: string; header: string; icon: string; align: 'center' | 'left' }[] = [
  { key: 'createdDate', header: 'Created Date', icon: 'fas fa-calendar', align: 'center' },
  { key: 'orderDate', header: 'Order Date', icon: 'fas fa-calendar', align: 'center' },
  { key: 'refOrderId', header: 'Invoice Number', icon: 'fas fa-file-invoice', align: 'left' },
  { key: 'customerBusinessName', header: 'Retailer Name', icon: 'fas fa-store', align: 'left' },
  { key: 'orderType', header: 'Order Type', icon: 'fas fa-cart-shopping', align: 'center' },
  { key: 'salesPerson', header: 'Sales Person', icon: 'fas fa-user', align: 'center' },
  { key: 'beat', header: 'Beat Name', icon: 'fas fa-route', align: 'center' },
  { key: 'customerMobileNumber', header: 'Mobile Number', icon: 'fas fa-phone', align: 'left' },
  { key: 'orderStatusId', header: 'Status', icon: 'fas fa-info-circle', align: 'center' },
  { key: 'tripNumber', header: 'Trip Number', icon: 'fas fa-truck', align: 'center' },
  { key: 'actions', header: 'Actions', icon: 'fas fa-cogs', align: 'center' },
];

export default function OrdersPage() {
  const { hasView, buyerId } = usePagePermissions('buyer_orders');
  const navigate = useNavigate();
  const [s, update] = useInstance(() => ({
    inited: false,
    tempFilters: defaultFilters(buyerId),
    searchText: '',
    searchTimer: 0 as number | undefined,
    currentPage: 1,
    pageSize: 25,
    isLoading: false,
    orders: [] as OrderRow[],
    ordersCount: 0,
    ordersNeedingAttentionCount: 0,
    readyForPlanningCustomerCount: 0,
    readyForPlanningOrderCount: 0,
    readyForPlanningVolWtTons: 0,
    showFiltersModal: false,
    filtersModalKey: 0,
    showDeleteModal: false,
    orderToDelete: null as OrderRow | null,
    showMapView: false,
    errorFix: null as { orderId: string; orderRef: string } | null,
    showModifyAddress: false,
    snackbarOpen: false,
    snackbarMessage: '',
  }));

  // ---------------------------------------------------------------- data
  const loadOrders = async (filters: OrderTempFilters) => {
    s.isLoading = true;
    update();
    try {
      const result = await ordersService.getOrders({ ...filters, buyerId: [buyerId] });
      s.orders = result?.orders ?? [];
      s.ordersCount = result?.totalCount ?? 0;
      if (!filters.pageNumber || filters.pageNumber === 1) s.currentPage = 1;
      s.ordersNeedingAttentionCount = s.orders.filter((o) => Number(o.orderStatusId) === 9).length;
      const stats = result?.readyForPlanningStats;
      s.readyForPlanningCustomerCount = stats?.customerCount || 0;
      s.readyForPlanningOrderCount = stats?.orderCount || 0;
      s.readyForPlanningVolWtTons = stats?.totalVolumetricWeight || 0;
    } catch (e) {
      console.error('Error loading orders:', e);
      s.orders = [];
      s.ordersCount = 0;
      s.ordersNeedingAttentionCount = 0;
      s.readyForPlanningCustomerCount = 0;
      s.readyForPlanningOrderCount = 0;
      s.readyForPlanningVolWtTons = 0;
    } finally {
      s.isLoading = false;
      update();
    }
  };

  useEffect(() => {
    if (s.inited) return;
    s.inited = true;
    const saved = filterPersistence.getOrderFilters();
    if (saved) {
      // Only status, dates and search text survive a reload; page number / size always reset.
      s.tempFilters = {
        ...defaultFilters(buyerId),
        statusId: saved.statusId ?? [],
        startDate: saved.startDate ?? '',
        endDate: saved.endDate ?? '',
        buyerId: [buyerId],
        pageNumber: 1,
        pageSize: s.pageSize,
        searchText: saved.searchText || '',
      };
      s.searchText = saved.searchText || '';
    } else {
      s.tempFilters = defaultFilters(buyerId);
    }
    loadOrders(s.tempFilters);
    return () => window.clearTimeout(s.searchTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------- search
  const performSearch = (text: string) => {
    if (text.length >= 3 || text.length === 0) {
      s.tempFilters = { ...s.tempFilters, searchText: text, pageNumber: 1 };
      s.currentPage = 1;
      filterPersistence.saveOrderFilters(s.tempFilters);
      loadOrders(s.tempFilters);
    }
  };

  const onSearchInput = (value: string) => {
    s.searchText = value;
    update();
    // debounceTime(400) — no distinctUntilChanged, no trim
    window.clearTimeout(s.searchTimer);
    s.searchTimer = window.setTimeout(() => performSearch(value), 400);
  };

  const clearFilters = () => {
    s.searchText = '';
    s.tempFilters = { ...defaultFilters(buyerId), pageNumber: 1, pageSize: s.pageSize };
    s.currentPage = 1;
    filterPersistence.clearOrderFilters();
    loadOrders(s.tempFilters);
  };

  const clearSearch = () => {
    s.searchText = '';
    clearFilters();
  };

  // ---------------------------------------------------------------- filters
  const hasActiveFilters = () => {
    const f = s.tempFilters;
    return (Array.isArray(f.statusId) && f.statusId.length > 0) || (!!f.startDate && !!f.endDate);
  };

  const openFiltersModal = () => {
    const saved = filterPersistence.getOrderFilters();
    s.tempFilters = saved ? { ...saved, buyerId: [buyerId], searchText: s.searchText } : { ...s.tempFilters };
    s.filtersModalKey++; // new `filters` reference → the modal resets its working copy (ngOnChanges)
    s.showFiltersModal = true;
    update();
  };

  const applyFilters = (e: Record<string, any>) => {
    s.tempFilters = { ...(e as OrderTempFilters), buyerId: [buyerId], pageNumber: 1, pageSize: s.pageSize, searchText: s.searchText };
    filterPersistence.saveOrderFilters(s.tempFilters);
    s.currentPage = 1;
    s.showFiltersModal = false;
    loadOrders(s.tempFilters);
  };

  const removeStatusFilter = () => {
    // as-built: pageNumber is kept, so the user can land on an out-of-range page
    s.tempFilters = { ...s.tempFilters, statusId: [] };
    filterPersistence.saveOrderFilters(s.tempFilters);
    loadOrders(s.tempFilters);
  };

  const removeDateFilter = () => {
    s.tempFilters = { ...s.tempFilters, startDate: '', endDate: '' };
    filterPersistence.saveOrderFilters(s.tempFilters);
    loadOrders(s.tempFilters);
  };

  const onPage = (e: { pageIndex: number; pageSize: number }) => {
    let pageIndex = e.pageIndex;
    if (e.pageSize !== s.pageSize) {
      // mat-paginator keeps the first visible item on screen when the page size changes
      pageIndex = Math.floor(((s.currentPage - 1) * s.pageSize) / e.pageSize);
    }
    s.pageSize = e.pageSize;
    s.currentPage = pageIndex + 1;
    s.tempFilters = { ...s.tempFilters, pageNumber: s.currentPage, pageSize: s.pageSize };
    filterPersistence.saveOrderFilters(s.tempFilters);
    loadOrders(s.tempFilters);
  };

  // ---------------------------------------------------------------- row actions
  const viewOrderDetails = (row: OrderRow) => {
    if (!row.id) {
      console.error('Order ID is missing', row);
      return;
    }
    const qp = new URLSearchParams();
    qp.set('orderId', row.id);
    if (row.logisticOrderRowId !== null && row.logisticOrderRowId !== undefined) qp.set('logisticOrderRowId', row.logisticOrderRowId);
    navigate(`/order-details?${qp.toString()}`);
  };

  const cancelOrder = async (row: OrderRow) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to cancel this order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Confirm/Yes',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;
    try {
      const result = await ordersService.updateOrderStatus([{ updateAttributes: { statusId: 10 }, orderId: row.id }]);
      if (result.success) {
        Swal.fire({ icon: 'success', title: 'Cancelled!', text: 'Order has been cancelled successfully.', confirmButtonColor: '#3085d6' });
        loadOrders(s.tempFilters);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to cancel order. Please try again.', confirmButtonColor: '#3085d6' });
      }
    } catch (e) {
      console.error('Error cancelling order:', e);
      // as-built: the original string has a TAB between "while" and "canceling"
      Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while\tcanceling the order.', confirmButtonColor: '#3085d6' });
    }
  };

  const openDeleteModal = (row: OrderRow) => {
    s.orderToDelete = row;
    s.showDeleteModal = true;
    update();
  };

  const cancelDelete = () => {
    s.showDeleteModal = false;
    s.orderToDelete = null;
    update();
  };

  const confirmDelete = async () => {
    const row = s.orderToDelete;
    if (!row) return;
    try {
      const result = await ordersService.deleteOrder(row.id);
      if (result?.success) {
        s.orders = s.orders.filter((o) => o.id !== row.id);
        s.ordersCount = Math.max(0, s.ordersCount - 1);
        update();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `Order ${row.refOrderId || row.id} has been deleted.`,
          confirmButtonColor: '#3085d6',
          timer: 3000,
          showConfirmButton: false,
        });
        loadOrders(s.tempFilters);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: result?.message || 'Failed to delete order. Please try again.' });
      }
    } catch (err: any) {
      console.error('Error deleting order:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err?.message || 'An error occurred while deleting the order.' });
    } finally {
      s.showDeleteModal = false;
      s.orderToDelete = null;
      update();
    }
  };

  const openErrorFixDialog = (row: OrderRow) => {
    s.errorFix = { orderId: row.id, orderRef: row.refOrderId || row.id };
    update();
  };

  const onErrorFixClosed = (result: ErrorFixResult) => {
    s.errorFix = null;
    // as-built: Cancel / ✕ return {updated:false} (truthy) → "0 errors fixed. 0 remaining."
    if (result) {
      s.snackbarMessage = `${result.errorsFixed ?? 0} errors fixed. ${result.remainingErrors ?? 0} remaining.`;
      s.snackbarOpen = true;
    }
    update();
    if (result?.updated) loadOrders(s.tempFilters);
  };

  const onModifyAddressClosed = (result?: { updated: boolean }) => {
    s.showModifyAddress = false;
    update();
    if (result?.updated) loadOrders(s.tempFilters);
  };

  const openMapView = () => {
    s.showMapView = true;
    update();
  };

  const onMapClosed = () => {
    s.showMapView = false;
    loadOrders(s.tempFilters);
  };

  // ---------------------------------------------------------------- render helpers
  const f = s.tempFilters;
  const statusIds: any[] = Array.isArray(f.statusId) ? f.statusId : [];
  const statusChip = statusIds.length > 1 ? `Status: ${statusIds.length} selected` : statusIds.length === 1 ? `Status: ${getOrderStatusLabel(Number(statusIds[0]))}` : '';
  const dateChip = f.startDate && f.endDate
    ? f.startDate === f.endDate ? `Date: ${formatChipDate(f.startDate)}` : `Date: ${formatChipDate(f.startDate)} - ${formatChipDate(f.endDate)}`
    : '';

  const renderCell = (row: OrderRow, key: string) => {
    const status = +row.orderStatusId;
    switch (key) {
      case 'createdDate':
        return <td key={key} className="text-center py-2 px-2 small">{row.createdDate}</td>;
      case 'orderDate':
        return <td key={key} className="text-center py-2 px-2 small">{row.orderDate}</td>;
      case 'refOrderId':
        return (
          <td key={key} className="text-start py-2 px-2 small">
            {row.refOrderId}
            {row.isDeliveryAddressUpdated && (
              <span
                className="badge bg-warning bg-opacity-10 text-primary ms-1 border border-warning border-opacity-25"
                style={{ fontSize: 9, padding: '2px 5px', cursor: 'default', verticalAlign: 'middle' }}
                title="Delivery address updated — this order's delivery customer was changed from the original"
              >
                <i className="fas fa-map-marker-alt me-1" style={{ fontSize: 8 }} />Updated
              </span>
            )}
            {/* Confirmed as CDS in Seller Store and kept here because CDS Order Routing is off (Settings → Delivery). */}
            {row.deliveryMode === 'cds' && (
              <span
                className="badge bg-info bg-opacity-10 text-info ms-1 border border-info border-opacity-25"
                style={{ fontSize: 9, padding: '2px 5px', cursor: 'default', verticalAlign: 'middle' }}
                title="CDS order — CDS Order Routing is off, so this order stays in LBNP for planning"
              >
                <i className="fas fa-warehouse me-1" style={{ fontSize: 8 }} />CDS
              </span>
            )}
          </td>
        );
      case 'customerBusinessName':
        return <td key={key} className="text-start py-2 px-2 small" style={{ maxWidth: 120 }}>{row.customerBusinessName}</td>;
      case 'orderType':
        return (
          <td key={key} className="text-center py-2 px-3 small">
            <span className={`status-badge ${String(row.orderType).toLowerCase()}`}>{row.orderType}</span>
          </td>
        );
      case 'salesPerson':
        return <td key={key} className="text-start py-2 px-2 small">{row.salesPerson || '-'}</td>;
      case 'beat':
        return <td key={key} className="text-start py-2 px-2 small">{row.beat || '-'}</td>;
      case 'customerMobileNumber':
        return <td key={key} className="text-start py-2 px-2 small">{row.customerMobileNumber || '-'}</td>;
      case 'orderStatusId':
        return (
          <td key={key} className="text-center py-2 px-3 small">
            <span className={`status-badge ${getOrderStatusClass(status)}`}>{getOrderStatusLabel(status) || String(row.orderStatusId)}</span>
          </td>
        );
      case 'tripNumber':
        return (
          <td key={key} className="text-center py-2 px-2 small">
            {row.logisticOrderRowId && (
              <a className="text-primary text-decoration-none cursor-pointer" onClick={() => navigate(`/trip-details/${row.logisticOrderRowId}`)}>
                {row.tripNumber}
              </a>
            )}
            {!row.tripNumber && <span className="text-muted">-</span>}
          </td>
        );
      case 'actions': {
        const n = Number(row.validationErrorCount || 0);
        return (
          <td key={key} className="text-center py-2 px-2 small">
            <div className="d-flex align-items-center justify-content-center gap-2 flex-nowrap">
              {status != 9 && (
                <button className="btn btn-sm text-primary" title="View Order" onClick={() => viewOrderDetails(row)}>
                  <i className="fas fa-eye" />
                </button>
              )}
              {status == 1 && (!row.tripNumber || row.logisticOrderStatus === 'Completed') && (
                <button className="btn btn-sm text-danger" title="Cancel" onClick={() => cancelOrder(row)}>
                  <i className="fas fa-times" />
                </button>
              )}
              {status == 9 && (
                <button className="error-count-badge-container" title={`${n} errors to fix`} onClick={() => openErrorFixDialog(row)}>
                  <svg className="error-alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="error-badge">{n > 9 ? '9+' : n}</span>
                </button>
              )}
              {status == 9 && (
                <button className="btn btn-sm text-danger" title="Delete Order" onClick={() => openDeleteModal(row)}>
                  <i className="fas fa-trash" />
                </button>
              )}
            </div>
          </td>
        );
      }
      default:
        return <td key={key} />;
    }
  };

  const n = s.ordersNeedingAttentionCount;

  return (
    <>
      {hasView && (
        <div className="orders-page container-fluid p-3 bg-light h-100">
          {/* A. Header */}
          <div className="px-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div>
                <div className="d-flex align-items-center">
                  <i className="fas fa-shopping-bag text-primary me-2 fs-5" />
                  <h1 className="fs-3 mb-0 fw-bold">Orders</h1>
                </div>
                <p className="text-muted small mb-0">Track, manage, and fulfill customer orders with ease.</p>
                {n > 0 && <p className="text-warning small mb-0"> ({n} {n === 1 ? 'order needs' : 'orders need'} attention) </p>}
              </div>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-sm btn-outline-primary d-flex align-items-center text-nowrap" onClick={() => { s.showModifyAddress = true; update(); }}>
                  <i className="fas fa-exchange-alt me-1 fs-6" />
                  <span className="fs-6">Modify Delivery Address</span>
                </button>
                <button className="btn btn-sm btn-outline-success d-flex align-items-center text-nowrap" onClick={() => navigate('/create-single-order')}>
                  <i className="fas fa-plus me-1 fs-6" />
                  <span className="fs-6">Quick Order</span>
                </button>
                <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={() => navigate('/create-order')}>
                  <i className="fas fa-upload me-1 fs-6" />
                  <span className="fs-6">Create Order</span>
                </button>
              </div>
            </div>

            {/* B. Search row */}
            <div className="d-flex align-items-center gap-2">
              <div className="position-relative flex-grow-1">
                <input
                  type="text"
                  className="form-control form-control-sm pe-4 retailer-search"
                  autoComplete="off"
                  placeholder="Search by retailer name, mobile number, or invoice number"
                  value={s.searchText}
                  onChange={(e) => onSearchInput(e.target.value)}
                />
                {s.searchText && (
                  <button
                    type="button"
                    title="Clear search"
                    className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted"
                    onClick={clearSearch}
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center text-nowrap" onClick={openFiltersModal}>
                <i className="fas fa-filter me-1 fs-6" />
                Filters
              </button>
            </div>
          </div>

          {/* C. Applied filters */}
          {hasActiveFilters() && (
            <div className="px-3 mt-2 filterArea">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="text-muted small">Applied filters:</span>
                {statusChip && (
                  <div className="filter-badge">
                    <span>{statusChip}</span>
                    <button className="badge-close-btn" onClick={removeStatusFilter}><i className="fas fa-times" /></button>
                  </div>
                )}
                {dateChip && (
                  <div className="filter-badge">
                    <span>{dateChip}</span>
                    <button className="badge-close-btn" onClick={removeDateFilter}><i className="fas fa-times" /></button>
                  </div>
                )}
                <button className="btn btn-sm text-primary border-0 ms-auto" onClick={clearFilters}>Clear all</button>
              </div>
            </div>
          )}

          {/* D. KPI cards */}
          <div className="stats-grid px-3 mt-3">
            <div className="stat-card stat-card--clickable" onClick={openMapView}>
              <div className="stat-left">
                <div className="stat-label">No. of Customers</div>
                <div className="stat-value">{s.readyForPlanningCustomerCount}</div>
                <div className="stat-subtitle">To be delivered</div>
              </div>
              <div className="stat-right">
                <div className="stat-icon stat-icon--customers"><i className="fas fa-users" /></div>
                <span className="stat-map-link"><i className="fas fa-map me-1" /> View map</span>
              </div>
            </div>
            <div className="stat-card stat-card--clickable" onClick={openMapView}>
              <div className="stat-left">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">{s.readyForPlanningOrderCount}</div>
                <div className="stat-subtitle">To be delivered</div>
              </div>
              <div className="stat-right">
                <div className="stat-icon stat-icon--orders"><i className="fas fa-chart-line" /></div>
                <span className="stat-map-link"><i className="fas fa-map me-1" /> View map</span>
              </div>
            </div>
            <div className="stat-card stat-card--clickable" onClick={openMapView}>
              <div className="stat-left">
                <div className="stat-label">Total Vol.wt</div>
                <div className="stat-value">{ngNumber(s.readyForPlanningVolWtTons, 1, 1)} Kgs</div>
                <div className="stat-subtitle">To be delivered</div>
              </div>
              <div className="stat-right">
                <div className="stat-icon stat-icon--weight"><i className="fas fa-weight-hanging" /></div>
                <span className="stat-map-link"><i className="fas fa-map me-1" /> View map</span>
              </div>
            </div>
          </div>

          {/* E. Table card */}
          <div className="p-3">
            <div className="mat-card mat-elevation-z3">
              <div className="mat-card-content p-0">
                <div className="table-responsive">
                  {s.isLoading ? (
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
                        {s.orders.map((row) => (
                          <tr key={row.id} className="mat-mdc-row small">
                            {COLUMNS.map((c) => renderCell(row, c.key))}
                          </tr>
                        ))}
                        {s.orders.length === 0 && (
                          <tr className="mat-mdc-no-data-row">
                            {/* as-built: colspan 10 although there are 11 columns */}
                            <td colSpan={10} className="py-4">
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
              {s.ordersCount > 0 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-1 bg-white">
                  <div className="text-muted small" />
                  <div className="bg-transparent shadow-none" aria-label="Select page of orders">
                    <Paginator
                      length={s.ordersCount}
                      pageIndex={s.currentPage - 1}
                      pageSize={s.pageSize}
                      pageSizeOptions={[5, 10, 25, 50]}
                      onPage={onPage}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <FiltersModal
            key={s.filtersModalKey}
            show={s.showFiltersModal}
            filters={s.tempFilters}
            showStatusFilter
            showSLAFilter
            showDateFilter
            title="Order Filters"
            statusType="order"
            onClose={() => { s.showFiltersModal = false; update(); }}
            onApply={applyFilters}
            onClear={clearFilters}
          />
        </div>
      )}

      {/* G. Overlays */}
      {s.showDeleteModal && (
        <DeleteOrderModal orderId={s.orderToDelete?.refOrderId || ''} onConfirm={confirmDelete} onCancel={cancelDelete} />
      )}
      <OrdersMapView show={s.showMapView} buyerId={buyerId} onClose={onMapClosed} onDataChanged={() => loadOrders(s.tempFilters)} />

      {s.errorFix && <ErrorFixDialog orderId={s.errorFix.orderId} orderRef={s.errorFix.orderRef} onClose={onErrorFixClosed} />}
      {s.showModifyAddress && <UpdateDeliveryAddressModal buyerId={buyerId} onClose={onModifyAddressClosed} />}

      <Snackbar
        open={s.snackbarOpen}
        message={s.snackbarMessage}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={(_e, reason) => {
          if (reason === 'clickaway') return;
          s.snackbarOpen = false;
          update();
        }}
      />
    </>
  );
}
