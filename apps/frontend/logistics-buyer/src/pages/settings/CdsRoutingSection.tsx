// Settings → Delivery → CDS Order Routing. An order the seller confirms as CDS in Seller Store lands in LBNP.
// Routing on: LBNP sends it to the selected CDS service admin, and the Orders page does not show it (the service
// center plans it into a Consolidated Delivery trip). Routing off: the order stays on the Orders page as Ready for
// Planning, with a "CDS" label, and the distributor plans it like a 3PL order. Switching routing on sends the CDS
// orders that are still waiting on the Orders page. Below the switch: the orders LBNP sent to the CDS service admin.
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { cdsRoutingService, type CdsRouting } from '../../api/services/cdsRouting.service';
import { formatToIndianDateTime } from '../../utils/helpers';
import { addCurrency } from '../../utils/pipes';

const FIRST_ROWS = 10;

export default function CdsRoutingSection({ buyerId }: { buyerId: string }) {
  const [data, setData] = useState<CdsRouting | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [serviceCenterId, setServiceCenterId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const apply = (d: CdsRouting) => {
    setData(d);
    setEnabled(d.enabled);
    setServiceCenterId(d.serviceCenterId);
  };

  useEffect(() => {
    if (!buyerId) return;
    let alive = true;
    cdsRoutingService
      .get(buyerId)
      .then((d) => alive && apply(d))
      .catch(() => alive && setLoadFailed(true));
    return () => {
      alive = false;
    };
  }, [buyerId]);

  const dirty = !!data && (enabled !== data.enabled || serviceCenterId !== data.serviceCenterId);
  const centerName = (id: string) => data?.serviceCenters.find((c) => c.id === id)?.name ?? '';

  const save = async () => {
    setSaving(true);
    try {
      const d = await cdsRoutingService.save(buyerId, { enabled, serviceCenterId });
      apply(d);
      const text = d.enabled
        ? `CDS orders now go to ${centerName(d.serviceCenterId)}.${d.sentNow ? ` ${d.sentNow} waiting CDS ${d.sentNow === 1 ? 'order was' : 'orders were'} sent.` : ''}`
        : 'New CDS orders will stay on the Orders page with a CDS label.';
      Swal.fire({ icon: 'success', title: 'CDS Order Routing saved', text, timer: 2600, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Could not save CDS Order Routing', text: 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const rows = data ? (showAll ? data.sentOrders : data.sentOrders.slice(0, FIRST_ROWS)) : [];
  const waitingCount = data?.sentOrders.filter((o) => o.status === 'Sent').length ?? 0;

  return (
    <section className="settings-section cds-routing-section">
      <div className="section-header">
        <div className="section-title-group">
          <div className="config-icon">
            <i className="fas fa-warehouse" />
          </div>
          <div>
            <h2>CDS Order Routing</h2>
            <p className="section-subtitle">
              Orders the seller confirms as <strong>CDS</strong> in Seller Store land in LBNP. When routing is on, LBNP sends them to the CDS
              service admin, and they do not show on the Orders page.
            </p>
          </div>
        </div>
        <button className="save-config-btn" disabled={!dirty || saving} onClick={save}>
          <i className={saving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {loadFailed && <p className="cds-routing-error">Could not load CDS Order Routing. Reload the page to try again.</p>}
      {!data && !loadFailed && <p className="cds-routing-muted">Loading…</p>}

      {data && (
        <>
          <div className="cds-routing-controls">
            <div className="config-card cds-routing-card">
              <div className="config-details">
                <label className="config-label" htmlFor="cdsRoutingEnabled">Send CDS orders to the CDS service admin</label>
                <span className="config-hint">
                  {enabled ? 'On: CDS orders do not show on the Orders page.' : 'Off: CDS orders stay on the Orders page with a CDS label, and you plan them.'}
                </span>
              </div>
              <div className="otp-toggle-wrap">
                <span className={`otp-status-label ${enabled ? 'enabled' : 'disabled'}`}>
                  {enabled && <span className="status-dot" />}
                  {enabled ? 'On' : 'Off'}
                </span>
                <label className="toggle-switch">
                  <input id="cdsRoutingEnabled" type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
            <div className="config-card cds-routing-card">
              <div className="config-details">
                <label className="config-label" htmlFor="cdsServiceCenter">CDS service center</label>
                <span className="config-hint">New CDS orders go to this service center.</span>
              </div>
              <select
                id="cdsServiceCenter"
                className="form-select form-select-sm cds-routing-select"
                value={serviceCenterId}
                disabled={!enabled}
                onChange={(e) => setServiceCenterId(e.target.value)}
              >
                {data.serviceCenters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {!data.enabled && data.waitingInLbnp > 0 && (
            <p className="cds-routing-note">
              <i className="fas fa-info-circle" /> {data.waitingInLbnp} CDS {data.waitingInLbnp === 1 ? 'order is' : 'orders are'} on the Orders page. Switch routing
              on and save to send {data.waitingInLbnp === 1 ? 'it' : 'them'} to the CDS service admin.
            </p>
          )}

          <div className="cds-sent-header">
            <h3>Sent to CDS service admin</h3>
            <span className="cds-routing-muted">
              {data.sentOrders.length} orders · {waitingCount} waiting for a trip
            </span>
          </div>
          {data.sentOrders.length === 0 ? (
            <p className="cds-routing-muted">No CDS orders sent yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm cds-sent-table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Retailer</th>
                    <th className="text-end">Amount</th>
                    <th>Sent At</th>
                    <th>Service Center</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.orderId}>
                      <td>{o.refOrderId}</td>
                      <td>{o.retailer}</td>
                      <td className="text-end">{addCurrency(o.amount)}</td>
                      <td>{formatToIndianDateTime(o.sentAt)}</td>
                      <td>{o.serviceCenter}</td>
                      <td>
                        <span className={`cds-status ${o.status === 'Sent' ? 'sent' : 'trip'}`}>{o.status}</span>
                        {o.tripNumber && <span className="cds-trip-number">{o.tripNumber}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.sentOrders.length > FIRST_ROWS && (
            <button className="btn btn-link btn-sm p-0" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show fewer' : `Show all ${data.sentOrders.length} orders`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
