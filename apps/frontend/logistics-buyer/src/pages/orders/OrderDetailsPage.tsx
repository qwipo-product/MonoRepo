// Port of OrderDetailsComponent (chunk 74JOJXUC) — route /order-details?orderId=…&logisticOrderRowId=….
// Spec: docs/specs/01-orders.md §2 (layout, Search Vehicles quick booking, countdown, confirm/cancel, Move to RFP).
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { ordersService, type OrderDetails } from '../../api/services/orders.service';
import { orderFulfillmentService, type AvailableProvider } from '../../api/services/orderFulfillment.service';
import DataLoading from '../../components/DataLoading';
import { addCurrency } from '../../utils/pipes';
import { generateQuickOrderId, getOrderStatusClass, toastError, toastInfo } from '../../utils/helpers';
import { DeliveryConstants } from '../../types/enums';
import { useInstance } from './useInstance';
import './OrderDetailsPage.css';

const ONDC_RESPONSE_WAIT_MS = 5000;
const SINGLE_ORDER_EXPIRY_MS = DeliveryConstants.SINGLE_ORDER_EXPIRY_MS; // 5 min
const comboKey = (orderId: string) => `routePlanCombo_${orderId}`;
const expiryKey = (orderId: string) => `routePlanExpiry_${orderId}`;

type UiProvider = AvailableProvider & { expireTime?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Parses ISO-8601 durations of the form P[nD][T[nH][nM]]. */
function parseTat(tat?: string): { days: number; hours: number; minutes: number } {
  const m = String(tat || '').match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/);
  return { days: Number(m?.[1] || 0), hours: Number(m?.[2] || 0), minutes: Number(m?.[3] || 0) };
}

/**
 * "Est. Delivery": time of day of resultTimestamp + 5.5h (IST) placed on `deliveryDate`, plus the TAT
 * (only when the TAT has no day part), formatted "DD-MM-YYYY, hh:mm AM/PM".
 */
function getEstDelivery(deliveryDate?: string, deliveryTatDuration?: string, _pickupTime?: string, _categoryId?: string, resultTimestamp?: string): string {
  if (!deliveryDate || !resultTimestamp) return 'N/A';
  const ts = new Date(resultTimestamp);
  if (isNaN(ts.getTime())) return 'N/A';
  const ist = new Date(ts.getTime() + 5.5 * 3600 * 1000);
  const [y, mo, d] = String(deliveryDate).slice(0, 10).split('-').map(Number);
  const tat = parseTat(deliveryTatDuration);
  const addMinutes = tat.days > 0 ? 0 : tat.hours * 60 + tat.minutes;
  const eta = new Date(Date.UTC(y, (mo || 1) - 1, d || 1, ist.getUTCHours(), ist.getUTCMinutes()) + addMinutes * 60000);
  if (isNaN(eta.getTime())) return 'N/A';
  const p = (n: number) => String(n).padStart(2, '0');
  let h = eta.getUTCHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${p(eta.getUTCDate())}-${p(eta.getUTCMonth() + 1)}-${eta.getUTCFullYear()}, ${p(h)}:${p(eta.getUTCMinutes())} ${ampm}`;
}

export default function OrderDetailsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Permissions are computed by the base class but the template never checks them (route guard only).
  const { buyerId } = usePagePermissions('buyer_orders');
  const [s, update] = useInstance(() => ({
    alive: true,
    orderId: '',
    tripId: '',
    isLoading: false,
    isReturnOrder: false,
    orderDetails: null as OrderDetails | null,
    products: [] as OrderDetails['products'],
    tripStatus: '',
    activeTab: 'summary' as 'summary' | 'products',
    isSearchingVehicles: false,
    searchProgress: '',
    searchError: '',
    providers: [] as UiProvider[],
    selectedProvider: null as UiProvider | null,
    isConfirming: false,
    routePlanComboId: null as string | null,
    timerInterval: undefined as number | undefined,
    timers: {} as Record<string, string>,
    isRfpBtnShow: false,
  }));

  // ---------------------------------------------------------------- loading
  const loadOrderDetails = async (orderId: string) => {
    s.isLoading = true;
    update();
    try {
      s.isReturnOrder = await ordersService.isReturnOrder(orderId); // fetched but not used in the UI (as built)
      const details = await ordersService.getOrderDetails(orderId);
      // as-built: on a null result the previous orderDetails is kept
      if (details) s.orderDetails = details;
      if (details?.products) s.products = details.products;
    } catch (e) {
      console.error('Error loading order details:', e);
      s.orderDetails = null;
    } finally {
      s.isLoading = false;
      update();
    }
  };

  const getTripDetails = async () => {
    try {
      const res = await orderFulfillmentService.getLogisticsOrdersByFilters({
        buyerId, logisticsOrderId: s.tripId, pickupDate: '', statuses: [], pageSize: 10, pageNumber: 1,
      });
      s.tripStatus = res?.data?.[0]?.logisticsOrderStatus || '';
    } catch (e) {
      console.error('Error loading trip details:', e);
      s.tripStatus = '';
    }
    update();
  };

  // ---------------------------------------------------------------- countdown
  const clearTimer = () => {
    if (s.timerInterval !== undefined) window.clearInterval(s.timerInterval);
    s.timerInterval = undefined;
  };

  const handleExpiry = () => {
    clearTimer();
    const combo = s.routePlanComboId;
    if (combo) {
      orderFulfillmentService.expireRoute(combo, 'quotation').then(() => {
        if (s.alive) loadOrderDetails(s.orderId);
      });
    }
    localStorage.removeItem(comboKey(s.orderId));
    localStorage.removeItem(expiryKey(s.orderId));
    s.routePlanComboId = null;
    s.providers = [];
    s.selectedProvider = null;
    update();
    toastInfo('Providers Expired!', 'Please try again.');
  };

  const tick = () => {
    let expired = false;
    s.providers.forEach((p) => {
      if (!p.expireTime) return;
      const left = Math.floor((new Date(p.expireTime).getTime() - Date.now()) / 1000);
      if (left <= 0) {
        s.timers[p.ondcSearchId] = 'Expired';
        expired = true;
      } else {
        const m = Math.floor(left / 60);
        const sec = left % 60;
        s.timers[p.ondcSearchId] = m > 0 ? `${m}m ${sec}s left` : `${sec}s left`;
      }
    });
    update();
    if (expired) handleExpiry();
  };

  const startCountdown = () => {
    clearTimer();
    tick();
    if (s.providers.length) s.timerInterval = window.setInterval(tick, 1000);
  };

  const resetSearch = () => {
    clearTimer();
    s.providers = [];
    s.selectedProvider = null;
    s.searchError = '';
    s.timers = {};
    update();
  };

  // ---------------------------------------------------------------- restore an in-progress search (status 2)
  const loadExistingProviders = async () => {
    const combo = localStorage.getItem(comboKey(s.orderId));
    // Absent (e.g. another browser): nothing happens, and Search Vehicles stays hidden because the status is 2.
    if (!combo) return;
    s.routePlanComboId = combo;
    s.isSearchingVehicles = true;
    s.searchProgress = 'Loading available providers...';
    update();
    try {
      const data = await orderFulfillmentService.getAvailableProviders(combo);
      const storedExpiry = localStorage.getItem(expiryKey(s.orderId));
      if (storedExpiry && new Date(storedExpiry).getTime() <= Date.now()) {
        localStorage.removeItem(comboKey(s.orderId));
        localStorage.removeItem(expiryKey(s.orderId));
        s.routePlanComboId = null;
        return;
      }
      const expireTime = storedExpiry || new Date(Date.now() + SINGLE_ORDER_EXPIRY_MS).toISOString();
      s.providers = (data || []).filter((p) => p.isEnabled).map((p) => ({ ...p, expireTime }));
      startCountdown();
    } catch (e) {
      console.error('Error loading providers:', e);
      s.searchError = 'Failed to load providers. Please try again.';
    } finally {
      s.isSearchingVehicles = false;
      s.searchProgress = '';
      update();
    }
  };

  // ---------------------------------------------------------------- queryParams subscription
  const qpKey = searchParams.toString();
  useEffect(() => {
    s.orderId = searchParams.get('orderId') || '';
    s.tripId = searchParams.get('logisticOrderRowId') || '';
    (async () => {
      await loadOrderDetails(s.orderId);
      if (s.tripId) await getTripDetails();
      if (s.orderDetails?.statusId === 2) loadExistingProviders();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qpKey]);

  useEffect(() => {
    s.alive = true;
    return () => {
      s.alive = false;
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------- Search Vehicles (single-order ONDC quick booking)
  const searchVehicles = async () => {
    if (!s.orderId || !s.orderDetails) return;
    const od = s.orderDetails;
    s.isSearchingVehicles = true;
    s.searchError = '';
    s.providers = [];
    s.selectedProvider = null;
    update();
    const progress = (text: string) => {
      s.searchProgress = text;
      update();
    };
    try {
      // 1. warehouse address (service rethrows HTTP errors → outer catch shows err.message)
      progress('Getting warehouse address...');
      const address = await orderFulfillmentService.getBuyerDefaultAddress(buyerId);
      if (!address?.id) {
        s.searchError = 'No default warehouse address found. Please set one in Settings > Addresses.';
        return;
      }

      // 2. route plan (one route, one customer, one order)
      progress('Creating delivery plan...');
      const summary = od.summary || {};
      const weight = summary.weight || 1;
      const volume = summary.volume || 1;
      const totalAmount = summary.totalAmount || 0;
      const routeId = generateQuickOrderId();
      const businessName = od.customer?.businessName || '';
      const body = {
        routes: [{
          routeId, routeName: routeId,
          totalWeightKg: weight, totalVolWeightKg: volume,
          estimatedTimeHours: 0, estimatedTimeFormatted: '', expectedDeliveryDate: new Date().toISOString(), distanceKm: 0,
          totalAmount, customerCount: 1, orderCount: 1,
          vehicleType: '2 Wheeler', vehicleCost: 0, vehicleCapacity: 20, vehicleUtilized: 0, deliveryCostPercentage: 0,
          customers: [{
            customerId: s.orderId, // as built: the customerId really is the orderId
            customerName: businessName, customerBusinessName: businessName,
            customerMobileNumber: od.customer?.contactNumber || '',
            orderCount: 1, totalAmount, totalDeadWeight: weight, totalVolWeight: volume, seq: '1',
            orders: [{ orderId: s.orderId, seq: '1', orderAmount: totalAmount, orderDeadWeight: weight, orderVolWeight: volume }],
          }],
        }],
        buyerId,
        buyerAddressId: address.id,
        sla: 'SAME_DAY',
      };
      const created = await orderFulfillmentService.createRoutePlan(body);
      if (!created?.success || !created?.data?.routeCombinationIds?.length) {
        s.searchError = 'Failed to create delivery plan.';
        return;
      }

      // 3. remember the combo (nothing cleans it up if a later step fails — as built)
      const comboId: string = created.data.routeCombinationIds[0];
      localStorage.setItem(comboKey(s.orderId), comboId);
      s.routePlanComboId = comboId;

      // 4. request for quotation
      progress('Searching for available vehicles...');
      await orderFulfillmentService.requestForQuotation({
        routeId: comboId, isBatchRequest: false, coreVersion: DeliveryConstants.CORE_VERSION, deliveryCategory: DeliveryConstants.STANDARD_DELIVERY,
      });

      // 5. wait for ONDC on_search responses
      progress('Waiting for provider responses...');
      await sleep(ONDC_RESPONSE_WAIT_MS);

      // 6. providers
      progress('Loading available providers...');
      const data = await orderFulfillmentService.getAvailableProviders(comboId);

      // 7. expiry + enabled providers
      const expiry = new Date(Date.now() + SINGLE_ORDER_EXPIRY_MS).toISOString();
      localStorage.setItem(expiryKey(s.orderId), expiry);
      s.providers = (data || []).filter((p) => p.isEnabled).map((p) => ({ ...p, expireTime: expiry }));
      if (s.providers.length === 0) {
        s.searchError = 'No vehicles available at the moment. Please try again later.';
        return;
      }

      // 8. countdown + reload (status is now expected to be 2, In Planning)
      startCountdown();
      loadOrderDetails(s.orderId);
    } catch (err: any) {
      console.error('Error searching vehicles:', err);
      s.searchError = err?.message || 'Failed to search for vehicles. Please try again.';
    } finally {
      s.isSearchingVehicles = false;
      s.searchProgress = '';
      update();
    }
  };

  const selectProvider = (p: UiProvider) => {
    s.selectedProvider = p;
    update();
  };

  const confirmBooking = async () => {
    const selected = s.selectedProvider;
    if (!selected) return;
    s.isConfirming = true;
    update();
    try {
      await orderFulfillmentService.requestForConfirm(selected.ondcSearchId);
      localStorage.removeItem(comboKey(s.orderId)); // routePlanExpiry_ is left behind (harmless, as built)
      await Swal.fire({ icon: 'success', title: 'Booking Confirmed', text: `Delivery booked with ${selected.providerName}`, showConfirmButton: false, timer: 1500 });
      navigate('/trips');
    } catch (err: any) {
      console.error('Error confirming booking:', err);
      toastError('Booking Failed', err?.message || 'Failed to confirm booking. Please try again.');
    } finally {
      s.isConfirming = false;
      update();
    }
  };

  const cancelSearch = async () => {
    const combo = s.routePlanComboId;
    if (combo) {
      await orderFulfillmentService.expireRoute(combo, 'quotation'); // errors swallowed
      localStorage.removeItem(comboKey(s.orderId));
      localStorage.removeItem(expiryKey(s.orderId));
      s.routePlanComboId = null;
    }
    resetSearch();
    loadOrderDetails(s.orderId);
  };

  // ---------------------------------------------------------------- Move to RFP
  const moveToRfp = async () => {
    const r = await Swal.fire({
      title: 'Move to RFP',
      text: 'Are you sure you want to return this order to Ready for Planning?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });
    if (!r.isConfirmed) {
      console.log('Move to RFP cancelled');
      return;
    }
    const res = await ordersService.updateOrderStatus([{ updateAttributes: { statusId: 1 }, orderId: s.orderId }]);
    if (res.success) {
      s.isRfpBtnShow = true;
      update();
      loadOrderDetails(s.orderId);
    }
    // as-built: shown whatever the outcome, even when the update failed
    Swal.fire('Order has been successfully moved back to Ready for Planning.');
  };

  // ---------------------------------------------------------------- render
  const od = s.orderDetails;
  const showSidebar = s.isSearchingVehicles || !!s.searchError || s.providers.length > 0;
  const ds = (od?.deliverySchedule || {}) as OrderDetails['deliverySchedule'];

  return (
    <div className="order-details-page order-details-container">
      <header className="orders-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/orders')} aria-label="Back">
            <i className="fas fa-arrow-left" />
          </button>
          <div className="title-section">
            <h1><i className="fas fa-file-invoice" /> Order Details</h1>
            <p className="subtitle">Order #{od?.id ?? ''} - Order Date {od?.orderDate ?? ''}</p>
          </div>
        </div>
        <div className="header-actions">
          {od?.statusId === 1 && s.providers.length === 0 && !s.isSearchingVehicles && (
            <button className="btn btn-primary d-flex align-items-center text-nowrap gap-2" onClick={searchVehicles}>
              <i className="fas fa-search" />
              <span className="fs-6">Search Vehicles</span>
            </button>
          )}
          {od?.statusId === 8 && !s.isRfpBtnShow && s.tripStatus === 'Completed' && (
            <button className="btn btn-primary d-flex align-items-center text-nowrap" onClick={moveToRfp}>
              <span className="fs-6">Move to RFP</span>
            </button>
          )}
        </div>
      </header>

      {s.isLoading && <DataLoading message="Loading order details..." showTip overlay={false} />}

      {!s.isLoading && od && (
        <div className={`main-layout${showSidebar ? ' with-sidebar' : ''}`}>
          <div className="content-container">
            <div className="tabs-container">
              <div className={`tab${s.activeTab === 'summary' ? ' active' : ''}`} onClick={() => { s.activeTab = 'summary'; update(); }}>
                <i className="fas fa-info-circle" /> Order Summary{' '}
              </div>
              <div className={`tab${s.activeTab === 'products' ? ' active' : ''}`} onClick={() => { s.activeTab = 'products'; update(); }}>
                <i className="fas fa-box" /> Product Details{' '}
              </div>
            </div>

            {s.activeTab === 'summary' && (
              <div className="order-details-content">
                <div className="details-grid">
                  <div className="details-section">
                    <h3><i className="fas fa-user" /> Customer Information</h3>
                    <table className="info-table">
                      <tbody>
                        <tr><td><i className="fas fa-building" /> Business Name</td><td>{od.customer?.businessName || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-phone" /> Contact Number</td><td>{od.customer?.contactNumber || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-map-marker-alt" />Address</td><td>{od.customer?.address || 'N/A'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="details-section">
                    <h3><i className="fas fa-calendar-day" /> Delivery Information</h3>
                    <table className="info-table">
                      <tbody>
                        <tr><td><i className="fas fa-calendar-day" /> Delivery Date</td><td>{ds.date || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-user-tie" /> Delivery Executive</td><td>{ds.deliveryExecutive || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-clock" /> Delivery Schedule</td><td>{ds.estimatedTimeToDelivery ? `${ds.estimatedTimeToDelivery} mins` : 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-clock" /> Trip Number</td><td>{ds.tripNumber || 'N/A'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="details-section">
                    <h3><i className="fas fa-clipboard-list" /> Order Information</h3>
                    <table className="info-table">
                      <tbody>
                        <tr><td><i className="fas fa-hashtag" /> Order Number</td><td>{od.id || 'N/A'}</td></tr>
                        <tr>
                          <td><i className="fas fa-info-circle" /> Order Status</td>
                          <td className="px-5"><span className={`status-badge ${getOrderStatusClass(od.statusId)}`}>{od.orderStatus || 'N/A'}</span></td>
                        </tr>
                        <tr><td><i className="fas fa-money-bill-wave" /> Total Amount</td><td>{addCurrency(od.summary?.totalAmount || 0)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {s.activeTab === 'products' && (
              <div className="p-3">
                <div className="mat-card mat-elevation-z3">
                  <div className="mat-card-content p-0">
                    <div className="table-responsive">
                      <table className="mat-mdc-table w-100">
                        <thead>
                          <tr className="mat-mdc-header-row small">
                            <th className="text-uppercase small text-start py-2 px-3"><i className="fas fa-box me-1 text-primary" />Product Name</th>
                            <th className="text-uppercase small text-center"><i className="fas fa-layer-group me-1 text-primary" />Quantity</th>
                            <th className="text-uppercase small text-center"><i className="fas fa-tag me-1 text-primary" />MRP</th>
                            <th className="text-uppercase small text-center"><i className="fas fa-calculator me-1 text-primary" />Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.products.map((p, i) => (
                            <tr className="mat-mdc-row" key={`${p.name}-${i}`}>
                              <td className="text-start py-2 px-3 small">
                                <div className="d-flex align-items-center">
                                  {p.imageUrl && (
                                    <div className="product-img-wrap me-2">
                                      <img className="img-fluid rounded" src={p.imageUrl} alt={p.name} />
                                    </div>
                                  )}
                                  <span>{p.name}</span>
                                </div>
                              </td>
                              <td className="text-center small">{p.quantity}</td>
                              <td className="text-center small">{addCurrency(p.mrp || 0)}</td>
                              <td className="text-center small">{addCurrency(p.total || 0)}</td>
                            </tr>
                          ))}
                          {s.products.length === 0 && (
                            <tr className="mat-mdc-no-data-row">
                              <td colSpan={4} className="py-4">
                                <div className="text-center text-muted small">
                                  <i className="fas fa-box-open fs-3 mb-2" />
                                  <p className="mb-0 mt-2 small">No products found</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="mat-mdc-footer-row small bg-light">
                            <td className="fw-bold text-start py-2 px-3">Total:</td>
                            <td />
                            <td />
                            <td className="fw-bold text-center">{addCurrency(od.summary?.totalAmount || 0)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showSidebar && (
            <div className="vehicle-search-sidebar">
              {s.isSearchingVehicles && (
                <div className="vehicle-search-section">
                  <h3><i className="fas fa-truck" /> Searching Vehicles</h3>
                  <div className="searching-state">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="progress-text">{s.searchProgress}</p>
                  </div>
                </div>
              )}

              {!s.isSearchingVehicles && s.searchError && (
                <div className="vehicle-search-section">
                  <h3><i className="fas fa-truck" /> Vehicle Search</h3>
                  <div className="error-state">
                    <i className="fas fa-exclamation-circle" />
                    <p>{s.searchError}</p>
                  </div>
                </div>
              )}

              {!s.isSearchingVehicles && s.providers.length > 0 && (
                <div className="vehicle-search-section">
                  <h3><i className="fas fa-truck" /> Available Vehicles</h3>
                  <div className="providers-list">
                    {s.providers.map((p) => {
                      const selected = s.selectedProvider?.ondcSearchId === p.ondcSearchId;
                      return (
                        <div key={p.ondcSearchId} className={`provider-card${selected ? ' selected' : ''}`} onClick={() => selectProvider(p)}>
                          <div className="provider-header">
                            <span className="provider-name">{p.providerName}</span>
                            {p.expireTime && (
                              <span className="provider-expire-time">
                                <i className="fas fa-clock" /> {s.timers[p.ondcSearchId] || ''}
                              </span>
                            )}
                          </div>
                          <div className="provider-details">
                            <div className="detail-row"><span className="detail-label">Category</span><span className="detail-value">{p.categoryId || 'Standard Delivery'}</span></div>
                            <div className="detail-row"><span className="detail-label">Price</span><span className="detail-value price">{addCurrency(p.deliveryPrice)}</span></div>
                            <div className="detail-row">
                              <span className="detail-label">Est. Delivery</span>
                              <span className="detail-value eta">{getEstDelivery(p.deliveryDate, p.deliveryTatDuration, p.pickupTime, p.categoryId, p.resultTimestamp)}</span>
                            </div>
                          </div>
                          {selected && (
                            <div className="select-indicator"><i className="fas fa-check-circle" /> Selected </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Once a provider is selected Cancel Search disappears and the selection cannot be cleared (as built). */}
              {!s.isSearchingVehicles && (
                <div className="confirm-actions">
                  {s.selectedProvider ? (
                    <button className="btn btn-success d-flex align-items-center gap-2 w-100 justify-content-center" disabled={s.isConfirming} onClick={confirmBooking}>
                      {s.isConfirming ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-check" />}
                      {s.isConfirming ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                  ) : (
                    <button className="btn btn-outline-secondary d-flex align-items-center gap-2 w-100 justify-content-center" disabled={s.isConfirming} onClick={cancelSearch}>
                      {' '}Cancel Search{' '}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
