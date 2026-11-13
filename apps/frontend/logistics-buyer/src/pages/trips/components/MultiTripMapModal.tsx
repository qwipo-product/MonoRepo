// Multi-trip map modal (header "Map View" button, spec 04 §7.3).
import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import DataLoading from '../../../components/DataLoading';
import { logisticsOrdersService, type Hop, type RouteDetails, type TripRow } from '../../../api/services/logisticsOrders.service';
import { addCurrency } from '../../../utils/pipes';
import { ngNumber, parseCoherenceReason } from '../tripUtils';
import { MAP_CENTER, MAP_ZOOM, MULTI_TRIP_COLORS, TILE_ATTRIBUTION, TILE_URL, addHopsToLayerGroup, type MapViewMode } from './mapLayers';
import './TripMaps.css';

interface TripLayer {
  trip: TripRow;
  planned: Hop[];
  delivered: Hop[];
  color: string;
  routeDetails: RouteDetails | null;
}

function MultiTripLayers({ layers, mode, focus, fitNonce }: { layers: TripLayer[]; mode: MapViewMode; focus: number; fitNonce: number }) {
  const map = useMap();
  const groups = useRef<{ group: L.LayerGroup; pts: L.LatLngTuple[] }[]>([]);
  const focusRef = useRef(focus);
  useLayoutEffect(() => {
    focusRef.current = focus;
  }, [focus]);

  // (Re)build every trip's group when the data or the view mode changes; bounds are NOT re-fitted on mode change.
  useEffect(() => {
    groups.current.forEach((g) => g.group.remove());
    groups.current = layers.map((l) => {
      const group = L.layerGroup();
      const pts = addHopsToLayerGroup(group, l.planned, l.delivered, l.color, mode, true);
      return { group, pts };
    });
    groups.current.forEach((g, i) => {
      if (focusRef.current === -1 || focusRef.current === i) g.group.addTo(map);
    });
  }, [map, layers, mode]);

  // Focus change ("Show All Routes" / route item click): show the relevant group(s) and fit bounds.
  useEffect(() => {
    groups.current.forEach((g) => g.group.remove());
    const shown = focus === -1 ? groups.current : groups.current.filter((_, i) => i === focus);
    shown.forEach((g) => g.group.addTo(map));
    const pts = shown.flatMap((g) => g.pts);
    if (pts.length) map.fitBounds(pts, { padding: focus === -1 ? [30, 30] : [50, 50] });
  }, [map, focus, fitNonce, layers]);

  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 0);
    return () => {
      window.clearTimeout(t);
      groups.current.forEach((g) => g.group.remove());
    };
  }, [map]);
  return null;
}

interface Props {
  trips: TripRow[];
  onClose: () => void;
}

export default function MultiTripMapModal({ trips, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState<TripLayer[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [focus, setFocus] = useState(-1);
  const [fitNonce, setFitNonce] = useState(0);
  const [mode, setMode] = useState<MapViewMode>('both');

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    (async () => {
      try {
        const ids = trips.map((t) => t.logisticsOrderId);
        const [tracking, details] = await Promise.all([
          logisticsOrdersService.getBulkPlannedTrackingInfo(ids),
          logisticsOrdersService.getBulkTripRouteDetails(ids),
        ]);
        if (!alive) return;
        const built = trips.map((trip, i) => ({
          trip,
          planned: tracking[trip.logisticsOrderId]?.planned || [],
          delivered: tracking[trip.logisticsOrderId]?.delivered || [],
          color: MULTI_TRIP_COLORS[i % MULTI_TRIP_COLORS.length],
          routeDetails: details[trip.logisticsOrderId] ?? null,
        }));
        // map is initialised 100 ms later (as-built)
        timer = window.setTimeout(() => {
          if (!alive) return;
          setMapReady(true);
          setLayers(built);
          setLoading(false);
        }, 100);
      } catch (e) {
        console.error('Error loading multi-trip map:', e);
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [trips]);

  const toggleExpanded = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const showAll = () => {
    setFocus(-1);
    setFitNonce((n) => n + 1);
  };
  const focusTrip = (i: number) => {
    setFocus(i);
    setFitNonce((n) => n + 1);
  };

  return (
    <div className="map-modal trip-maps">
      <div className="map-modal-content">
        <div className="map-modal-header">
          <h3>Multi-Trip Route Map ({layers.length} trips)</h3>
          <button className="map-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="map-modal-body">
          <div className="multi-trip-sidebar">
            <button className={`show-all-btn${focus === -1 ? ' active' : ''}`} onClick={showAll}>
              <i className="fas fa-layer-group" /> Show All Routes
            </button>
            {layers.map((l, i) => {
              const row = l.trip;
              const rd = l.routeDetails;
              const isOpen = expanded.has(i);
              const util =
                rd?.vehicleUtilized !== null && rd?.vehicleUtilized !== undefined
                  ? `${Math.round(rd.vehicleUtilized)}%`
                  : row.vehicleVolumetricCapacityKg
                    ? `${Math.round((row.volumetricWeight / row.vehicleVolumetricCapacityKg) * 100)}%`
                    : null;
              const score = rd?.beatCoherenceScore;
              const showCoherence = !!rd?.beatCoherenceReason && score !== null && score !== undefined && score < 100;
              const parsed = showCoherence ? parseCoherenceReason(rd!.beatCoherenceReason as string) : null;
              return (
                <div key={row.id + i} className={`route-item${focus === i ? ' active' : ''}`} onClick={() => focusTrip(i)}>
                  <div className="route-item-header">
                    <span className="route-dot" style={{ background: l.color }} />
                    <span className="route-trip-number">{row.logisticsOrderId}</span>
                    {rd?.routeDirection && <span className="direction-badge">{rd.routeDirection}</span>}
                  </div>
                  <div className="route-item-details">
                    <div>
                      {rd ? rd.customerCount : row.dropPoints || 0} stops ·{' '}
                      {rd?.distanceKm !== null && rd?.distanceKm !== undefined ? `${ngNumber(rd.distanceKm, '1.1-1')} km` : `${row.totalDistance || 'N/A'} km`}
                    </div>
                    <div>
                      {rd?.totalAmount !== null && rd?.totalAmount !== undefined ? `₹${ngNumber(rd.totalAmount, '1.2-2')}` : addCurrency(row.logisticsOrderCharges)} ·{' '}
                      {rd?.estimatedTimeFormatted || row.arrivalTime || 'N/A'} · {rd?.registrationNumber || row.vehicle || 'N/A'}
                    </div>
                    <div>
                      Wt: {rd?.totalWeightKg !== null && rd?.totalWeightKg !== undefined ? ngNumber(rd.totalWeightKg, '1.2-2') : row.volumetricWeight || 0} kg · Vol:{' '}
                      {rd?.totalVolWeightKg !== null && rd?.totalVolWeightKg !== undefined ? ngNumber(rd.totalVolWeightKg, '1.2-2') : row.volumetricWeight || 0} kg · Cap:{' '}
                      {rd?.vehicleCapacityKg !== null && rd?.vehicleCapacityKg !== undefined ? ngNumber(rd.vehicleCapacityKg, '1.1-1') : row.vehicleVolumetricCapacityKg || 'N/A'} kg
                    </div>
                  </div>
                  {util !== null && (
                    <div className="route-kpi">
                      <span className="route-kpi-label">Vehicle Utilized</span>
                      <span className="route-kpi-value">{util}</span>
                    </div>
                  )}
                  <button type="button" className="route-toggle" onClick={(e) => toggleExpanded(i, e)}>
                    {isOpen ? '▲ Hide details' : '▼ Show details'}
                  </button>
                  {isOpen && (
                    <div className="route-expanded">
                      {rd?.routeExplanation && <div className="rip-explanation">{rd.routeExplanation}</div>}
                      {showCoherence && parsed && (
                        <div className="coherence-box">
                          <div className="coherence-summary">{parsed.summary}</div>
                          {parsed.details.length > 0 && (
                            <ul className="coherence-details">
                              {parsed.details.map((d, k) => <li key={k}>{d}</li>)}
                            </ul>
                          )}
                          {parsed.footer && <div className="coherence-footer">{parsed.footer}</div>}
                        </div>
                      )}
                      {rd?.beats && rd.beats.length > 0 && (
                        <div className="route-beats">
                          <div className="rip-beats-title">{rd.beats.length} beats:</div>
                          {rd.beats.map((b, k) => (
                            <div className="route-beat-tag" key={k} style={{ borderLeftColor: l.color }}>
                              {`${b.name} (${b.inRoute}/${b.total})`} <strong>{b.coherencePct}%</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="map-area">
            <div className="map-view-toggle">
              {(['both', 'planned', 'delivered'] as MapViewMode[]).map((m) => (
                <label key={m}>
                  <input type="radio" name="multiMapViewMode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                  {m === 'both' ? 'Both' : m === 'planned' ? 'Planned' : 'Delivered'}
                </label>
              ))}
            </div>
            {loading && (
              <DataLoading overlay message="Loading trip routes..." showTip />
            )}
            <div id="multi-trip-map" className="map-canvas">
              {mapReady && (
                <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
                  <ZoomControl position="topright" />
                  <MultiTripLayers layers={layers} mode={mode} focus={focus} fitNonce={fitNonce} />
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
