// Screen B-3 — Route map view (spec 03 §6). Leaflet via react-leaflet's MapContainer; layers, divIcon markers and
// HTML popups are managed imperatively like the original (window.__moveCustomer is called from popup buttons).
import { useLayoutEffect, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';
import { fmtNumber } from './drFormat';
import type { PlanRoute, MoveCustomerEvent } from './OptimizedRoutesModal';
import './RouteMapView.css';

declare global {
  interface Window {
    __moveCustomer?: (customerId: string, fromRouteId: string, toRouteId: string) => void;
  }
}

export const ROUTE_COLORS = ['#e63946', '#2a9d8f', '#e9c46a', '#264653', '#f4a261', '#7209b7'];
const colorOf = (i: number) => ROUTE_COLORS[i % 6];

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const jsArg = (v: unknown) => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');

/** spec 03 §6.5 */
export function parseCoherenceReason(text: string): { summary: string; details: string[]; footer: string } {
  const sentences = text.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 1) return { summary: text, details: [], footer: '' };
  const KEYS = ['Beats are split when', 'beats are split when', 'due to weight capacity', 'vehicle cannot serve'];
  const footerIdx = sentences.findIndex((s) => KEYS.some((k) => s.includes(k)));
  return {
    summary: sentences[0],
    details: footerIdx === -1 ? sentences.slice(1) : sentences.slice(1, footerIdx),
    footer: footerIdx === -1 ? '' : sentences[footerIdx],
  };
}

function routePoints(r: PlanRoute) {
  return (r.customers || []).filter((c) => c.lat && c.long).sort((a, b) => Number(a.seq) - Number(b.seq));
}

function markerHtml(color: string, n: number, diamond: boolean) {
  const common = `width:24px;height:24px;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;box-sizing:border-box;`;
  return diamond
    ? `<div style="${common}transform:rotate(45deg);"><span style="transform:rotate(-45deg);color:#fff;font-size:10px;font-weight:700;line-height:1;">${n}</span></div>`
    : `<div style="${common}border-radius:50%;"><span style="color:#fff;font-size:11px;font-weight:700;line-height:1;">${n}</span></div>`;
}

function popupHtml(c: PlanRoute['customers'][number], stop: number, route: PlanRoute, color: string, routes: PlanRoute[]) {
  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="color:#888;padding:2px 8px 2px 0;white-space:nowrap;">${label}</td><td style="padding:2px 0;${bold ? 'font-weight:600;' : ''}">${value}</td></tr>`;
  const orders = c.orders || [];
  const orderRows = orders
    .map((o, i) => `<tr style="background:${i % 2 ? '#fff' : '#f9f9f9'};"><td style="padding:3px 4px;">${i + 1}</td><td style="padding:3px 4px;">${esc(o.orderType || '-')}</td><td style="padding:3px 4px;">₹${esc(Number(o.orderAmount || 0).toLocaleString('en-IN'))}</td><td style="padding:3px 4px;">${esc(o.orderDeadWeight || 0)} kg</td><td style="padding:3px 4px;">${esc(o.orderVolWeight || 0)} kg</td></tr>`)
    .join('');
  const others = routes.length >= 2
    ? `<hr style="margin:10px 0;"/><div style="font-size:12px;font-weight:600;margin-bottom:6px;">Move to:</div><div style="display:flex;flex-wrap:wrap;gap:6px;">${routes
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.routeId !== route.routeId)
        .map(({ r, i }) => `<button class="lbnp-move-btn" style="color:#fff;background:${colorOf(i)};border:none;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;" onclick="window.__moveCustomer && window.__moveCustomer('${jsArg(c.customerId)}','${jsArg(route.routeId)}','${jsArg(r.routeId)}')">${esc(r.routeName)}</button>`)
        .join('')}</div>`
    : '';
  return `<div style="min-width:300px;max-height:400px;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="background:${color};color:#fff;padding:10px 14px;border-radius:6px 6px 0 0;">
    <strong style="font-size:14px;">${esc(c.customerName || c.customerBusinessName)}</strong>
    <div style="font-size:12px;opacity:.9;">${esc(c.customerBusinessName)}</div>
  </div>
  <div style="padding:10px 14px;">
    <table style="font-size:13px;width:100%;">
      ${row('Customer ID', esc(c.customerId), true)}
      ${row('Stop #', String(stop), true)}
      ${row('Mobile', `<a href="tel:${esc(c.customerMobileNumber)}" style="color:#2563eb;">${esc(c.customerMobileNumber || '-')}</a>`)}
      ${row('Beat', esc(c.beatName || '-'))}
      ${row('Sales Person', esc(c.salesPersonName || '-'))}
      ${row('Route', esc(route.routeName))}
      ${row('Total Amount', `₹${esc((c.totalAmount || 0).toLocaleString('en-IN'))}`, true)}
      ${row('Order Count', esc(c.orderCount))}
      ${row('Dead Weight', `${esc(c.totalDeadWeight || 0)} kg`)}
      ${row('Vol Weight', `${esc(c.totalVolWeight || 0)} kg`)}
      ${row('Latitude', esc(c.lat))}
      ${row('Longitude', esc(c.long))}
    </table>
    <hr style="margin:10px 0;"/>
    <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Orders (${orders.length || 0})</div>
    <table style="font-size:12px;width:100%;border-collapse:collapse;">
      <tr style="background:#eee;"><th style="padding:3px 4px;">#</th><th style="padding:3px 4px;">Type</th><th style="padding:3px 4px;">Amount</th><th style="padding:3px 4px;">Wt</th><th style="padding:3px 4px;">Vol</th></tr>
      ${orderRows}
    </table>
    ${others}
  </div>
</div>`;
}

interface Props {
  routes: PlanRoute[];
  onMoveCustomer: (e: MoveCustomerEvent) => void;
}

export default function RouteMapView({ routes, onMoveCustomer }: Props) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const anchorRef = useRef<number | null>(null);
  const [expandedKpi, setExpandedKpi] = useState<Set<number>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);
  const layersRef = useRef<{ group: L.LayerGroup; points: L.LatLngExpression[] }[]>([]);
  const moveRef = useRef(onMoveCustomer);
  useLayoutEffect(() => {
    moveRef.current = onMoveCustomer;
  }, [onMoveCustomer]);

  useEffect(() => {
    window.__moveCustomer = (customerId, fromRouteId, toRouteId) => moveRef.current({ customerId, fromRouteId, toRouteId });
    return () => {
      delete window.__moveCustomer;
    };
  }, []);

  // routes change → destroy the map, re-init after 100 ms when there are routes (selection/anchor cleared)
  useEffect(() => {
    setShowMap(false);
    setMap(null);
    setSelected(new Set());
    anchorRef.current = null;
    if (!routes || !routes.length) return;
    const t = window.setTimeout(() => {
      setMapKey((k) => k + 1);
      setShowMap(true);
    }, 100);
    return () => window.clearTimeout(t);
  }, [routes]);

  // build one layer group per route once the map exists
  useEffect(() => {
    if (!map) return;
    layersRef.current = routes.map((r, i) => {
      const color = colorOf(i);
      const group = L.layerGroup();
      const pts = routePoints(r);
      const latlngs: L.LatLngExpression[] = pts.map((c) => [Number(c.lat), Number(c.long)]);
      if (latlngs.length >= 2) L.polyline(latlngs, { color, weight: 3, opacity: 0.5, dashArray: '8 4' }).addTo(group);
      pts.forEach((c, idx) => {
        const os = c.orders || [];
        const diamond = os.length > 0 && os.every((o) => o.orderType === 'Digital');
        const icon = L.divIcon({ html: markerHtml(color, idx + 1, diamond), iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12], className: '' });
        L.marker([Number(c.lat), Number(c.long)], { icon })
          .bindPopup(popupHtml(c, idx + 1, r, color, routes), { maxWidth: 360, maxHeight: 420 })
          .addTo(group);
      });
      return { group, points: latlngs };
    });
    return () => {
      layersRef.current.forEach((l) => l.group.remove());
      layersRef.current = [];
    };
  }, [map, routes]);

  // show all / render selected
  useEffect(() => {
    if (!map || !layersRef.current.length) return;
    const layers = layersRef.current;
    if (selected.size === 0) {
      layers.forEach((l) => l.group.addTo(map));
      const all = layers.flatMap((l) => l.points);
      if (all.length) map.fitBounds(L.latLngBounds(all), { padding: [30, 30] });
    } else {
      layers.forEach((l, i) => (selected.has(i) ? l.group.addTo(map) : l.group.remove()));
      const pts = layers.filter((_, i) => selected.has(i)).flatMap((l) => l.points);
      if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [50, 50] });
    }
  }, [map, selected]);

  const showAllRoutes = () => {
    anchorRef.current = null;
    setSelected(new Set());
  };

  const onItemClick = (e: React.MouseEvent, i: number) => {
    let next: Set<number>;
    if (e.shiftKey) {
      const a = anchorRef.current ?? i;
      next = new Set();
      for (let k = Math.min(a, i); k <= Math.max(a, i); k++) next.add(k);
    } else if (e.ctrlKey || e.metaKey) {
      next = new Set(selected);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      anchorRef.current = i;
    } else {
      next = new Set([i]);
      anchorRef.current = i;
    }
    if (next.size === 0) showAllRoutes();
    else setSelected(next);
  };

  const toggleFullscreen = () => {
    setFullscreen((f) => !f);
    window.setTimeout(() => map?.invalidateSize(), 300);
  };

  const sidebarBeats = useMemo(
    () => routes.map((r) => {
      if (r.beats && r.beats.length) return r.beats;
      const m: Record<string, number> = {};
      (r.customers || []).forEach((c) => {
        const b = c.beatName || 'No Beat';
        m[b] = (m[b] || 0) + 1;
      });
      return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, inRoute: n, total: n, coherencePct: 100 }));
    }),
    [routes],
  );

  return (
    <div className={`route-map-view map-view-container${fullscreen ? ' map-fullscreen' : ''}`}>
      <div className="map-sidebar">
        <button className={`show-all-btn${selected.size === 0 ? ' active' : ''}`} onClick={showAllRoutes}>
          <i className="fas fa-layer-group" /> Show All Routes{' '}
        </button>
        <div className="map-hint">Click a route to focus it · Shift-click for a range · Ctrl/⌘-click to add</div>
        {routes.map((r, i) => {
          const expanded = expandedKpi.has(i);
          const reason = r.beatCoherenceReason && (r.beatCoherenceScore ?? 0) < 100 ? parseCoherenceReason(r.beatCoherenceReason) : null;
          return (
            <div
              key={`${r.routeId}-${i}`}
              className={`route-item${selected.has(i) ? ' active' : ''}`}
              title="Click to focus · Shift-click for a range · Ctrl/⌘-click to add"
              onMouseDown={(e) => e.shiftKey && e.preventDefault()}
              onClick={(e) => onItemClick(e, i)}
            >
              <div className="route-item-header">
                <span className="route-dot" style={{ background: colorOf(i) }} />
                <strong>{r.routeName}</strong>
                {r.routeDirection && <span className="direction-badge">{r.routeDirection}</span>}
              </div>
              <div className="route-item-details">
                <div>{r.customerCount} stops · {fmtNumber(r.distanceKm, 1, 1)} km</div>
                <div>₹{fmtNumber(r.totalAmount, 2, 2)} · {r.estimatedTimeFormatted} · {r.vehicleType}</div>
                <div>Wt: {fmtNumber(r.totalWeightKg, 2, 2)} kg · Vol: {fmtNumber(r.totalVolWeightKg, 2, 2)} kg · Cap: {r.vehicleCapacity} kg</div>
              </div>
              {r.beatCoherenceScore !== undefined && (
                <div className="kpi-box">
                  <div className="kpi-row">
                    <span className="kpi-label">Vehicle Utilized</span>
                    <span className="kpi-value">{fmtNumber(r.vehicleUtilized, 0, 0)}%</span>
                  </div>
                  <span
                    className="kpi-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedKpi((s) => {
                        const n = new Set(s);
                        if (n.has(i)) n.delete(i);
                        else n.add(i);
                        return n;
                      });
                    }}
                  >
                    {expanded ? '▲ Hide details' : '▼ Show details'}
                  </span>
                  {expanded && (
                    <>
                      {r.routeExplanation && <p className="kpi-explanation">{r.routeExplanation}</p>}
                      {reason && (
                        <div className="kpi-reason">
                          <div className="kpi-reason-summary">{reason.summary}</div>
                          {reason.details.length > 0 && (
                            <ul className="kpi-reason-details">{reason.details.map((d, k) => <li key={k}>{d}</li>)}</ul>
                          )}
                          {reason.footer && <div className="kpi-reason-footer">{reason.footer}</div>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {expanded && (
                <div className="route-beats">
                  <div className="route-beats-title">{sidebarBeats[i].length} beats:</div>
                  <div className="route-beat-tags">
                    {sidebarBeats[i].map((b) => (
                      <span key={b.name} className="route-beat-tag" style={{ borderLeftColor: colorOf(i) }}>
                        {b.name} ({b.inRoute}/{b.total}) <span className="beat-pct">{b.coherencePct}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="map-wrapper">
        {showMap && (
          <MapContainer key={mapKey} id="route-map" ref={setMap} center={[17.4, 78.5]} zoom={12} style={{ width: '100%', height: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
          </MapContainer>
        )}
        <button className="map-fullscreen-btn" title={fullscreen ? 'Exit Fullscreen' : 'Expand Map'} onClick={toggleFullscreen}>
          <i className={`fas ${fullscreen ? 'fa-compress' : 'fa-expand'}`} />
        </button>
      </div>
    </div>
  );
}
