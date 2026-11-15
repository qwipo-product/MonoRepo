// CDS User — Order Details (route /cds/orders/:id). Replica of the LBNP Order Details screen
// (src/pages/orders/OrderDetailsPage.tsx): Order Summary and Product Details tabs, with the CDS order's data.
// No Search Vehicles / 3PL booking, Move to RFP or cancel (decided).
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import DataLoading from '../../../components/DataLoading';
import { cdsApi } from '../../../api/services/cds.service';
import { ORDER_STATUS, TRIP_STATUS } from '../../../cds/status';
import type { CdsOrder, Collection, OrderStatus } from '../../../cds/types';
import { formatDateDMY } from '../../../utils/helpers';
import { addCurrency, addWeight } from '../../../utils/pipes';
import { ErrorBox, fmtDate, fmtDateTime, useLoad } from '../ui';
import '../../orders/OrderDetailsPage.css';
import './CuOrders.css';

/** Statuses before the handover at the CDS store (accepted units not known yet). */
const BEFORE_HANDOVER: OrderStatus[] = ['CONFIRMED', 'PICKUP_PLANNED', 'PICKED_UP', 'IN_TRANSIT_TO_CDS'];
const BEFORE_PICKUP: OrderStatus[] = ['CONFIRMED', 'PICKUP_PLANNED'];
const DELIVERY_DONE: OrderStatus[] = ['DELIVERED', 'PARTIALLY_DELIVERED'];

const reached = (o: CdsOrder, statuses: OrderStatus[]) => o.history.some((h) => statuses.includes(h.to as OrderStatus));

/** Past the handover: the accepted (and short) units are known. A cancelled order counts if it was ever Ready for Delivery. */
function isPastHandover(o: CdsOrder) {
  if (o.status === 'CANCELLED') return reached(o, ['READY_FOR_DELIVERY']);
  return !BEFORE_HANDOVER.includes(o.status);
}
function isPickedUp(o: CdsOrder) {
  if (o.status === 'CANCELLED') return reached(o, ['PICKED_UP', 'READY_FOR_DELIVERY']);
  return !BEFORE_PICKUP.includes(o.status);
}

const statusMeta = (s: string) => ORDER_STATUS[s as OrderStatus] ?? { label: s, tone: 'grey' as const };
const modeLabel = (c: Collection) => (c.mode === 'CASH' ? 'Cash' : 'UPI');

export function CuOrderDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'summary' | 'products'>('summary');
  const { data, error, loading, reload } = useLoad(() => cdsApi.order(id), [id]);

  const o = data?.order ?? null;
  const pastHandover = o ? isPastHandover(o) : false;
  const pickedUp = o ? isPickedUp(o) : false;
  const deliveryDone = o ? DELIVERY_DONE.includes(o.status) : false;
  const deliveryTrip = o?.deliveryTripId ? data?.trips.find((t) => t.id === o.deliveryTripId) ?? null : null;
  const collections = data?.collections ?? [];
  const lines = o?.lines ?? [];
  const sum = (f: (l: CdsOrder['lines'][number]) => number) => lines.reduce((a, l) => a + f(l), 0);
  const status = o ? statusMeta(o.status) : null;
  const colCount = pastHandover ? 8 : 7;

  return (
    <div className="order-details-page order-details-container">
      <header className="orders-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/cds/orders')} aria-label="Back">
            <i className="fas fa-arrow-left" />
          </button>
          <div className="title-section">
            <h1><i className="fas fa-file-invoice" /> Order Details</h1>
            <p className="subtitle">Order #{o?.orderNo ?? ''} - Order Date {o ? formatDateDMY(o.confirmedAt) : ''}</p>
          </div>
        </div>
        <div className="header-actions" />
      </header>

      {loading && <DataLoading message="Loading order details..." showTip overlay={false} />}
      {!loading && error && <ErrorBox text={error} onRetry={reload} />}

      {!loading && o && data && status && (
        <div className="main-layout">
          <div className="content-container">
            <div className="tabs-container" role="tablist">
              <div
                role="tab"
                tabIndex={0}
                aria-selected={activeTab === 'summary'}
                className={`tab${activeTab === 'summary' ? ' active' : ''}`}
                onClick={() => setActiveTab('summary')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('summary'); }}
              >
                <i className="fas fa-info-circle" /> Order Summary{' '}
              </div>
              <div
                role="tab"
                tabIndex={0}
                aria-selected={activeTab === 'products'}
                className={`tab${activeTab === 'products' ? ' active' : ''}`}
                onClick={() => setActiveTab('products')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('products'); }}
              >
                <i className="fas fa-box" /> Product Details{' '}
              </div>
            </div>

            {activeTab === 'summary' && (
              <div className="order-details-content">
                <div className="details-grid">
                  <div className="details-section">
                    <h3><i className="fas fa-user" /> Customer Information</h3>
                    <table className="info-table">
                      <tbody>
                        <tr><td><i className="fas fa-building" /> Business Name</td><td>{data.retailer?.name || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-user-tie" /> Owner Name</td><td>{data.retailer?.ownerName || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-phone" /> Contact Number</td><td>{data.retailer?.phone || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-map-marker-alt" />Address</td><td>{data.retailer?.address || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-location-dot" /> Locality</td><td>{data.retailer?.locality || 'N/A'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="details-section">
                    <h3><i className="fas fa-calendar-day" /> Delivery Information</h3>
                    <table className="info-table">
                      <tbody>
                        <tr><td><i className="fas fa-warehouse" /> CDS Store</td><td>{data.store?.name || 'N/A'}</td></tr>
                        <tr>
                          <td><i className="fas fa-truck" /> Trip Number</td>
                          <td>
                            {deliveryTrip ? (
                              <>
                                <Link className="text-primary text-decoration-none" to={`/cds/trips/${deliveryTrip.id}`}>{deliveryTrip.tripNo}</Link>
                                <span className="cu-order-sub">{TRIP_STATUS[deliveryTrip.status]?.label ?? deliveryTrip.status}</span>
                              </>
                            ) : 'N/A'}
                          </td>
                        </tr>
                        <tr><td><i className="fas fa-calendar-day" /> Delivery Date</td><td>{deliveryTrip ? fmtDate(deliveryTrip.plannedDate) : 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-clock" /> Delivered At</td><td>{o.deliveredAt ? fmtDateTime(o.deliveredAt) : 'N/A'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="details-section">
                    <h3><i className="fas fa-clipboard-list" /> Order Information</h3>
                    <table className="info-table">
                      <tbody>
                        <tr><td><i className="fas fa-hashtag" /> Order Number</td><td>{o.orderNo || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-receipt" /> Seller Order Ref</td><td>{o.sellerOrderRef || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-industry" /> Distributor</td><td>{data.distributor?.name || 'N/A'}</td></tr>
                        <tr><td><i className="fas fa-wallet" /> Payment Mode</td><td>{o.paymentMode === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid'}</td></tr>
                        <tr><td><i className="fas fa-money-bill-wave" /> Total Amount</td><td>{addCurrency(o.orderValue || 0)}</td></tr>
                        <tr><td><i className="fas fa-weight-hanging" /> Weight</td><td>{addWeight(o.weightKg || 0)}</td></tr>
                        <tr>
                          <td><i className="fas fa-info-circle" /> Order Status</td>
                          <td className="px-5"><span className={`status-badge cu-order-tone ${status.tone}`}>{status.label}</span></td>
                        </tr>
                        {o.note && <tr><td><i className="fas fa-comment" /> Note</td><td>{o.note}</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <div className="details-section">
                    <h3><i className="fas fa-clock-rotate-left" /> Status History</h3>
                    <table className="info-table">
                      <tbody>
                        {[...o.history].reverse().map((h, i) => (
                          <tr key={`${h.at}-${i}`}>
                            <td><i className="fas fa-circle-check" /> {statusMeta(h.to).label}</td>
                            <td>
                              {fmtDateTime(h.at)}
                              <span className="cu-order-sub">{h.by}{h.note ? ` · ${h.note}` : ''}</span>
                            </td>
                          </tr>
                        ))}
                        {o.history.length === 0 && <tr><td colSpan={2} className="text-muted">No status changes yet</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {collections.length > 0 && (
                    <div className="details-section">
                      <h3><i className="fas fa-indian-rupee-sign" /> Collections</h3>
                      <table className="info-table">
                        <tbody>
                          {collections.map((c) => (
                            <tr key={c.id}>
                              <td><i className={`fas ${c.mode === 'CASH' ? 'fa-money-bill-wave' : 'fa-mobile-screen'}`} /> {modeLabel(c)}</td>
                              <td>
                                {addCurrency(c.amount)}
                                <span className="cu-order-sub">
                                  {c.collectionNo} · {fmtDateTime(c.collectedAt)} · {c.deliveryPersonName}
                                  {c.expectedAmount !== c.amount ? ` · Expected ${addCurrency(c.expectedAmount)}` : ''}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {collections.length > 1 && (
                            <tr><td><i className="fas fa-calculator" /> Total Collected</td><td>{addCurrency(collections.reduce((a, c) => a + c.amount, 0))}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="p-3">
                <div className="mat-card mat-elevation-z3">
                  <div className="mat-card-content p-0">
                    <div className="table-responsive">
                      <table className="mat-mdc-table w-100">
                        <thead>
                          <tr className="mat-mdc-header-row small">
                            <th className="text-uppercase small text-start py-2 px-3"><i className="fas fa-box me-1 text-primary" />Product Name</th>
                            <th className="text-uppercase small text-center"><i className="fas fa-layer-group me-1 text-primary" />Ordered Qty</th>
                            <th className="text-uppercase small text-center"><i className="fas fa-truck-ramp-box me-1 text-primary" />Picked</th>
                            <th className="text-uppercase small text-center"><i className="fas fa-warehouse me-1 text-primary" />Accepted at CDS</th>
                            {pastHandover && (
                              <th className="text-uppercase small text-center" title="Picked minus accepted at the CDS handover">
                                <i className="fas fa-triangle-exclamation me-1 text-primary" />Short at Handover
                              </th>
                            )}
                            <th className="text-uppercase small text-center"><i className="fas fa-circle-check me-1 text-primary" />Delivered</th>
                            <th className="text-uppercase small text-center"><i className="fas fa-tag me-1 text-primary" />Unit Price</th>
                            <th className="text-uppercase small text-center"><i className="fas fa-calculator me-1 text-primary" />Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((l, i) => {
                            const short = Math.max(0, l.pickedQty - l.acceptedQty);
                            return (
                              <tr className="mat-mdc-row" key={`${l.sku}-${i}`}>
                                <td className="text-start py-2 px-3 small">
                                  <span>{l.name}</span>
                                  <div className="text-muted" style={{ fontSize: 11 }}>{l.sku}</div>
                                </td>
                                <td className="text-center small">{l.qty}</td>
                                <td className="text-center small">{pickedUp ? l.pickedQty : '-'}</td>
                                <td className="text-center small">{pastHandover ? l.acceptedQty : '-'}</td>
                                {pastHandover && (
                                  <td className="text-center small">
                                    {short > 0 ? <span className="cu-order-short" title={`${short} short at handover`}>{short}</span> : 0}
                                  </td>
                                )}
                                <td className="text-center small">{deliveryDone ? l.deliveredQty : '-'}</td>
                                <td className="text-center small">{addCurrency(l.unitPrice || 0)}</td>
                                <td className="text-center small">{addCurrency(l.qty * l.unitPrice || 0)}</td>
                              </tr>
                            );
                          })}
                          {lines.length === 0 && (
                            <tr className="mat-mdc-no-data-row">
                              <td colSpan={colCount} className="py-4">
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
                            <td className="fw-bold text-center">{sum((l) => l.qty)}</td>
                            <td className="fw-bold text-center">{pickedUp ? sum((l) => l.pickedQty) : ''}</td>
                            <td className="fw-bold text-center">{pastHandover ? sum((l) => l.acceptedQty) : ''}</td>
                            {pastHandover && <td className="fw-bold text-center">{sum((l) => Math.max(0, l.pickedQty - l.acceptedQty))}</td>}
                            <td className="fw-bold text-center">{deliveryDone ? sum((l) => l.deliveredQty) : ''}</td>
                            <td />
                            <td className="fw-bold text-center">{addCurrency(o.orderValue || 0)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
