// Screen C — Delivery Route Details (/delivery-route-details), spec 03 §7.
// Data comes via router state `routeData`, falling back to localStorage["currentRoute"].
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { deliveryRoutesService } from '../../api/services/routePlanning.service';
import { addCurrency, addWeight } from '../../utils/pipes';
import './RouteDetailsPages.css';

interface CustomerRow {
  customerName: string;
  customerBusinessName: string;
  customerMobileNumber: string;
  ordersCount: number;
  orderNumbers: string;
  totalAmount: number;
  totalWeight: number;
  items: { productName: string; weightUnit: string; upc: unknown; cases: number; pieces: number; mrp: number; quantity: number; totalAmount: number }[];
}
interface ProductRow { name: string; uom: string; upc: unknown; cs: string; pieces: number; mrp: number; totalQty: number; amount: number }

export default function DeliveryRouteDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const perms = usePagePermissions('buyer_delivery_routes');
  const [routeData] = useState<any>(() => {
    const st = (location.state as any)?.routeData;
    if (st) {
      deliveryRoutesService.setCurrentRoute(st);
      return st;
    }
    return deliveryRoutesService.getCurrentRoute();
  });
  const routeId = routeData?.routeId;
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<CustomerRow[]>([]);
  const [totals, setTotals] = useState({ totalSaleValue: '0', totalWeight: '0', totalOrders: 0, totalDistance: '0 km' });
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [totalProductQty, setTotalProductQty] = useState(0);
  const [totalProductAmount, setTotalProductAmount] = useState(0);
  const [activeTab, setActiveTab] = useState<'customer' | 'product'>('customer');

  useEffect(() => {
    if (!routeData) {
      navigate('/delivery-routes');
      return;
    }
    let active = true;
    (async () => {
      setIsLoading(true);
      const res = await deliveryRoutesService.getDeliveryOrdersByLogisticsOrderId(routeData.routePlanComboId);
      if (!active) return;
      if (res?.success) {
        const deliveryPlan = res.data?.deliveryPlan;
        const os: CustomerRow[] = res.data?.orders || [];
        setOrders(os);
        if (os.length) {
          // processOrdersData()
          const sale = os.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
          const weight = os.reduce((s, o) => s + (Number(o.totalWeight) || 0), 0);
          setTotals({
            totalSaleValue: String(sale),
            totalWeight: weight.toFixed(2),
            totalOrders: os.reduce((s, o) => s + (Number(o.ordersCount) || 0), 0),
            totalDistance: deliveryPlan?.distance || '0 km',
          });
          const map = new Map<string, ProductRow>();
          os.forEach((o) => (o.items || []).forEach((it) => {
            let p = map.get(it.productName);
            if (!p) {
              p = { name: it.productName, uom: it.weightUnit, upc: it.upc, cs: String(it.cases), pieces: it.pieces, mrp: it.mrp, totalQty: 0, amount: 0 };
              map.set(it.productName, p);
            }
            p.totalQty += Number(it.quantity) || 0;
            p.amount += Number(it.totalAmount) || 0;
          }));
          const list = Array.from(map.values());
          setProducts(list);
          setTotalProductQty(list.reduce((s, p) => s + p.totalQty, 0));
          setTotalProductAmount(sale); // [as-built] Σ customer totalAmount, not Σ product amounts
        }
      }
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!perms.hasView || !routeData) return null;

  const viewCustomerOrders = (row: CustomerRow) => {
    navigate('/customer-orders', {
      state: {
        orderData: {
          customerName: row.customerName,
          customerMobileNumber: row.customerMobileNumber,
          ordersCount: row.ordersCount,
          orderNumbers: row.orderNumbers,
          totalAmount: row.totalAmount,
          totalWeight: row.totalWeight,
          items: row.items,
        },
      },
    });
  };

  const card = (bg: string, icon: string, label: string, value: React.ReactNode, footIcon: string, foot: string) => (
    <div className="col-md-3">
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

  return (
    <div className="route-details-pages create-route-container">
      {isLoading && (
        <div className="details-loading-overlay">
          <div className="details-loading-box">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading route details...</p>
          </div>
        </div>
      )}

      <header className="orders-header">
        <button className="back-btn" onClick={() => navigate('/delivery-routes')}><i className="fas fa-arrow-left" /></button>
        <div>
          <h1><i className="fas fa-route" /> Delivery Route Details</h1>
          <p className="text-muted small mb-0">Route ID: {routeId}</p>
        </div>
      </header>

      <div className="row mb-4 g-3">
        {card('bg-primary-subtle', 'fa-shopping-cart text-primary', 'Total Orders', totals.totalOrders, 'fa-chart-line text-success', ' Orders Placed')}
        {card('bg-success-subtle', 'fa-rupee-sign text-success', 'Total Sale Value', addCurrency(+totals.totalSaleValue), 'fa-arrow-up text-success', ' Revenue')}
        {card('bg-warning-subtle', 'fa-weight text-warning', 'Total Vol. Weight', addWeight(totals.totalWeight), 'fa-truck-loading text-warning', ' Shipping Weight')}
        {card('bg-info-subtle', 'fa-route text-info', 'Total Distance', totals.totalDistance, 'fa-map-marker-alt text-info', ' Travel Distance')}
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
                <th className="py-2 px-3"><i className="fas fa-shopping-cart" /> Orders Count </th>
                <th className="py-2 px-3"><i className="fas fa-rupee-sign" /> Total Amount </th>
                <th className="py-2 px-3"><i className="fas fa-weight" /> Total Vol. Weight </th>
                <th className="py-2 px-3"><i className="fas fa-cogs" /> Actions </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={`${o.orderNumbers}-${i}`} className="mat-mdc-row">
                  <td className="py-2 px-3 small">{i + 1}</td>
                  <td className="py-2 px-3 small text-start">{o.customerBusinessName}</td>
                  <td className="py-2 px-3 small">{o.ordersCount}</td>
                  <td className="py-2 px-3 small">{addCurrency(o.totalAmount)}</td>
                  <td className="py-2 px-3 small">{addWeight(o.totalWeight)}</td>
                  <td className="py-2 px-3 small">
                    <button className="btn btn-sm text-primary" onClick={() => viewCustomerOrders(o)}><i className="fas fa-eye me-1" /></button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="text-center py-4"><i className="fas fa-info-circle me-2 text-muted" /> No customer orders found </td></tr>
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
                <th className="py-2 px-3"><i className="fas fa-ruler" /> UOM </th>
                <th className="py-2 px-3"><i className="fas fa-barcode" /> UPC </th>
                <th className="py-2 px-3"><i className="fas fa-boxes" /> CS </th>
                <th className="py-2 px-3"><i className="fas fa-cubes" /> PCS </th>
                <th className="py-2 px-3"><i className="fas fa-tag" /> MRP </th>
                <th className="py-2 px-3"><i className="fas fa-layer-group" /> Total Qty (PCS) </th>
                <th className="py-2 px-3"><i className="fas fa-rupee-sign" /> Amount </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.name} className="mat-mdc-row">
                  <td className="py-2 px-3 small">{p.name}</td>
                  <td className="py-2 px-3 small">{p.uom}</td>
                  <td className="py-2 px-3 small">{String(p.upc ?? '')}</td>
                  <td className="py-2 px-3 small">{p.cs}</td>
                  <td className="py-2 px-3 small">{p.pieces}</td>
                  <td className="py-2 px-3 small">{addCurrency(p.mrp)}</td>
                  <td className="py-2 px-3 small">{p.totalQty}</td>
                  <td className="py-2 px-3 small">{addCurrency(p.amount)}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={8} className="text-center py-4"><i className="fas fa-info-circle me-2 text-muted" /> No product orders found </td></tr>
              )}
            </tbody>
            {products.length > 0 && (
              <tfoot>
                <tr className="small bg-light footer-row">
                  <td className="py-2 px-3" /><td className="py-2 px-3" /><td className="py-2 px-3" /><td className="py-2 px-3" /><td className="py-2 px-3" />
                  <td className="py-2 px-3 fw-bold"> TOTAL: </td>
                  <td className="py-2 px-3 fw-bold">{totalProductQty}</td>
                  <td className="py-2 px-3 fw-bold">{addCurrency(totalProductAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
