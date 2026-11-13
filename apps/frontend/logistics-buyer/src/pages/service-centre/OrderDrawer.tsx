import Drawer from '@mui/material/Drawer';
import { Link } from 'react-router';
import { amountDue, type XdOrderRow, type XdSettings } from '../../types/crossDock';
import { dateTime, day, DISCREPANCY, kg, ORDER_STATUS, rupees, slotLabel, STORE_STATUS } from './labels';
import { StatusPill } from './ScUi';

/**
 * Right-hand panel with one order's details and its status history.
 * `audience="store"` shows the Cross Dock Store's view: its status names, receiving, payment; no Service Centre links.
 */
export default function OrderDrawer({ order, settings, onClose, audience = 'sc' }: { order: XdOrderRow | null; settings?: XdSettings; onClose: () => void; audience?: 'sc' | 'store' }) {
  const store = audience === 'store';
  return (
    <Drawer anchor="right" open={!!order} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
      {order && (
        <div className="p-3" role="dialog" aria-label={`Order ${order.orderNo}`}>
          <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
            <div>
              <div className="text-muted small">Order</div>
              <h2 className="fs-5 fw-bold mb-1">{order.orderNo}</h2>
              <StatusPill {...(store ? STORE_STATUS : ORDER_STATUS)[order.status]} />
            </div>
            <button type="button" className="btn btn-sm btn-light" onClick={onClose} aria-label="Close">
              <i className="fas fa-times" />
            </button>
          </div>

          <dl className="sc-kv mb-4">
            <dt>Invoice</dt>
            <dd>{order.invoiceNo}</dd>
            <dt>Distributor</dt>
            <dd>
              {order.distributorName}
              <div className="text-muted small fw-normal">{order.distributorLocality} · {store ? 'seller' : 'pickup point'}</div>
            </dd>
            <dt>Retailer</dt>
            <dd>
              {order.retailerName}
              <div className="text-muted small fw-normal">{order.retailerLocality}</div>
            </dd>
            {!store && (
              <>
                <dt>Cross Dock Store</dt>
                <dd>{order.cdsName ?? <span className="text-muted fw-normal">None (outside every live CDS area)</span>}</dd>
              </>
            )}
            <dt>Delivery</dt>
            <dd>{order.status === 'DIRECT_DELIVERY' ? 'Direct, by the distributor’s 3PL' : `Cross-dock, ${day(order.deliveryDate)}`}</dd>
            <dt>Load</dt>
            <dd>
              {kg(order.weightKg)} · {order.lines} lines · {order.quantity} units
            </dd>
            <dt>Invoice value</dt>
            <dd>{rupees(order.value)}</dd>
            {order.discrepancy && (
              <>
                <dt>At receiving</dt>
                <dd className="text-danger">
                  {DISCREPANCY[order.discrepancy.type]}: {order.discrepancy.items} units ({rupees(order.discrepancy.value)})
                  {order.discrepancy.note && <div className="small text-muted fw-normal">{order.discrepancy.note}</div>}
                </dd>
              </>
            )}
            {store && (
              <>
                <dt>To collect</dt>
                <dd>{rupees(amountDue(order))}</dd>
              </>
            )}
            {order.payment && (
              <>
                <dt>Collected</dt>
                <dd>
                  {order.payment.cash > 0 && `Cash ${rupees(order.payment.cash)}`}
                  {order.payment.cash > 0 && order.payment.upi > 0 && ' + '}
                  {order.payment.upi > 0 && `UPI ${rupees(order.payment.upi)}`}
                </dd>
              </>
            )}
            {order.returnReason && (
              <>
                <dt>Returned</dt>
                <dd className="text-danger">{order.returnReason}</dd>
              </>
            )}
            <dt>Pickup</dt>
            <dd>
              {order.tripNo && order.pickupTripId ? (
                store ? (
                  <span>
                    {order.tripNo}
                    <span className="text-muted fw-normal"> · Service Centre</span>
                  </span>
                ) : (
                  <>
                    <Link to={`/service-centre/trips/${order.pickupTripId}`}>{order.tripNo}</Link>
                    <span className="text-muted fw-normal"> · {slotLabel(settings, order.round)}</span>
                  </>
                )
              ) : (
                <span className="text-muted fw-normal">{order.status === 'DIRECT_DELIVERY' ? 'Not handled by the Service Centre' : 'Not planned yet'}</span>
              )}
            </dd>
          </dl>

          <h3 className="fs-6 fw-semibold mb-2">History</h3>
          <ol className="list-unstyled mb-0 sc-history">
            {[...order.history].reverse().map((h, i) => (
              <li key={`${h.at}-${i}`} className="d-flex gap-2 pb-3">
                <i className={`fas fa-circle mt-1 ${i === 0 ? 'text-primary' : 'text-secondary'}`} style={{ fontSize: 8 }} aria-hidden="true" />
                <div>
                  <div className="fw-medium small">{h.status}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {dateTime(h.at)} · {h.by}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Drawer>
  );
}
