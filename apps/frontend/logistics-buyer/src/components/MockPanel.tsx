import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getControls, setControls, subscribeControls, type MockControls } from '../mock/controls';
import { resetDb } from '../mock/db';
import { expireAccessToken, revokeSession } from '../mock/routes/core';
import { isDarkStoreDemo, setDarkStoreDemo } from '../mock/routes/trips';
import { simulateSellerCdsOrder } from '../mock/routes/cdsRouting';

/**
 * Floating developer panel (not part of the original UI). Lets you tune latency, force API failures
 * (next request / all requests / only matching paths) and reset the synthetic data, so every loading,
 * empty and error state of the original app can be exercised.
 */
export default function MockPanel() {
  const [open, setOpen] = useState(false);
  const [c, setC] = useState<MockControls>(getControls());
  useEffect(() => subscribeControls(setC), []);

  const reset = async () => {
    const r = await Swal.fire({ icon: 'warning', title: 'Reset synthetic data?', text: 'All orders, trips, routes, beats and settings you changed will be regenerated.', showCancelButton: true, confirmButtonText: 'Reset' });
    if (r.isConfirmed) {
      resetDb();
      window.location.reload();
    }
  };

  return (
    <div className="mock-fab">
      {open && (
        <div className="card shadow" style={{ width: 300, marginBottom: 8, fontSize: 13 }}>
          <div className="card-header d-flex justify-content-between align-items-center py-2" style={{ background: '#1e3a8a', color: '#fff' }}>
            <strong><i className="fas fa-flask me-2" />Mock controls</strong>
            <button className="btn btn-sm text-white" onClick={() => setOpen(false)} aria-label="Close"><i className="fas fa-times" /></button>
          </div>
          <div className="card-body">
            <label className="form-label mb-1">Latency: {c.latencyMs} ms</label>
            <input type="range" className="form-range" min={0} max={3000} step={100} value={c.latencyMs} onChange={(e) => setControls({ latencyMs: Number(e.target.value) })} />

            <label className="form-label mb-1 mt-2">Force API failure</label>
            <select className="form-select form-select-sm" value={c.failMode} onChange={(e) => setControls({ failMode: e.target.value as MockControls['failMode'] })}>
              <option value="none">Off</option>
              <option value="next">Next request only</option>
              <option value="all">All requests</option>
            </select>
            <div className="row g-2 mt-1">
              <div className="col-4">
                <input className="form-control form-control-sm" type="number" value={c.failStatus} onChange={(e) => setControls({ failStatus: Number(e.target.value) })} title="HTTP status" />
              </div>
              <div className="col-8">
                <input className="form-control form-control-sm" placeholder="Path contains (optional)" value={c.failPathContains} onChange={(e) => setControls({ failPathContains: e.target.value })} />
              </div>
            </div>
            <input className="form-control form-control-sm mt-2" placeholder="Error message" value={c.failMessage} onChange={(e) => setControls({ failMessage: e.target.value })} />

            <label className="form-label mb-1 mt-2">Buyer type</label>
            <select className="form-select form-select-sm" defaultValue={isDarkStoreDemo() ? 'DARKSTORE' : 'SELF_3PL'} onChange={(e) => { setDarkStoreDemo(e.target.value === 'DARKSTORE'); window.location.reload(); }}>
              <option value="SELF_3PL">SELF_3PL (default)</option>
              <option value="DARKSTORE">DARKSTORE (Trips bulk seller actions)</option>
            </select>

            <label className="form-label mb-1 mt-2">Mock OTP</label>
            <input className="form-control form-control-sm" maxLength={6} value={c.otp} onChange={(e) => setControls({ otp: e.target.value.replace(/\D/g, '') })} />

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-outline-secondary btn-sm flex-fill" title="Next API call gets 401 → token refresh → retry" onClick={() => { expireAccessToken(); Swal.fire({ icon: 'info', title: 'Access token expired', text: 'The next API call will refresh the token and retry.', timer: 1800, showConfirmButton: false }); }}>Expire token</button>
              <button className="btn btn-outline-secondary btn-sm flex-fill" title="Refresh also fails → logout" onClick={() => { revokeSession(); Swal.fire({ icon: 'info', title: 'Session revoked', text: 'The next API call will fail to refresh and log you out.', timer: 1800, showConfirmButton: false }); }}>Revoke session</button>
            </div>
            <button
              className="btn btn-outline-primary btn-sm w-100 mt-2"
              title="The seller confirms one more order as CDS in Seller Store; it follows Settings → Delivery → CDS Order Routing"
              onClick={() => {
                const r = simulateSellerCdsOrder();
                Swal.fire({
                  icon: 'info',
                  title: `CDS order ${r.refOrderId}`,
                  text: r.sent
                    ? `${r.retailer}: sent to the CDS service admin (CDS Order Routing is on). It is listed in Settings → Delivery, not on the Orders page.`
                    : `${r.retailer}: kept on the Orders page with a CDS label (CDS Order Routing is off).`,
                });
              }}
            >
              <i className="fas fa-warehouse me-1" />Seller confirms a CDS order
            </button>
            <button className="btn btn-outline-danger btn-sm w-100 mt-2" onClick={reset}><i className="fas fa-rotate me-1" />Reset synthetic data</button>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-end">
        <button className="btn btn-dark rounded-circle shadow" style={{ width: 44, height: 44, opacity: 0.85 }} title="Mock controls" onClick={() => setOpen(!open)}>
          <i className="fas fa-flask" />
        </button>
      </div>
    </div>
  );
}
