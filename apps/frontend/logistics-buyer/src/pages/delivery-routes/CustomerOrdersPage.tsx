// Screen D — Customer Orders (/customer-orders), spec 03 §8. No hasView gate (as built).
// Data comes via router state `orderData`, falling back to localStorage["customerOrderData"].
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import { authService } from '../../api/services/auth.service';
import { routeOrdersService } from '../../api/services/routePlanning.service';
import { addCurrency, addWeight } from '../../utils/pipes';
import './RouteDetailsPages.css';

interface Product { name: string; orderedQuantity: number; mrp: number; rate: number; weight: number; gstPercentage: number; totalAmount: number }
interface CustomerOrder { orderNumber: string; referenceInvoiceId: string; orderTotal: number; products: Product[]; expanded: boolean }
interface CustomerOrders { customerName: string; address: string; totalOrders: number; totalAmount: number; totalProducts: number; orders: CustomerOrder[] }

export default function CustomerOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData] = useState<any>(() => {
    const st = (location.state as any)?.orderData;
    if (st) {
      authService.setCustomerOrderData(st);
      return st;
    }
    try {
      return authService.getCustomerOrderData();
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrders | null>(null);

  useEffect(() => {
    if (!orderData) {
      navigate('/delivery-routes');
      return;
    }
    let orderIds: string[];
    try {
      orderIds = orderData.orderNumbers.split(',').map((x: string) => x.trim());
    } catch (e) {
      // [deviation] the original throws an unhandled TypeError when orderNumbers is not a string;
      // React would unmount the whole app, so log it and leave the page in its "failed" state.
      console.error(e);
      return;
    }
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const data = await routeOrdersService.getCustomerOrdersByOrderIds(orderIds, '');
        if (!active) return;
        if (data) setCustomerOrders({ ...data, orders: (data.orders || []).map((o: any) => ({ ...o, expanded: false })) });
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error loading customer orders', text: String(e) });
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goBack = () => {
    authService.clearCustomerOrderData();
    navigate('/delivery-routes'); // [as-built] back goes to the list, not to the route details
  };

  const expandOrder = (order: CustomerOrder) => {
    setCustomerOrders((co) => {
      if (!co || !co.orders.some((o) => o.orderNumber === order.orderNumber)) return co;
      return { ...co, orders: co.orders.map((o) => (o === order ? { ...o, expanded: !o.expanded } : o)) };
    });
  };

  const card = (bg: string, icon: string, label: string, value: React.ReactNode, footIcon: string, foot: string) => (
    <div className="col-md-4">
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
      <header className="orders-header">
        <button className="back-btn" onClick={goBack}><i className="fas fa-arrow-left" /></button>
        <div>
          <h1><i className="fas fa-user" /> Customer Orders</h1>
          <p className="text-muted small mb-0">{customerOrders?.customerName ?? ''} | {customerOrders?.address ?? ''}</p>
        </div>
      </header>

      {isLoading && <DataLoading message="Loading order details..." showTip />}

      {!isLoading && customerOrders && (
        <>
          <div className="row mb-4 g-3">
            {card('bg-primary-subtle', 'fa-shopping-cart text-primary', 'Total Orders', customerOrders.totalOrders, 'fa-chart-line text-success', ' Order Count')}
            {card('bg-success-subtle', 'fa-rupee-sign text-success', 'Total Amount', addCurrency(customerOrders.totalAmount), 'fa-arrow-up text-success', ' Revenue')}
            {card('bg-warning-subtle', 'fa-box text-warning', 'Total Products', customerOrders.totalProducts, 'fa-cubes text-warning', ' Product Count')}
          </div>

          <div className="mat-card mat-elevation-z3">
            <div className="mat-card-header bg-light py-3 px-3 border-bottom d-flex align-items-center">
              <i className="fas fa-clipboard-list text-primary me-2" />
              <h5 className="mb-0 fw-bold">Order Details</h5>
            </div>
            <div className="mat-card-content">
              {customerOrders.orders.length > 0 && (
                <div className="accordion">
                  {customerOrders.orders.map((order) => (
                    <div key={order.orderNumber} className="accordion-item border-0">
                      <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="mb-0">Order #{order.referenceInvoiceId}</h6>
                          <span className="badge bg-light text-dark">{order.products?.length || 0} Products</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-3">{addCurrency(order.orderTotal)}</span>
                          <button className="btn btn-sm btn-light border rounded-circle" onClick={() => expandOrder(order)}>
                            <i className={`fas ${order.expanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                          </button>
                        </div>
                      </div>
                      <div className={`collapse${order.expanded ? ' show' : ''}`}>
                        <table className="mat-mdc-table w-100">
                          <thead>
                            <tr className="mat-mdc-header-row small bg-light">
                              <th className="py-2 px-3"><i className="fas fa-box" /> Product </th>
                              <th className="py-2 px-3"><i className="fas fa-sort-amount-up" /> Quantity </th>
                              <th className="py-2 px-3"><i className="fas fa-tag" /> MRP (₹) </th>
                              <th className="py-2 px-3"><i className="fas fa-rupee-sign" /> Rate (₹) </th>
                              <th className="py-2 px-3"><i className="fas fa-weight" /> Unit Weight (kg) </th>
                              <th className="py-2 px-3"><i className="fas fa-percent" /> GST % </th>
                              <th className="py-2 px-3"><i className="fas fa-calculator" /> Total (₹) </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.products || []).map((p, i) => (
                              <tr key={`${p.name}-${i}`} className="mat-mdc-row">
                                <td className="py-2 px-3 small">{p.name}</td>
                                <td className="py-2 px-3 small">{p.orderedQuantity}</td>
                                <td className="py-2 px-3 small">{addCurrency(p.mrp)}</td>
                                <td className="py-2 px-3 small">{addCurrency(p.rate)}</td>
                                <td className="py-2 px-3 small">{addWeight(p.weight)}</td>
                                <td className="py-2 px-3 small">{p.gstPercentage}</td>
                                <td className="py-2 px-3 small fw-bold">{addCurrency(p.totalAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {customerOrders.orders.length === 0 && (
                <div className="text-center py-5">
                  <i className="fas fa-info-circle text-muted mb-3 fa-2x" />
                  <p>No orders found for this customer.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
