// Single-trip map modal (kebab "Map view", spec 04 §7.2) with the route info panel on the left.
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import DataLoading from '../../../components/DataLoading';
import { logisticsOrdersService, type Hop, type RouteDetails, type TripRow } from '../../../api/services/logisticsOrders.service';
import TripRouteInfoPanel from './TripRouteInfoPanel';
import { MAP_CENTER, MAP_ZOOM, TILE_ATTRIBUTION, TILE_URL, addHopsToLayerGroup, type MapViewMode } from './mapLayers';
import './TripMaps.css';

function SingleTripLayers({ planned, delivered, mode }: { planned: Hop[]; delivered: Hop[]; mode: MapViewMode }) {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 0);
    const group = L.layerGroup().addTo(map);
    const pts = addHopsToLayerGroup(group, planned, delivered, '#800080', mode, false);
    if (pts.length) map.fitBounds(pts, { padding: [30, 30] });
    return () => {
      window.clearTimeout(t);
      group.remove();
    };
  }, [map, planned, delivered, mode]);
  return null;
}

interface Props {
  trip: TripRow;
  onClose: () => void;
}

export default function TripMapModal({ trip, onClose }: Props) {
  const tripNumber = trip.logisticsOrderId;
  const [isMapDataLoading, setIsMapDataLoading] = useState(true);
  const [isRouteDetailsLoading, setIsRouteDetailsLoading] = useState(true);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [mode, setMode] = useState<MapViewMode>('both');
  const [hops, setHops] = useState<{ planned: Hop[]; delivered: Hop[] } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Leaflet comes from the npm package (the original lazy-loaded it from unpkg).
        const [tracking, details] = await Promise.all([
          logisticsOrdersService.getBulkPlannedTrackingInfo([tripNumber]),
          logisticsOrdersService.getBulkTripRouteDetails([tripNumber]),
        ]);
        if (!alive) return;
        setRouteDetails(details[tripNumber] || null);
        setIsRouteDetailsLoading(false);
        const t = tracking[tripNumber];
        // No planned hops → no map is created at all (blank area, radios do nothing) — as-built.
        if (t && t.planned.length > 0) setHops({ planned: t.planned, delivered: t.delivered });
        setIsMapDataLoading(false);
      } catch (e) {
        console.error('Error loading trip map:', e);
        if (!alive) return;
        setIsMapDataLoading(false);
        setIsRouteDetailsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tripNumber]);

  return (
    <div className="map-modal trip-maps">
      {/* overlay click does not close (as-built) */}
      <div className="map-modal-content">
        <div className="map-modal-header">
          <h3>Trip Route Map - {tripNumber || 'Trip'}</h3>
          <button className="map-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="map-modal-body">
          <TripRouteInfoPanel routeDetails={routeDetails} isLoading={isRouteDetailsLoading} />
          <div className="map-area">
            <div className="map-view-toggle">
              {(['both', 'planned', 'delivered'] as MapViewMode[]).map((m) => (
                <label key={m}>
                  <input type="radio" name="mapViewMode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                  {m === 'both' ? 'Both' : m === 'planned' ? 'Planned' : 'Delivered'}
                </label>
              ))}
            </div>
            {isMapDataLoading && (
              <DataLoading overlay message="Waiting for tracking data..." showTip />
            )}
            <div id="trip-map" className="map-canvas">
              {hops && (
                <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
                  <ZoomControl position="topright" />
                  <SingleTripLayers planned={hops.planned} delivered={hops.delivered} mode={mode} />
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
