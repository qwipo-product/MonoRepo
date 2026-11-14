// Port of TripDetailsComponent (`app-trip-details`, spec 05 §1): header, tabs (Summary / Customer Wise Orders /
// Ordered Products / Return Products), resource + helper dialogs (Planned only), Return to RFP (row + bulk) and
// SSE live refresh on ("trip", API orderId).
//
// ID swap (spec 05 §0.3): route `:id` = API logisticsOrderId (uuid); tripDetails.id = API orderId (trip number).
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { sseService } from '../../api/services/sse.service';
import { ordersService } from '../../api/services/orders.service';
import {
  logisticsOrdersService as svc, type CdsPointInfo, type CustomerOrderRow, type ProductOrderRow, type ReturnProductRow, type TripLocation, type TripRow,
} from '../../api/services/logisticsOrders.service';
import { addCurrency } from '../../utils/pipes';
import UpdateHelperDialog from './dialogs/UpdateHelperDialog';
import EditResourceDialog, { type EditResourceData } from './dialogs/EditResourceDialog';
import MoveRfpDialog, { type MoveRfpData } from './dialogs/MoveRfpDialog';
import { calculateEstimatedCompletion, ngNumber, statusClass } from './tripUtils';
import './TripDetailsPage.css';

type TabKey = 'summary' | 'customer' | 'product' | 'cds' | 'return';

interface TripDetailsView {
  id: string;
  provider?: string;
  vehicle?: string;
  driver?: string;
  contact?: string;
  helper?: string;
  startTime?: string;
  estimatedCompletion?: string;
  pickupOTP?: string;
  returnOTP?: string;
  totalSaleValue?: number;
  totalDeliveryValue?: number;
  totalReturnValue?: number;
  totalDeliveryPoints?: string;
  deliveryProgress: { locations: TripLocation[] };
  showAllLocations: boolean;
  vehicleId?: string;
  agentId?: string;
  suggestedVehicleRegNumber?: string;
  suggestedVehicleCapacityKg?: string | number;
  logisticsOrderStatus?: string;
  // read by the template but never set by any code → always "₹ 0" (as-built)
  codCollection?: string;
  digitalCollection?: string;
  netCollection?: string;
}

const EMPTY_DETAILS: TripDetailsView = { id: '', deliveryProgress: { locations: [] }, showAllLocations: false };
const RFP_REASON_IDS = [103, 130, 151];

/** `JSON.parse(vehicleInfo).vehicleId` — throws for the live object shape, so the id is "" (as-built). */
function extractVehicleId(vehicleInfo: unknown): string {
  try {
    return JSON.parse(vehicleInfo as string).vehicleId || '';
  } catch {
    return '';
  }
}

/** Angular `number` pipe in the template; a throw would break the table, so it renders empty instead. */
function safeNumber(v: unknown): string {
  try {
    return ngNumber(v) ?? '';
  } catch (e) {
    console.error(e); // [deviation] the original template stops rendering on this pipe error
    return '';
  }
}

export default function TripDetailsPage() {
  const { id: tripId = '' } = useParams();
  const navigate = useNavigate();
  const { hasView, buyerId } = usePagePermissions('buyer_trips');
  // Opened from the CDS tab (?from=cds-pickups | cds-credit-notes) → the back arrow returns to that CDS list.
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const backTo = from === 'cds-pickups' ? '/cds/pickup-indents' : from === 'cds-credit-notes' ? '/cds/credit-notes' : '/trips';

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [tripDetails, _setTripDetails] = useState<TripDetailsView>(EMPTY_DETAILS);
  const [tripSummaryInfo, setTripSummaryInfo] = useState<TripRow | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderRow[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrderRow[]>([]);
  const [returnProducts, setReturnProducts] = useState<ReturnProductRow[]>([]);
  const [helperDialogFor, setHelperDialogFor] = useState<string | null>(null);
  const [resourceDialogData, setResourceDialogData] = useState<EditResourceData | null>(null);
  const [rfpDialogData, setRfpDialogData] = useState<MoveRfpData | null>(null);
  const isRfpBtnShow = false; // never set to true in the original

  const tripDetailsRef = useRef<TripDetailsView>(EMPTY_DETAILS);
  const setTripDetails = (t: TripDetailsView) => {
    tripDetailsRef.current = t;
    _setTripDetails(t);
  };

  const updateTripSummaryDetails = (row: TripRow) => {
    setTripDetails({
      id: row.logisticsOrderId,
      provider: row.providerName,
      vehicle: row.vehicle,
      driver: row.driver,
      contact: row.driverContactNumber,
      helper: row.helper,
      startTime: row.startTime,
      estimatedCompletion: row.estimatedCompletion,
      pickupOTP: row.pickupOTP,
      returnOTP: row.returnOTP,
      totalSaleValue: row.totalSaleValue,
      totalDeliveryValue: row.totalDeliveryValue,
      totalReturnValue: row.totalReturnValue,
      totalDeliveryPoints: row.dropPoints,
      deliveryProgress: row.deliveryProgress,
      showAllLocations: false,
      vehicleId: extractVehicleId(row.vehicleInfo),
      agentId: row.agentId,
      suggestedVehicleRegNumber: row.suggestedVehicleRegNumber,
      suggestedVehicleCapacityKg: row.suggestedVehicleCapacityKg,
      logisticsOrderStatus: row.logisticsOrderStatus,
    });
  };

  const loadLogisticsDetails = async () => {
    try {
      const [tripResult, productsResult] = await Promise.all([
        svc.getLogisticOrdersDetails({ buyerId, logisticsOrderId: tripId, pickupDate: '', statuses: [], pageSize: 10, pageNumber: 1 }),
        svc.getLogisticOrdersProducts(tripId),
      ]);
      if (tripResult?.data && tripResult.data.length > 0) {
        setTripSummaryInfo(tripResult.data[0]);
        updateTripSummaryDetails(tripResult.data[0]);
      }
      if (productsResult) {
        setCustomerOrders(productsResult.customerOrders);
        setProductOrders(productsResult.productOrders);
        setReturnProducts(productsResult.returnProducts);
      }
    } catch (e) {
      console.error('Error fetching trip details:', e);
    }
  };
  const loadRef = useRef(loadLogisticsDetails);
  loadRef.current = loadLogisticsDetails;

  // route.params subscription → initial load (with loader) → SSE connect
  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | null = null;
    let connectedId = '';
    setIsLoading(true);
    (async () => {
      await loadRef.current();
      if (!alive) return;
      setIsLoading(false);
      const id = tripDetailsRef.current.id;
      if (id) {
        sseService.connect('trip', id);
        connectedId = id;
        unsubscribe = sseService.getMessagesFromEntity('trip', id, (e) => {
          // any event with truthy data except register / CONNECTED → full silent reload (no debounce)
          if (e.data && e.type !== 'register' && e.type !== 'CONNECTED') loadRef.current();
        });
      }
    })();
    return () => {
      alive = false;
      unsubscribe?.();
      // [deviation] the original never disconnects the old stream on a param change; here every exit disconnects.
      if (connectedId) sseService.disconnect('trip', connectedId);
    };
  }, [tripId]);

  // ------------------------------------------------------------ helpers
  const isPlanned = tripDetails.logisticsOrderStatus === 'Planned';
  const isCompleted = tripDetails.logisticsOrderStatus === 'Completed';

  const isLatestLogisticsOrder = (map: CustomerOrderRow['orderLogisticsMap'] | undefined): boolean => {
    if (!map || map.length === 0) return true;
    for (const entry of map) {
      if (entry.logisticsOrders && entry.logisticsOrders.length > 1) {
        const sorted = [...entry.logisticsOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (sorted[0].logisticsOrderId !== tripId) return false;
      }
    }
    return true;
  };
  const canReturnRow = (row: CustomerOrderRow) =>
    isCompleted && row.status === 'Returned' && isLatestLogisticsOrder(row.orderLogisticsMap) && +(row.buyerOrderStatus as any) == 8 && !isRfpBtnShow;

  const openHelperDialog = () => {
    if (tripDetails.logisticsOrderStatus !== 'Planned') return;
    setHelperDialogFor(tripSummaryInfo?.logisticsOrderId ?? '');
  };
  const openResourceDialog = () => {
    if (tripDetails.logisticsOrderStatus !== 'Planned') return;
    setResourceDialogData({
      logisticsOrderId: tripSummaryInfo?.logisticsOrderId ?? '',
      currentVehicleId: tripDetails.vehicleId || '',
      currentVehicleRegNumber: tripDetails.vehicle !== 'N/A' ? tripDetails.vehicle || '' : '',
      currentDriverId: tripDetails.agentId || '',
      currentDriverPhone: tripDetails.contact !== 'N/A' ? tripDetails.contact || '' : '',
      tripVolumetricWeight: tripSummaryInfo?.volumetricWeight || 0,
    });
  };

  const viewOrder = (row: CustomerOrderRow) => {
    const qs = new URLSearchParams();
    (row.orderIds || []).forEach((id) => qs.append('orderIds', id));
    if (row.deliveryTime !== undefined && row.deliveryTime !== null) qs.append('deliveryTime', row.deliveryTime);
    // Keep the CDS list this page was opened from, so the back arrows return through the CDS tab.
    if (from) qs.append('from', from);
    navigate(`/trip-order-details/${tripId}${qs.toString() ? `?${qs.toString()}` : ''}`);
  };

  const returnToRfp = async (orderIds: string[]) => {
    if (!orderIds || orderIds.length === 0) return;
    const r = await Swal.fire({
      title: 'Return to RFP',
      text: 'Are you sure you want to return this order to Ready for Planning?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });
    if (!r.isConfirmed) return;
    try {
      const result = await ordersService.updateOrderStatus(orderIds.map((orderId) => ({ updateAttributes: { statusId: 1 }, orderId })));
      if (result?.success) {
        await Swal.fire('Order has been successfully moved back to Ready for Planning.');
        await loadRef.current();
      } else {
        Swal.fire('Unable to return order to RFP');
      }
    } catch (e) {
      console.error('Error returning order to RFP:', e);
      Swal.fire('Unable to return order to RFP');
    }
  };

  const moveAllReturnedToRfp = () => {
    const returned = customerOrders.filter((o) => o.status === 'Returned' && isLatestLogisticsOrder(o.orderLogisticsMap || []) && +(o.buyerOrderStatus as any) == 8);
    const eligible = returned.filter((o) => RFP_REASON_IDS.includes(Number(o.rtoReasonId)));
    if (eligible.length === 0) {
      Swal.fire('No eligible returned orders found to move to RFP');
      return;
    }
    setRfpDialogData({
      totalReturnedCount: returned.length,
      eligibleCount: eligible.length,
      orders: eligible.map((o) => ({ stopNo: o.stopNo, customerName: o.customerName, orderCount: o.orderCount, amount: o.amount, returnReason: o.returnReason, orderIds: o.orderIds, rtoReasonId: o.rtoReasonId })),
    });
  };

  const getTotalQty = () => productOrders.reduce((s, p) => s + (p.totalQty || 0), 0);
  const getTotalAmount = () => productOrders.reduce((s, p) => s + (p.amount || 0), 0);
  const getTotalOrderedQty = () => returnProducts.reduce((s, p) => s + Number(p.orderedQuantity || 0), 0);
  const getTotalReturnQty = () => returnProducts.reduce((s, p) => s + Number(p.returnedQuantity || 0), 0);
  const getTotalReturnAmount = () => returnProducts.reduce((s, p) => s + Number(p.returnedTotalAmount || 0), 0);

  if (!hasView) return null; // whole template is *ngIf="hasView" (no redirect; data + SSE still load)

  // CDS trips: add CDS Wise Orders (retailers grouped by the CDS point where the service center drops their goods).
  // Return Products shows for 3PL trips, and for CDS trips only when opened from CDS → Credit Notes.
  const isCdsTrip = tripSummaryInfo?.channel === 'cds';
  const tabs: [TabKey, string][] = [['summary', 'Summary'], ['customer', 'Customer Wise Orders'], ['product', 'Ordered Products']];
  if (isCdsTrip) tabs.push(['cds', 'CDS Wise Orders']);
  if (!isCdsTrip || from === 'cds-credit-notes') tabs.push(['return', 'Return Products']);
  const cdsGroups = (() => {
    const m = new Map<string, { point: CdsPointInfo; rows: CustomerOrderRow[] }>();
    customerOrders.forEach((r) => {
      if (!r.cdsPoint) return;
      if (!m.has(r.cdsPoint.id)) m.set(r.cdsPoint.id, { point: r.cdsPoint, rows: [] });
      m.get(r.cdsPoint.id)!.rows.push(r);
    });
    return Array.from(m.values()).sort((a, b) => a.point.name.localeCompare(b.point.name));
  })();

  const locations = tripDetails.deliveryProgress?.locations || [];
  const visible = tripDetails.showAllLocations ? locations : locations.slice(0, 3);
  const th = (icon: string, label: string, align = 'text-center') => (
    <th className={`text-uppercase py-2 px-3 small ${align}`}>
      <i className={`fas ${icon} me-1 text-primary`} />
      {label}
    </th>
  );

  return (
    <div className="trip-details-container">
      {isLoading && (
        <div className="loading-container">
          <DataLoading overlay={false} message="Loading trip details..." showTip />
        </div>
      )}
      {!isLoading && (
        <>
          <div className="trip-details-header">
            <div className="header-left">
              <button className="back-btn" onClick={() => navigate(backTo)}><i className="fas fa-arrow-left" /></button>
              <h1>{tripDetails.id}</h1>
              <div className="provider">{'Provider: ' + (tripDetails.provider || 'N/A')}</div>
            </div>
            <div className="header-right" />
          </div>

          <div className="content-container">
            <div className="tabs-container">
              <div className="tabs">
                {tabs.map(([key, label]) => (
                  <div key={key} className={`tab${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>{label}</div>
                ))}
              </div>
            </div>
            {activeTab === 'summary' && (
              <div className="trip-details-content">
                <div className="details-container">
                  <div className="information-card route-overview">
                    <h3>Route Overview</h3>
                    <div className="suggested-vehicle">
                      <i className="material-icons">local_shipping</i>
                      {' Suggested: ' + (tripDetails.suggestedVehicleRegNumber ? `${tripDetails.suggestedVehicleRegNumber} (${tripDetails.suggestedVehicleCapacityKg} kgs)` : 'N/A')}
                    </div>
                    <div className="resource-details-box">
                      <div className="resource-header">
                        <span>RESOURCE DETAILS</span>
                        <i className={`fas fa-pencil-alt edit-resource-icon${!isPlanned ? ' disabled' : ''}`} title="Edit Resource" onClick={openResourceDialog} />
                      </div>
                      {([['directions_car', 'Vehicle', tripDetails.vehicle || 'N/A'], ['person', 'Driver Name', tripDetails.driver || 'N/A'], ['phone', 'Contact Number', tripDetails.contact || 'N/A']] as [string, string, string][]).map(([icon, label, value]) => (
                        <div className="resource-row" key={label}>
                          <div className="info-item full-width">
                            <i className="material-icons">{icon}</i>
                            <div className="label">{label}</div>
                            <div className="value">{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="info-row">
                      <div className="info-item full-width">
                        <i className="material-icons">person_outline</i>
                        <div className="label">Helper</div>
                        <div className="value">
                          {' ' + (tripDetails.helper || 'N/A') + ' '}
                          <i className={`fas fa-pencil-alt edit-helper-icon${!isPlanned ? ' disabled' : ''}`} title="Update Helper" onClick={openHelperDialog} />
                        </div>
                      </div>
                    </div>
                    {([
                      ['play_circle_outline', 'Start Time', tripDetails.startTime || 'N/A'],
                      ['access_time', 'Estimated Completion', calculateEstimatedCompletion(tripDetails)],
                      ['vpn_key', 'Pickup OTP', tripDetails.pickupOTP || 'N/A'],
                      ['vpn_key', 'Return OTP', tripDetails.returnOTP || 'N/A'],
                    ] as [string, string, string][]).map(([icon, label, value]) => (
                      <div className="info-row" key={label}>
                        <div className="info-item full-width">
                          <i className="material-icons">{icon}</i>
                          <div className="label">{label}</div>
                          <div className="value">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="information-card trip-summary">
                    <h3>Trip Summary</h3>
                    {([
                      ['monetization_on', 'Total Sale Value', addCurrency(tripDetails.totalSaleValue)],
                      ['monetization_on', 'Total Delivered Value', addCurrency(tripDetails.totalDeliveryValue)],
                      ['monetization_on', 'Total Return Value', addCurrency(tripDetails.totalReturnValue)],
                      ['location_on', 'Total Delivery Points', tripDetails.totalDeliveryPoints || '0'],
                      ['payments', 'COD Collection', '₹ ' + (tripDetails.codCollection || '0')],
                      ['smartphone', 'Digital Collection', '₹ ' + (tripDetails.digitalCollection || '0')],
                      ['account_balance_wallet', 'Net Collection', '₹ ' + (tripDetails.netCollection || '0')],
                    ] as [string, string, string][]).map(([icon, label, value]) => (
                      <div className="info-row" key={label}>
                        <div className="info-item full-width">
                          <i className="material-icons">{icon}</i>
                          <div className="label">{label}</div>
                          <div className="value">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="information-card delivery-progress">
                    <h3>Delivery Progress</h3>
                    <div className="info-card delivery-progress-container">
                      <div className="delivery-route">
                        <div className="delivery-stops">
                          {visible.map((loc, i) => (
                            <div
                              key={loc.fulfillmentId || i}
                              className={`delivery-stop${i === 0 ? ' first-stop' : ''}${i === visible.length - 1 && !tripDetails.showAllLocations ? ' last-visible-stop' : ''}`}
                            >
                              {i > 0 && <div className="connector" />}
                              {i === 0 ? (
                                <div className="stop-icon"><i className="material-icons">store</i></div>
                              ) : (
                                <div className="stop-number">{i}</div>
                              )}
                              <div className="stop-details">
                                <div className="stop-info">
                                  <div className="stop-name">{loc.name || 'Unnamed Location'}</div>
                                  <div className="stop-address">{loc.address || 'Address not available'}</div>
                                  <div className="stop-time">{loc.time ? loc.time : 'Time not available'}</div>
                                </div>
                                <div className="stop-status">
                                  <span className={statusClass(loc.status)}>{loc.status}</span>
                                </div>
                                <div className="stop-otp">
                                  <span className="otp-label">OTP : </span>
                                  <span className="otp-badge">{loc.otp || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {locations.length > 3 && (
                            <div className="show-more-container">
                              <button
                                className="show-more-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTripDetails({ ...tripDetailsRef.current, showAllLocations: !tripDetailsRef.current.showAllLocations });
                                }}
                              >
                                <i className="material-icons">{tripDetails.showAllLocations ? 'expand_less' : 'expand_more'}</i>
                                {tripDetails.showAllLocations ? ' Show Less ' : ' Show More Stops '}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'customer' && (
            <div className="trip-details-content">
              {isCompleted && !isRfpBtnShow && (
                <div className="d-flex justify-content-end mb-2">
                  <button className="btn btn-sm btn-primary" onClick={moveAllReturnedToRfp}>
                    <i className="fas fa-undo me-1" /> Return to Re-Delivery
                  </button>
                </div>
              )}
              <div className="mat-card mat-elevation-z3">
                <div className="mat-card-content p-0">
                  <div className="table-responsive">
                    <table className="mat-mdc-table w-100">
                      <thead>
                        <tr className="mat-mdc-header-row small bg-light">
                          {th('fa-hashtag', 'Stop No.')}
                          {th('fa-store', 'Customer Business Name', 'text-start')}
                          {th('fa-map-marker-alt', 'Address', 'text-start')}
                          {th('fa-map-marker-alt', 'OTP', 'text-start')}
                          {th('fa-info-circle', 'Status')}
                          {th('fa-clock', 'Delivered Time')}
                          {th('fa-rupee-sign', 'Orders/Amount')}
                          {th('fa-cogs', 'Actions')}
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((row, i) => (
                          <tr className="mat-mdc-row small" key={i}>
                            <td className="text-center">{row.stopNo}</td>
                            <td className="text-start">{row.customerName}</td>
                            <td className="text-start">{row.address}</td>
                            <td className="text-start">{row.otp || 'N/A'}</td>
                            <td className="text-center"><span className={`status-badge ${statusClass(row.status)}`}>{row.status || 'N/A'}</span></td>
                            <td className="text-center">{row.deliveryTime}</td>
                            <td className="text-center">{`${row.orderCount}/₹ ${safeNumber(row.amount)}`}</td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center align-items-center gap-1">
                                <button className="btn btn-sm text-primary" onClick={() => viewOrder(row)}><i className="fas fa-eye" /></button>
                                {canReturnRow(row) && (
                                  <button className="btn btn-sm text-primary" title="Return to RFP" onClick={() => returnToRfp(row.orderIds)}>
                                    <i className="fas fa-undo" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {customerOrders.length === 0 && (
                          <tr className="mat-mdc-row">
                            <td colSpan={7} className="text-center py-4"><i className="fas fa-inbox me-2 text-muted" /> No customer orders found </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'product' && (
            <div className="trip-details-content">
              <div className="mat-card mat-elevation-z3">
                <div className="mat-card-content p-0">
                  <div className="table-responsive">
                    <table className="mat-mdc-table w-100">
                      <thead>
                        <tr className="mat-mdc-header-row small bg-light">
                          {th('fa-box', 'Product Name', 'text-start')}
                          {th('fa-ruler', 'UOM')}
                          {th('fa-barcode', 'UPC')}
                          {th('fa-box', 'Cases')}
                          {th('fa-cubes', 'PCS')}
                          {th('fa-tag', 'MRP')}
                          {th('fa-check-circle', 'Delivered')}
                          {th('fa-clock', 'Pending')}
                          {th('fa-layer-group', 'Total Qty')}
                          {th('fa-rupee-sign', 'Amount')}
                        </tr>
                      </thead>
                      <tbody>
                        {productOrders.map((p, i) => (
                          <tr className="mat-mdc-row small" key={i}>
                            <td className="text-start">{p.productName}</td>
                            <td className="text-center">{p.uom}</td>
                            <td className="text-center">{p.upc}</td>
                            <td className="text-center">{p.cs}</td>
                            <td className="text-center">{p.pieces}</td>
                            <td className="text-center">{addCurrency(p.mrp)}</td>
                            <td className="text-center">{p.delivered}</td>
                            <td className="text-center">{p.pending}</td>
                            <td className="text-center">{p.totalQty}</td>
                            <td className="text-center">{addCurrency(p.amount)}</td>
                          </tr>
                        ))}
                        {productOrders.length === 0 && (
                          <tr className="mat-mdc-row">
                            <td colSpan={9} className="text-center py-4"><i className="fas fa-inbox me-2 text-muted" /> No product orders found </td>
                          </tr>
                        )}
                      </tbody>
                      {productOrders.length > 0 && (
                        <tfoot>
                          <tr className="mat-mdc-footer-row small bg-light">
                            <td className="text-right fw-bold" />
                            <td /><td /><td /><td /><td /><td />
                            <td className="text-center fw-bold"> Total: </td>
                            <td className="text-center fw-bold">{getTotalQty()}</td>
                            <td className="text-center fw-bold">{addCurrency(getTotalAmount())}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cds' && isCdsTrip && (
            <div className="trip-details-content">
              {cdsGroups.map(({ point, rows }) => (
                <div className="mat-card mat-elevation-z3 cds-group" key={point.id}>
                  <div className="cds-group-header">
                    <div>
                      <div className="cds-group-name"><i className="fas fa-warehouse" /> {point.name}</div>
                      <div className="cds-group-address">{point.address}</div>
                    </div>
                    <div className="cds-group-totals">
                      <span>{`${rows.length} ${rows.length === 1 ? 'retailer' : 'retailers'}`}</span>
                      <span>{`${rows.reduce((s, r) => s + r.orderCount, 0)} orders`}</span>
                      <span>{addCurrency(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0))}</span>
                    </div>
                  </div>
                  <div className="mat-card-content p-0">
                    <div className="table-responsive">
                      <table className="mat-mdc-table w-100">
                        <thead>
                          <tr className="mat-mdc-header-row small bg-light">
                            {th('fa-hashtag', 'Stop No.')}
                            {th('fa-store', 'Customer Business Name', 'text-start')}
                            {th('fa-map-marker-alt', 'Address', 'text-start')}
                            {th('fa-info-circle', 'Status')}
                            {th('fa-rupee-sign', 'Orders/Amount')}
                            {th('fa-cogs', 'Actions')}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr className="mat-mdc-row small" key={row.stopNo}>
                              <td className="text-center">{row.stopNo}</td>
                              <td className="text-start">{row.customerName}</td>
                              <td className="text-start">{row.address}</td>
                              <td className="text-center"><span className={`status-badge ${statusClass(row.status)}`}>{row.status || 'N/A'}</span></td>
                              <td className="text-center">{`${row.orderCount}/₹ ${safeNumber(row.amount)}`}</td>
                              <td className="text-center">
                                <button className="btn btn-sm text-primary" title="View orders" onClick={() => viewOrder(row)}><i className="fas fa-eye" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
              {cdsGroups.length === 0 && (
                <div className="mat-card mat-elevation-z3">
                  <div className="text-center py-4 small"><i className="fas fa-inbox me-2 text-muted" /> No CDS orders found </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'return' && (
            <div className="trip-details-content">
              <div className="mat-card mat-elevation-z3">
                <div className="mat-card-content p-0">
                  <div className="table-responsive">
                    <table className="mat-mdc-table w-100">
                      <thead>
                        <tr className="mat-mdc-header-row small bg-light">
                          {th('fa-box', 'Product Name', 'text-start')}
                          {th('fa-ruler', 'UOM')}
                          {th('fa-barcode', 'UPC')}
                          {th('fa-box', 'Cases')}
                          {th('fa-cubes', 'PCS')}
                          {th('fa-tag', 'MRP')}
                          {th('fa-layer-group', 'Ordered Qty')}
                          {th('fa-undo', 'Return Qty')}
                          {th('fa-rupee-sign', 'Amount')}
                        </tr>
                      </thead>
                      <tbody>
                        {returnProducts.map((p, i) => (
                          <tr className="mat-mdc-row small" key={i}>
                            <td className="text-start">{p.returnedItemName}</td>
                            <td className="text-center">{p.returnedWeightUnit}</td>
                            <td className="text-center">{p.upc}</td>
                            <td className="text-center">{p.cases}</td>
                            <td className="text-center">{p.pieces}</td>
                            <td className="text-center">{'₹ ' + p.mrp}</td>
                            <td className="text-center">{p.orderedQuantity}</td>
                            <td className="text-center">{p.returnedQuantity}</td>
                            <td className="text-center">{'₹ ' + safeNumber(p.returnedTotalAmount)}</td>
                          </tr>
                        ))}
                        {returnProducts.length === 0 && (
                          <tr className="mat-mdc-row">
                            <td colSpan={8} className="text-center py-4"><i className="fas fa-inbox me-2 text-muted" /> No return products found </td>
                          </tr>
                        )}
                      </tbody>
                      {returnProducts.length > 0 && (
                        <tfoot>
                          <tr className="mat-mdc-footer-row small bg-light">
                            <td /><td /><td /><td /><td />
                            <td className="text-center fw-bold"> Total: </td>
                            <td className="text-center fw-bold">{getTotalOrderedQty()}</td>
                            <td className="text-center fw-bold">{getTotalReturnQty()}</td>
                            <td className="text-center fw-bold">{'₹ ' + safeNumber(getTotalReturnAmount())}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {helperDialogFor !== null && (
        <UpdateHelperDialog
          logisticsOrderId={helperDialogFor}
          onClose={(r) => {
            setHelperDialogFor(null);
            if (r?.success) loadRef.current();
          }}
        />
      )}
      {resourceDialogData && (
        <EditResourceDialog
          data={resourceDialogData}
          onClose={(r) => {
            setResourceDialogData(null);
            if (r?.success) loadRef.current();
          }}
        />
      )}
      {rfpDialogData && (
        <MoveRfpDialog
          data={rfpDialogData}
          onClose={(r) => {
            setRfpDialogData(null);
            if (r?.confirmed && r.orderIds.length > 0) returnToRfp(r.orderIds);
          }}
        />
      )}
    </div>
  );
}
