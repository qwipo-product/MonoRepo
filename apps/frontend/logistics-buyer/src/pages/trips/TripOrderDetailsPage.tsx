// Port of OrderDetailsComponent (`app-order-details`, spec 05 §2): a trip customer's orders + products.
// Route `/trip-order-details/:tripId?orderIds=a&orderIds=b&deliveryTime=...`.
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { formatIstLocale, getOrderStatusLabel } from '../../utils/helpers';
import { addCurrency, addWeight } from '../../utils/pipes';
import { getCustomerOrdersByOrderIds } from './tripOrders.api';
import './TripOrderDetailsPage.css';

interface CustomerDetails {
  name: string | null;
  mobileNumber: string;
  address: string;
  city: string;
  state: string;
  coordinates: string;
  totalOrders: number;
  totalProducts: number;
  totalReturns: number;
  totalReturnProducts: number;
  totalAmount: number;
  pincode: string;
}
interface OrderItem {
  productName: string;
  hsnCode: string;
  cases: number;
  upc: string;
  pcs: number;
  mrp: number;
  packaging: string;
  orderedQty: number;
  returnQty: number;
  netQty: number;
  weight: string;
  rate: number;
  taxable: number;
  gst: number;
  total: number;
}
interface OrderView {
  orderId: string;
  referenceInvoice: string;
  status: string;
  time: string | null | undefined;
  orderTotal: number;
  returnReason?: string;
  items: OrderItem[];
}

const DEFAULT_CUSTOMER: CustomerDetails = {
  name: null, mobileNumber: '', address: '', city: '', state: '', coordinates: '', totalOrders: 0, totalProducts: 0, totalReturns: 0,
  totalReturnProducts: 0, totalAmount: 0, pincode: '',
};

const badgeClass = (status: string) => String(status || '').toLowerCase().replace(/\s+/g, '');

export default function TripOrderDetailsPage() {
  const { tripId } = useParams();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const { hasView } = usePagePermissions('buyer_trips');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(DEFAULT_CUSTOMER);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [returnReason, setReturnReason] = useState<string | undefined>(undefined);

  const orderIdsParam = query.getAll('orderIds');
  const deliveryTime = query.has('deliveryTime') ? (query.get('deliveryTime') as string) : undefined;
  const orderIdsKey = orderIdsParam.join('|');
  // Opened from a consolidated Trips tab (?from=consolidated-delivery | consolidated-returns) → the back arrow of
  // Trip Details still returns to that tab.
  const from = query.get('from');
  const tripDetailsUrl = `/trip-details/${tripId}${from ? `?from=${encodeURIComponent(from)}` : ''}`;

  useEffect(() => {
    if (!hasView) {
      navigate('/');
      return;
    }
    if (!tripId) {
      navigate('/trips');
      return;
    }
    if (orderIdsParam.length === 0) {
      navigate(tripDetailsUrl);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const data = await getCustomerOrdersByOrderIds(orderIdsParam, tripId);
        if (!alive || !data) return;
        // Same order as the original: a missing `coordinates` throws here → page stays at defaults.
        setCustomerDetails({
          name: data.customerName || 'N/A',
          mobileNumber: data.customerMobileNumber || 'N/A',
          address: data.address || 'N/A',
          city: data.city || 'N/A',
          state: data.state || 'N/A',
          coordinates: `${data.coordinates.lat}, ${data.coordinates.lng}`,
          totalOrders: data.totalOrders,
          totalProducts: data.totalProducts,
          totalReturns: data.totalReturnProducts,
          totalReturnProducts: data.totalReturnProducts,
          totalAmount: data.totalAmount,
          pincode: data.pincode || 'N/A',
        });
        // A null product `weight` throws in `.toString()` → customer card filled, tables stay empty (as-built).
        const mapped: OrderView[] = (data.orders || []).map((o: any) => ({
          orderId: o.orderNumber,
          referenceInvoice: o.referenceInvoiceId,
          status: getOrderStatusLabel(parseInt(o.statusId)),
          time: deliveryTime == '' || deliveryTime == 'N/A' ? formatIstLocale(o.orderDate, true) : deliveryTime,
          orderTotal: (o.products || []).reduce((s: number, p: any) => s + (p.totalAmount || 0), 0),
          returnReason: o.reason || undefined,
          items: (o.products || []).map((p: any) => ({
            productName: p.name, hsnCode: p.hsnCode, cases: parseInt(p.css) || 0, upc: p.upc, pcs: parseInt(p.pcs), mrp: p.mrp,
            packaging: p.packageType, orderedQty: p.orderedQuantity, returnQty: p.returnQuantity, netQty: p.netQuantity,
            weight: p.weight.toString(), rate: p.rate, taxable: p.taxableAmount, gst: p.gstPercentage, total: p.totalAmount,
          })),
        }));
        setOrders(mapped);
        // No order with a reason → TypeError after the data is set (harmless, caught below) — as-built.
        setReturnReason(mapped.find((o) => o.returnReason)!.returnReason);
      } catch (e) {
        console.error('Error fetching orders:', e);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, orderIdsKey, deliveryTime, hasView]);

  const th = (icon: string, label: string, align = 'text-start') => (
    <th className={`text-uppercase py-2 px-3 small ${align}`}>
      <i className={`fas ${icon} me-1 text-primary`} />
      {label}
    </th>
  );

  const kpis: { label: string; icon: string; bg: string; value: string | number; footIcon: string; foot: string }[] = [
    { label: 'Total Orders', icon: 'fa-shopping-cart text-primary', bg: 'bg-primary-subtle', value: customerDetails.totalOrders, footIcon: 'fa-calendar-check text-primary', foot: ' Customer Orders' },
    { label: 'Total Amount', icon: 'fa-rupee-sign text-success', bg: 'bg-success-subtle', value: addCurrency(customerDetails.totalAmount), footIcon: 'fa-arrow-up text-success', foot: ' Order Value' },
    { label: 'Total Products', icon: 'fa-box text-info', bg: 'bg-info-subtle', value: customerDetails.totalProducts, footIcon: 'fa-box-open text-info', foot: ' Product Count' },
  ];
  if (customerDetails.totalReturnProducts > 0) {
    kpis.push({ label: 'Return Products', icon: 'fa-undo text-warning', bg: 'bg-warning-subtle', value: customerDetails.totalReturnProducts, footIcon: 'fa-exchange-alt text-warning', foot: ' Return Count' });
  }

  return (
    <div className="order-details-container trip-order-details">
      <header className="orders-header">
        <div className="d-flex align-items-center gap-3">
          <button className="back-btn" onClick={() => navigate(tripDetailsUrl)}><i className="fas fa-arrow-left" /></button>
          <div>
            <h1><i className="fas fa-shopping-bag me-2" /> Customer Order Details</h1>
            <p className="text-muted small mb-0">Customer: {customerDetails.name}</p>
          </div>
        </div>
      </header>

      <div className="row mb-4 g-3">
        {kpis.map((k) => (
          <div className="col-md-3" key={k.label}>
            <div className="card h-100 border-0 shadow-sm rounded-3 summary-card">
              <div className="card-body d-flex align-items-center p-3">
                <div className={`icon-container ${k.bg}`}><i className={`fas ${k.icon}`} /></div>
                <div className="ms-3">
                  <h6 className="text-muted small mb-1">{k.label}</h6>
                  <h3 className="fw-bold mb-0">{k.value}</h3>
                </div>
              </div>
              <div className="card-footer bg-light border-0 py-2 px-3">
                <span className="small"><i className={`fas ${k.footIcon}`} />{k.foot}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mat-card mat-elevation-z3">
        <div className="mat-card-title py-2"><i className="fas fa-user me-2 text-primary" /> Customer Information </div>
        <div className="mat-card-content">
          <div className="row g-3 p-3">
            <div className="col-md-6">
              <label className="text-muted small">Customer Business Name</label>
              <p className="mb-1 fw-medium">{customerDetails.name}</p>
              <label className="text-muted small">Mobile Number</label>
              <p className="mb-1 fw-medium">{customerDetails.mobileNumber}</p>
            </div>
            <div className="col-md-6">
              <label className="text-muted small">Address</label>
              <p className="mb-1 fw-medium">{customerDetails.address}</p>
              <label className="text-muted small">Coordinates</label>
              <p className="mb-1 fw-medium">{customerDetails.coordinates}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mat-card mat-elevation-z3">
        <div className="mat-card-title py-2"><i className="fas fa-clipboard-list me-2 text-primary" /> Order Details </div>
        <div className="mat-card-content p-0">
          <div className="table-responsive">
            <table className="mat-mdc-table w-100">
              <thead>
                <tr className="mat-mdc-header-row small bg-light">
                  {th('fa-hashtag', 'Order ID')}
                  {th('fa-file-invoice', 'Reference Invoice')}
                  {th('fa-info-circle', 'Status', 'text-center')}
                  {th('fa-clock', 'Time', 'text-center')}
                  {th('fa-rupee-sign', 'Order Total', 'text-center')}
                  {th('fa-comment-alt', 'Return Reason', 'text-center')}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr className="mat-mdc-row small" key={i}>
                    <td className="text-start">{o.orderId}</td>
                    <td className="text-start">{o.referenceInvoice}</td>
                    <td className="text-center"><span className={`status-badge ${badgeClass(o.status)}`}>{o.status}</span></td>
                    <td className="text-center">{o.time}</td>
                    <td className="text-center">{addCurrency(o.orderTotal)}</td>
                    {/* page-level reason on every row (as-built) */}
                    <td className="text-center">{returnReason || '-'}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr className="mat-mdc-row">
                    <td colSpan={6} className="text-center py-4"><i className="fas fa-info-circle me-2 text-muted" /> No orders found </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mat-card mat-elevation-z3">
        <div className="mat-card-title py-2"><i className="fas fa-boxes me-2 text-primary" /> Order Products </div>
        <div className="mat-card-content p-3">
          {orders.map((o, oi) => (
            <div className="mat-card mat-elevation-z1 mb-3" key={oi}>
              <div className="mat-card-header bg-light py-2 px-3">
                <div className="d-flex justify-content-between align-items-center w-100">
                  <span className="small">Order #{o.referenceInvoice}</span>
                  <div className="text-end">
                    <span
                      className={[
                        'status-badge me-2 mx-2',
                        o.status === 'Delivered' ? 'delivered' : '',
                        o.status === 'Returned' ? 'returned' : '',
                        o.status === 'Partial Return' ? 'partial-return' : '',
                        o.status === 'Cancelled' ? 'cancelled' : '',
                        o.status === 'In Progress' ? 'in-progress' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {o.status}
                    </span>
                    <span className="small text-muted">{o.time}</span>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="mat-mdc-table w-100 products-table">
                  <thead>
                    <tr className="mat-mdc-header-row small bg-light">
                      {th('fa-box', 'Product')}
                      {th('fa-hashtag', 'HSN Code')}
                      {th('fa-hashtag', 'Cases')}
                      {th('fa-hashtag', 'UPC')}
                      {th('fa-hashtag', 'pcs')}
                      {th('fa-hashtag', 'MRP')}
                      {th('fa-box-open', 'Packaging')}
                      {th('fa-shopping-cart', 'Ordered Qty', 'text-center')}
                      {th('fa-undo', 'Return Qty', 'text-center')}
                      {th('fa-balance-scale', 'Net Qty', 'text-center')}
                      {th('fa-balance-scale', 'Unit Weight', 'text-center')}
                      {th('fa-tag', 'Taxable', 'text-center')}
                      {th('fa-tag', 'GST', 'text-center')}
                      {th('fa-rupee-sign', 'Total', 'text-center')}
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((it, ii) => (
                      <tr className="mat-mdc-row small" key={ii}>
                        <td className="text-start">{it.productName}</td>
                        <td className="text-start">{it.hsnCode}</td>
                        <td className="text-start">{it.cases}</td>
                        <td className="text-start">{it.upc}</td>
                        <td className="text-start">{String(it.pcs)}</td>
                        <td className="text-start">{addCurrency(it.mrp)}</td>
                        <td className="text-start">{it.packaging}</td>
                        <td className="text-center">{it.orderedQty}</td>
                        <td className="text-center">{it.returnQty || 0}</td>
                        <td className="text-center">{it.netQty}</td>
                        <td className="text-center">{addWeight(it.weight)}</td>
                        <td className="text-center">{it.taxable}</td>
                        <td className="text-center">{`${it.gst} %`}</td>
                        <td className="text-center">{addCurrency(it.total)}</td>
                      </tr>
                    ))}
                    {o.items.length === 0 && (
                      <tr className="mat-mdc-row">
                        <td colSpan={16} className="text-center py-4"> No products found for this order </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="mat-mdc-footer-row bg-light">
                      <td className="py-2 px-3 fw-bold">Total:</td>
                      <td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td />
                      <td className="text-center fw-bold">{addCurrency(o.orderTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
