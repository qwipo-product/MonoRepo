// Settings → Delivery → CDS Order Routing. An order the seller confirms as CDS in Seller Store lands in LBNP.
// Routing on: LBNP sends it to the CDS service center, and the Orders page does not show it (the service center
// plans it into a Consolidated Delivery trip). Routing off: the order stays on the Orders page as Ready for
// Planning, with a "CDS" label, and the distributor plans it like a 3PL order. Switching routing on sends the CDS
// orders that are still waiting on the Orders page.
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { cdsRoutingService, type CdsRouting } from '../../api/services/cdsRouting.service';

export default function CdsRoutingSection({ buyerId }: { buyerId: string }) {
  const [data, setData] = useState<CdsRouting | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const apply = (d: CdsRouting) => {
    setData(d);
    setEnabled(d.enabled);
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

  const dirty = !!data && enabled !== data.enabled;

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      // The service center is not chosen here; the saved one (or the default) stays.
      const d = await cdsRoutingService.save(buyerId, { enabled, serviceCenterId: data.serviceCenterId });
      apply(d);
      const text = d.enabled
        ? `CDS orders now go to the CDS service center.${d.sentNow ? ` ${d.sentNow} waiting CDS ${d.sentNow === 1 ? 'order was' : 'orders were'} sent.` : ''}`
        : 'New CDS orders will stay on the Orders page with a CDS label.';
      Swal.fire({ icon: 'success', title: 'CDS Order Routing saved', text, timer: 2600, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Could not save CDS Order Routing', text: 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

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
              service center, and they do not show on the Orders page.
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
          <div className="config-card cds-routing-card">
            <div className="config-details">
              <label className="config-label" htmlFor="cdsRoutingEnabled">Send CDS orders to CDS service center</label>
              <span className="config-hint">
                {enabled ? 'On: CDS orders do not show on the Orders page.' : 'Off: CDS orders stay on the Orders page with a CDS label, and you plan them.'}
              </span>
            </div>
            <label className="toggle-switch cds-routing-toggle" title={enabled ? 'On' : 'Off'}>
              <input id="cdsRoutingEnabled" type="checkbox" role="switch" aria-checked={enabled} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>

          {!data.enabled && data.waitingInLbnp > 0 && (
            <p className="cds-routing-note">
              <i className="fas fa-info-circle" /> {data.waitingInLbnp} CDS {data.waitingInLbnp === 1 ? 'order is' : 'orders are'} on the Orders page. Switch routing
              on and save to send {data.waitingInLbnp === 1 ? 'it' : 'them'} to the CDS service center.
            </p>
          )}
        </>
      )}
    </section>
  );
}
