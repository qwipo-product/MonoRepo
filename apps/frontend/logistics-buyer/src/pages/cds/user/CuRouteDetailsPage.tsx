// CDS User — Delivery Route Details (/cds/delivery-planning/:id). Replica of the LBNP Delivery Route Details screen
// (src/pages/delivery-routes/DeliveryRouteDetailsPage.tsx); the eye button opens the LBNP Customer Orders view
// (CustomerOrdersPage.tsx) for that retailer in place (?retailer=<id>), and a route map shows the CDS store first,
// then the retailers in visiting order. Quantities are the units planned on the route (accepted at the CDS).
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { cdsApi } from '../../../api/services/cds.service';
import { ORDER_STATUS } from '../../../cds/status';
import type { CdsOrder, OrderLine, Retailer } from '../../../cds/types';
import { addCurrency, addWeight } from '../../../utils/pipes';
import { fmtDate, fmtNumber } from '../../delivery-routes/drFormat';
import { RouteMap, type MapStop } from '../RouteMap';
import { Badge, ErrorBox, useLoad, useMeta } from '../ui';
import { CuGenerateTripDialog, CuRouteTripStatus } from './CuDeliveryRoutesPage';
import '../../delivery-routes/RouteDetailsPages.css';
import './CuRoutePages.css';

type RouteOrder = CdsOrder & { retailerName: string; distributorName: string };

/** Units planned on the route: accepted at the CDS (nothing of an order is delivered before its route). */
const planned = (l: OrderLine) => l.acceptedQty;
const orderAmount = (o: { lines: OrderLine[] }) => o.lines.reduce((s, l) => s + planned(l) * l.unitPrice, 0);
const orderKg = (o: { lines: OrderLine[] }) => o.lines.reduce((s, l) => s + planned(l) * l.unitWeightKg, 0);
const localDate = (ymd: string) => new Date(`${ymd}T00:00:00`);
const fmtEta = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

interface CustomerRow { stop: number; retailer: Retailer; orders: RouteOrder[]; amount: number; weight: number }
interface ProductRow { sku: string; name: string; unitPrice: number; qty: number; weight: number; amount: number }

function SummaryCard({ col, bg, icon, label, value, footIcon, foot }: { col: string; bg: string; icon: string; label: string; value: React.ReactNode; footIcon: string; foot: string }) {
  return (
    <div className={col}>
      <div className="card h-100 border-0 shadow-sm rounded-3 summary-card">
        <div className="card-body d-flex align-items-center p-3">
          <div className={`icon-container rounded-circle ${bg} me-3`}><i className={`fas ${icon}`} /></div>
          <div>
            <h6 className="text-muted small mb-1">{label}</h6>
            <h3 className="fw-bold mb-0">{value}</h3>
          </div>
        </div>
        <div className="card-footer bg-light border-0 py-2 px-3"><span className="small"><i className={`fas ${footIcon}`} />{foot}</span></div>
      </div>
    </div>
  );
}

/** LBNP Customer Orders view for one retailer of the route. */
function CustomerOrdersView({ row, onBack }: { row: CustomerRow; onBack: () => void }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const products = row.orders.reduce((s, o) => s + o.lines.filter((l) => planned(l) > 0).length, 0);
  const toggle = (id: string) => setExpanded((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });
  return (
    <>
      <header className="orders-header">
        <button className="back-btn" aria-label="Back" onClick={onBack}><i className="fas fa-arrow-left" /></button>
        <div>
          <h1><i className="fas fa-user" /> Customer Orders</h1>
          <p className="text-muted small mb-0">{row.retailer.name} | {row.retailer.address}</p>
        </div>
      </header>

      <div className="row mb-4 g-3">
        <SummaryCard col="col-md-4" bg="bg-primary-subtle" icon="fa-shopping-cart text-primary" label="Total Orders" value={row.orders.length} footIcon="fa-chart-line text-success" foot=" Order Count" />
        <SummaryCard col="col-md-4" bg="bg-success-subtle" icon="fa-rupee-sign text-success" label="Total Amount" value={addCurrency(row.amount)} footIcon="fa-arrow-up text-success" foot=" Revenue" />
        <SummaryCard col="col-md-4" bg="bg-warning-subtle" icon="fa-box text-warning" label="Total Products" value={products} footIcon="fa-cubes text-warning" foot=" Product Count" />
      </div>

      <div className="mat-card mat-elevation-z3">
        <div className="mat-card-header bg-light py-3 px-3 border-bottom d-flex align-items-center">
          <i className="fas fa-clipboard-list text-primary me-2" />
          <h5 className="mb-0 fw-bold">Order Details</h5>
        </div>
        <div className="mat-card-content">
          {row.orders.length > 0 && (
            <div className="accordion">
              {row.orders.map((order) => {
                const open = expanded.has(order.id);
                const lines = order.lines.filter((l) => planned(l) > 0);
                return (
                  <div key={order.id} className="accordion-item border-0">
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <h6 className="mb-0">Order #{order.orderNo}</h6>
                        <span className="badge bg-light text-dark">{lines.length} Products</span>
                        <Badge meta={ORDER_STATUS[order.status]} />
                        <a role="link" className="cu-trip-link ms-1" onClick={() => navigate(`/cds/orders/${order.id}`)}>View order</a>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="fw-bold me-3">{addCurrency(orderAmount(order))}</span>
                        <button className="btn btn-sm btn-light border rounded-circle" aria-label={open ? 'Collapse' : 'Expand'} onClick={() => toggle(order.id)}>
                          <i className={`fas ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                        </button>
                      </div>
                    </div>
                    <div className={`collapse${open ? ' show' : ''}`}>
                      <table className="mat-mdc-table w-100">
                        <thead>
                          <tr className="mat-mdc-header-row small bg-light">
                            <th className="py-2 px-3"><i className="fas fa-box" /> Product </th>
                            <th className="py-2 px-3"><i className="fas fa-barcode" /> SKU </th>
                            <th className="py-2 px-3"><i className="fas fa-sort-amount-up" /> Quantity </th>
                            <th className="py-2 px-3"><i className="fas fa-rupee-sign" /> Rate (₹) </th>
                            <th className="py-2 px-3"><i className="fas fa-weight" /> Unit Weight (kg) </th>
                            <th className="py-2 px-3"><i className="fas fa-calculator" /> Total (₹) </th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((l) => (
                            <tr key={l.sku} className="mat-mdc-row">
                              <td className="py-2 px-3 small">{l.name}</td>
                              <td className="py-2 px-3 small">{l.sku}</td>
                              <td className="py-2 px-3 small">{planned(l)}</td>
                              <td className="py-2 px-3 small">{addCurrency(l.unitPrice)}</td>
                              <td className="py-2 px-3 small">{addWeight(l.unitWeightKg)}</td>
                              <td className="py-2 px-3 small fw-bold">{addCurrency(planned(l) * l.unitPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {row.orders.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-info-circle text-muted mb-3 fa-2x" />
              <p>No orders found for this customer.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function CuRouteDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const meta = useMeta();
  const { data, error, loading, reload } = useLoad(() => cdsApi.deliveryRoute(id), [id]);
  const [activeTab, setActiveTab] = useState<'customer' | 'product'>('customer');
  const [tripOpen, setTripOpen] = useState(false);
  const store = meta.data?.stores[0];

  const customers = useMemo<CustomerRow[]>(() => {
    if (!data) return [];
    return data.retailers
      .filter((r): r is Retailer => !!r)
      .map((retailer, i) => {
        const orders = data.orders.filter((o) => o.retailerId === retailer.id);
        return { stop: i + 1, retailer, orders, amount: orders.reduce((s, o) => s + orderAmount(o), 0), weight: orders.reduce((s, o) => s + orderKg(o), 0) };
      });
  }, [data]);

  const products = useMemo<ProductRow[]>(() => {
    const m = new Map<string, ProductRow>();
    (data?.orders ?? []).forEach((o) => o.lines.forEach((l) => {
      const q = planned(l);
      if (q <= 0) return;
      const p = m.get(l.sku) ?? { sku: l.sku, name: l.name, unitPrice: l.unitPrice, qty: 0, weight: 0, amount: 0 };
      p.qty += q;
      p.weight += q * l.unitWeightKg;
      p.amount += q * l.unitPrice;
      m.set(l.sku, p);
    }));
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const stops = useMemo<MapStop[]>(() => [
    ...(store ? [{ seq: 0, name: store.name, detail: 'CDS store · start of the route', lat: store.lat, lng: store.lng }] : []),
    ...customers.map((c) => ({ seq: c.stop, name: c.retailer.name, detail: `${c.retailer.locality} · ${c.retailer.address}`, lat: c.retailer.lat, lng: c.retailer.lng })),
  ], [store, customers]);

  const viewRetailer = params.get('retailer');
  const customerView = viewRetailer ? customers.find((c) => c.retailer.id === viewRetailer) : undefined;

  if (error) {
    return (
      <div className="route-details-pages create-route-container">
        <header className="orders-header">
          <button className="back-btn" aria-label="Back" onClick={() => navigate('/cds/delivery-planning')}><i className="fas fa-arrow-left" /></button>
          <h1><i className="fas fa-route" /> Delivery Route Details</h1>
        </header>
        <ErrorBox text={error} onRetry={reload} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="route-details-pages create-route-container">
        {loading && (
          <div className="details-loading-overlay">
            <div className="details-loading-box">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading route details...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (customerView) {
    return (
      <div className="route-details-pages create-route-container">
        <CustomerOrdersView row={customerView} onBack={() => setParams({}, { replace: false })} />
      </div>
    );
  }

  const row = data.route;
  const r = row.route;
  const util = r.capacityKg > 0 ? Math.round((r.loadKg / r.capacityKg) * 100) : 0;
  const totalProductQty = products.reduce((s, p) => s + p.qty, 0);
  const totalProductAmount = products.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="route-details-pages create-route-container">
      <header className="orders-header">
        <button className="back-btn" aria-label="Back" onClick={() => navigate('/cds/delivery-planning')}><i className="fas fa-arrow-left" /></button>
        <div>
          <h1><i className="fas fa-route" /> Delivery Route Details</h1>
          <p className="text-muted small mb-0">Route ID: {row.planNo}</p>
        </div>
      </header>

      <div className="row mb-4 g-3">
        <SummaryCard col="col-md-3" bg="bg-primary-subtle" icon="fa-shopping-cart text-primary" label="Total Orders" value={data.orders.length} footIcon="fa-chart-line text-success" foot=" Orders Placed" />
        <SummaryCard col="col-md-3" bg="bg-success-subtle" icon="fa-rupee-sign text-success" label="Total Sale Value" value={addCurrency(r.orderValue)} footIcon="fa-arrow-up text-success" foot=" Revenue" />
        <SummaryCard col="col-md-3" bg="bg-warning-subtle" icon="fa-weight text-warning" label="Total Weight" value={addWeight(r.loadKg)} footIcon="fa-truck-loading text-warning" foot=" Shipping Weight" />
        <SummaryCard col="col-md-3" bg="bg-info-subtle" icon="fa-route text-info" label="Total Distance" value={`${fmtNumber(r.distanceKm, 1, 1)} km`} footIcon="fa-map-marker-alt text-info" foot={` Travel Distance · about ${fmtEta(r.etaMinutes)}`} />
      </div>

      <div className="mat-card mat-elevation-z3">
        <div className="cu-route-info">
          <div>
            <div className="info-label"><i className="fas fa-truck" />Vehicle</div>
            <div className="info-value">{r.vehicleRegNo}</div>
            <div className="cu-sub">{r.vehicleType} · {fmtNumber(r.capacityKg, 0, 0)} kg capacity</div>
          </div>
          <div>
            <div className="info-label"><i className="fas fa-weight-hanging" />Vehicle Utilization</div>
            <div className="info-value">{util}%</div>
            <div className={`cds-load${util > 100 ? ' over' : ''}`}><div style={{ width: `${Math.min(100, util)}%` }} /></div>
          </div>
          <div>
            <div className="info-label"><i className="fas fa-calendar-check" />Delivery Date</div>
            <div className="info-value">{fmtDate(localDate(row.plannedDate), 'dd MMM yyyy')}</div>
            <div className="cu-sub">{r.localities.join(', ')}</div>
          </div>
          <div>
            <div className="info-label"><i className="fas fa-paper-plane" />Trip</div>
            <div className="pt-1"><CuRouteTripStatus row={row} onGenerate={() => setTripOpen(true)} /></div>
            {row.trip && <div className="cu-sub">Delivery person: {row.trip.deliveryPersonName}</div>}
          </div>
        </div>
      </div>

      <div className="d-flex border-bottom mb-4">
        <button className={`btn btn-link px-4 py-2 text-decoration-none${activeTab === 'customer' ? ' border-bottom border-primary fw-bold' : ''}`} onClick={() => setActiveTab('customer')}>
          <i className="fas fa-users" /> Customer Wise Orders{' '}
        </button>
        <button className={`btn btn-link px-4 py-2 text-decoration-none${activeTab === 'product' ? ' border-bottom border-primary fw-bold' : ''}`} onClick={() => setActiveTab('product')}>
          <i className="fas fa-box" /> Product Wise Orders{' '}
        </button>
      </div>

      {activeTab === 'customer' && (
        <div className="mat-card mat-elevation-z3">
          <table className="mat-mdc-table w-100">
            <thead>
              <tr className="mat-mdc-header-row small bg-light">
                <th className="py-2 px-3"><i className="fas fa-hashtag" /> Stop No. </th>
                <th className="py-2 px-3 text-start"><i className="fas fa-store" /> Retailer Name </th>
                <th className="py-2 px-3 text-start"><i className="fas fa-map-marker-alt" /> Locality </th>
                <th className="py-2 px-3"><i className="fas fa-shopping-cart" /> Orders Count </th>
                <th className="py-2 px-3"><i className="fas fa-rupee-sign" /> Total Amount </th>
                <th className="py-2 px-3"><i className="fas fa-weight" /> Total Weight </th>
                <th className="py-2 px-3"><i className="fas fa-cogs" /> Actions </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.retailer.id} className="mat-mdc-row">
                  <td className="py-2 px-3 small">{c.stop}</td>
                  <td className="py-2 px-3 small text-start">{c.retailer.name}</td>
                  <td className="py-2 px-3 small text-start">{c.retailer.locality}</td>
                  <td className="py-2 px-3 small">{c.orders.length}</td>
                  <td className="py-2 px-3 small">{addCurrency(c.amount)}</td>
                  <td className="py-2 px-3 small">{addWeight(c.weight)}</td>
                  <td className="py-2 px-3 small">
                    <button className="btn btn-sm text-primary" title="View orders" aria-label={`View orders of ${c.retailer.name}`} onClick={() => setParams({ retailer: c.retailer.id })}>
                      <i className="fas fa-eye me-1" />
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={7} className="text-center py-4"><i className="fas fa-info-circle me-2 text-muted" /> No customer orders found </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'product' && (
        <div className="mat-card mat-elevation-z3">
          <table className="mat-mdc-table w-100">
            <thead>
              <tr className="mat-mdc-header-row small bg-light">
                <th className="py-2 px-3"><i className="fas fa-box" /> Product Name </th>
                <th className="py-2 px-3"><i className="fas fa-barcode" /> SKU </th>
                <th className="py-2 px-3"><i className="fas fa-tag" /> Rate </th>
                <th className="py-2 px-3"><i className="fas fa-layer-group" /> Total Qty </th>
                <th className="py-2 px-3"><i className="fas fa-weight" /> Total Weight </th>
                <th className="py-2 px-3"><i className="fas fa-rupee-sign" /> Amount </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.sku} className="mat-mdc-row">
                  <td className="py-2 px-3 small">{p.name}</td>
                  <td className="py-2 px-3 small">{p.sku}</td>
                  <td className="py-2 px-3 small">{addCurrency(p.unitPrice)}</td>
                  <td className="py-2 px-3 small">{p.qty}</td>
                  <td className="py-2 px-3 small">{addWeight(p.weight)}</td>
                  <td className="py-2 px-3 small">{addCurrency(p.amount)}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="text-center py-4"><i className="fas fa-info-circle me-2 text-muted" /> No product orders found </td></tr>
              )}
            </tbody>
            {products.length > 0 && (
              <tfoot>
                <tr className="small bg-light footer-row">
                  <td className="py-2 px-3" /><td className="py-2 px-3" />
                  <td className="py-2 px-3 fw-bold"> TOTAL: </td>
                  <td className="py-2 px-3 fw-bold">{totalProductQty}</td>
                  <td className="py-2 px-3 fw-bold">{addWeight(products.reduce((s, p) => s + p.weight, 0))}</td>
                  <td className="py-2 px-3 fw-bold">{addCurrency(totalProductAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      <div className="mat-card mat-elevation-z3">
        <div className="mat-card-header bg-light py-3 px-3 border-bottom d-flex align-items-center">
          <i className="fas fa-map-marked-alt text-primary me-2" />
          <h5 className="mb-0 fw-bold">Route Map</h5>
          <span className="text-muted small ms-2">{store ? `${store.name} first, then ` : ''}retailers in visiting order</span>
        </div>
        <div className="p-3">
          <RouteMap stops={stops} height={420} />
        </div>
      </div>

      {tripOpen && (
        <CuGenerateTripDialog
          route={row}
          onClose={() => setTripOpen(false)}
          onDone={() => {
            setTripOpen(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
