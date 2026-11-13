// Service Centre → CDS Network: the Cross Dock Stores it feeds, their delivery areas, and the distributors it serves.
import { useMemo, useState } from 'react';
import DataLoading from '../../components/DataLoading';
import { crossDockService } from '../../api/services/crossDock.service';
import type { XdOrderRow } from '../../types/crossDock';
import { distanceKm, polygonAreaKm2 } from '../../utils/geo';
import { DELIVERY_MODE, plural } from './labels';
import { cdsColor } from './mapColors';
import NetworkMap, { MapLegend } from './NetworkMap';
import { LoadError, PageHeader, StatCard, StatusPill } from './ScUi';
import { useLoad } from './useLoad';

export default function CdsNetworkPage() {
  const { data, loading, error, reload } = useLoad(() => Promise.all([crossDockService.overview(), crossDockService.orders()]));
  const [focus, setFocus] = useState<string | null>(null);
  const [showRetailers, setShowRetailers] = useState(true);
  const [overview, orders] = data ?? [null, [] as XdOrderRow[]];

  const cdsRows = useMemo(() => {
    if (!overview) return [];
    return overview.cdss.map((c) => {
      const inbound = orders.filter((o) => o.cdsId === c.id && o.status !== 'DIRECT_DELIVERY');
      return {
        c,
        areaKm2: polygonAreaKm2(c.polygon),
        retailers: overview.retailers.filter((r) => (c.status === 'LIVE' ? r.cdsId === c.id : r.onboardingCdsId === c.id)).length,
        inbound: inbound.length,
        dropped: inbound.filter((o) => o.status === 'DROPPED_AT_CDS').length,
        distributors: new Set(inbound.map((o) => o.distributorId)).size,
      };
    });
  }, [overview, orders]);

  const distRows = useMemo(() => {
    if (!overview) return [];
    return overview.distributors.map((d) => {
      const mine = orders.filter((o) => o.distributorId === d.id);
      const reach = overview.cdss.filter((c) => c.status === 'LIVE' && distanceKm([d.lat, d.lng], [c.lat, c.lng]) <= d.coverageKm + c.radiusKm * 0.5);
      return { d, crossDock: mine.filter((o) => o.status !== 'DIRECT_DELIVERY').length, direct: mine.filter((o) => o.status === 'DIRECT_DELIVERY').length, reach };
    });
  }, [overview, orders]);

  if (loading && !data) return <DataLoading message="Loading the network..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!overview) return null;

  const live = overview.cdss.filter((c) => c.status === 'LIVE');
  const covered = overview.retailers.filter((r) => r.cdsId).length;
  const xdDistributors = overview.distributors.filter((d) => d.deliveryModes.includes('CROSS_DOCK'));

  return (
    <div className="sc-page">
      <PageHeader
        refreshError={error}
        icon="fa-diagram-project"
        title="CDS Network"
        subtitle="The Cross Dock Stores this Service Centre feeds, their delivery areas, and the distributors it picks up from."
        actions={
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={reload} disabled={loading} aria-label="Refresh">
            <i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`} />
          </button>
        }
      />

      <div className="sc-stats">
        <StatCard label="Live Cross Dock Stores" value={live.length} sub={`${overview.cdss.length - live.length} more onboarding`} icon="fa-store" tone="green" />
        <StatCard label="Retailers in a live area" value={`${covered} of ${overview.retailers.length}`} sub="Get cross-dock delivery" icon="fa-shop" tone="blue" />
        <StatCard label="Retailers outside" value={overview.retailers.length - covered} sub="Get direct delivery for now" icon="fa-arrow-turn-down" tone="grey" />
        <StatCard label="Distributors on cross-dock" value={xdDistributors.length} sub={`of ${overview.distributors.length} in the city`} icon="fa-industry" tone="indigo" />
      </div>

      <div className="sc-card mb-3">
        <div className="sc-card-head">
          <h2 className="sc-card-title">Delivery areas</h2>
          <div className="form-check form-switch m-0">
            <input className="form-check-input" type="checkbox" id="sc-show-retailers" checked={showRetailers} onChange={(e) => setShowRetailers(e.target.checked)} />
            <label className="form-check-label small" htmlFor="sc-show-retailers">Show retailers</label>
          </div>
        </div>
        <div className="sc-card-body">
          <NetworkMap overview={overview} showRetailers={showRetailers} focusCdsId={focus} onCdsClick={(id) => setFocus(focus === id ? null : id)} height={440} />
          <MapLegend overview={overview} showRetailers={showRetailers} />
          <div className="alert alert-light border small mt-3 mb-0">
            <strong>How an order is routed.</strong> The distributor’s own area decides which retailers can order from it (unchanged). These Cross Dock Store areas
            decide how the order is delivered: a retailer inside a live area gets cross-dock delivery through this Service Centre; anyone else gets direct delivery
            from the distributor’s 3PL until a store opens there. Self-delivery is allowed only for HUL and ITC distributors.
          </div>
        </div>
      </div>

      <div className="sc-card mb-3">
        <div className="sc-card-head">
          <h2 className="sc-card-title">Cross Dock Stores</h2>
          <span className="text-muted small">Click an area on the map to highlight it</span>
        </div>
        <div className="table-responsive">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Operator</th>
                <th className="num">Area</th>
                <th className="num">Retailers</th>
                <th className="num">Riders</th>
                <th className="num">Today’s orders</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cdsRows.map(({ c, areaKm2, retailers, inbound, dropped, distributors }) => (
                <tr key={c.id} style={focus === c.id ? { outline: '2px solid #2563eb', outlineOffset: -2 } : undefined} onClick={() => setFocus(focus === c.id ? null : c.id)}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="sc-dot" style={{ background: c.status === 'LIVE' ? cdsColor(overview, c.id) : '#9ca3af' }} aria-hidden="true" />
                      <span className="fw-semibold">{c.name}</span>
                    </div>
                    <div className="muted">{c.code} · {c.address}</div>
                  </td>
                  <td>
                    {c.operatorName}
                    <div className="muted">{c.phone}</div>
                  </td>
                  <td className="num">
                    {areaKm2.toFixed(1)} km²
                    <div className="muted">~{c.radiusKm} km radius</div>
                  </td>
                  <td className="num">{retailers}</td>
                  <td className="num">{c.riders || '-'}</td>
                  <td className="num">
                    {c.status === 'LIVE' ? inbound : '-'}
                    {c.status === 'LIVE' && <div className="muted">{dropped} dropped · from {plural(distributors, 'distributor')}</div>}
                  </td>
                  <td>{c.status === 'LIVE' ? <StatusPill label="Live" tone="green" /> : <StatusPill label="Onboarding" tone="amber" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sc-card">
        <div className="sc-card-head">
          <h2 className="sc-card-title">Distributors</h2>
          <span className="text-muted small">Pickup points for cross-dock orders</span>
        </div>
        <div className="table-responsive">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Distributor</th>
                <th>Delivery</th>
                <th className="num">Sells within</th>
                <th>Live stores in reach</th>
                <th className="num">Today: cross-dock</th>
                <th className="num">Today: direct</th>
              </tr>
            </thead>
            <tbody>
              {distRows.map(({ d, crossDock, direct, reach }) => (
                <tr key={d.id}>
                  <td>
                    <span className="fw-semibold">{d.name}</span>
                    <div className="muted">{d.locality} · {d.contactName}, {d.phone}</div>
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {d.deliveryModes.map((m) => (
                        <span key={m} className={`sc-chip${m === 'CROSS_DOCK' ? ' sc-chip--cds' : ''}`}>
                          {DELIVERY_MODE[m]}
                          {m === 'SELF' && d.brand ? ` (${d.brand})` : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="num">{d.coverageKm} km</td>
                  <td>
                    {d.deliveryModes.includes('CROSS_DOCK') ? (
                      <div className="d-flex gap-1 flex-wrap">
                        {reach.map((c) => (
                          <span key={c.id} className="sc-chip sc-chip--cds">{c.code}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="muted">{d.deliveryModes.includes('SELF') ? 'Delivers its own orders' : 'Opted for direct only'}</span>
                    )}
                  </td>
                  <td className="num">{d.deliveryModes.includes('CROSS_DOCK') ? crossDock : '-'}</td>
                  <td className="num">{d.deliveryModes.includes('CROSS_DOCK') ? direct : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
