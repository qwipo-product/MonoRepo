// Port of <app-orders-map-view> (spec 01 §1.9): Ready-for-Planning customer locations on a Leaflet map with
// hover tooltips, click popups and the offline-delivery actions (mark_offline / mark_delivered / revert).
// Leaflet is bundled (the original injected it from unpkg); popups are HTML strings like the original, wired
// to real click handlers on `popupopen` instead of `window.__offlineAction`.
import { useLayoutEffect, useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { ordersService, type MapLocation, type MapStats } from '../../../api/services/orders.service';
import { getOrderStatusLabel } from '../../../utils/helpers';
import { ngNumber, useInstance } from '../useInstance';
import './OrdersMapView.css';

interface Props {
  show: boolean;
  buyerId: string;
  onClose: () => void;
  onDataChanged: () => void;
}

type OfflineAction = 'mark_offline' | 'mark_delivered' | 'revert';

const DEFAULT_STATS: MapStats = { totalLocations: 0, totalOrders: 0, totalAmount: 0, onlineLocations: 0, offlineLocations: 0 };

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const inr = (n: unknown) => (Number(n) || 0).toLocaleString('en-IN');

const PIN_PATH = 'M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z';

function pinSvg(loc: MapLocation, color: string, offline: boolean): string {
  const inner = offline
    ? `<line x1="11" y1="10" x2="17" y2="16" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/><line x1="17" y1="10" x2="11" y2="16" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
    : `<text x="14" y="17" text-anchor="middle" font-size="11" font-weight="700" fill="${color}" font-family="Inter, Arial, sans-serif">${esc(loc.orderCount)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="${PIN_PATH}" fill="${color}"/><circle cx="14" cy="13" r="6" fill="#fff"/>${inner}</svg>`;
}

function tooltipHtml(loc: MapLocation, offline: boolean): string {
  const statuses = Array.from(new Set((loc.orders || []).map((o) => getOrderStatusLabel(Number(o.statusId)))));
  const statusText = statuses.length > 1 ? 'Multiple' : statuses[0] ?? '';
  const row = (label: string, value: string) => `<div class="ot-row"><span class="ot-label">${label}</span><span class="ot-value">${value}</span></div>`;
  return `<div class="ot-card ${offline ? 'op-offline' : 'op-online'}">
    <div class="ot-head"><span class="ot-dot"></span><span class="ot-name">${esc(loc.customerBusinessName)}</span></div>
    <div class="ot-rows">
      ${row('Customer Name', esc(loc.customerBusinessName))}
      ${row('Order Type', esc(loc.orders?.[0]?.orderType || 'N/A'))}
      ${row('Invoice Value', `₹${inr(loc.totalAmount)}`)}
      ${row('Order Status', esc(statusText))}
      ${row('Vol. Weight', `${esc(loc.totalVolumetricWeight)} Kg`)}
    </div>
  </div>`;
}

const SVG_PIN = (c: string) => `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const SVG_WIFI_OFF = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`;
const SVG_CHECK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_REVERT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`;
const spinnerSvg = (c: string) =>
  `<svg class="op-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="${c}" stroke-opacity=".25" stroke-width="3"/><path d="M21 12a9 9 0 0 0-9-9" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>`;

function popupHtml(loc: MapLocation, offline: boolean): string {
  const n = loc.orderCount;
  const word = n === 1 ? 'order' : 'orders';
  const initial = (loc.customerBusinessName || '').charAt(0).toUpperCase() || '?';
  const mobile = esc(loc.customerMobileNumber);
  const orders = (loc.orders || [])
    .map((o) => `<div class="op-order">
        <span class="op-order-dot"></span>
        <div class="op-order-main">
          <div class="op-order-id">${esc(o.refOrderId || String(o.orderId || '').substring(0, 8))}</div>
          <div class="op-order-sub">${esc(o.salesPersonName || '—')} · ${esc(o.salesBeatName || '—')}</div>
        </div>
        <div class="op-order-amt">₹${Number(o.amount).toLocaleString('en-IN')}</div>
      </div>`)
    .join('');
  const footer = offline
    ? `<div class="op-hint">Applies to all ${n} ${word} at this location</div>
       <div class="op-actions">
         <button class="op-btn op-btn-deliver" data-mobile="${mobile}" data-action="mark_delivered">${SVG_CHECK}<span>Mark as Delivered</span></button>
         <button class="op-btn op-btn-revert" data-mobile="${mobile}" data-action="revert" title="Revert to previous status">${SVG_REVERT}</button>
       </div>`
    : `<div class="op-actions">
         <button class="op-btn op-btn-offline" data-mobile="${mobile}" data-action="mark_offline">${SVG_WIFI_OFF}<span>Mark as Offline Delivery (${n} ${word})</span></button>
       </div>`;
  return `<div class="op-card ${offline ? 'op-offline' : 'op-online'}">
    <div class="op-head">
      <div class="op-avatar">${esc(initial)}</div>
      <div class="op-head-main">
        <div class="op-name">${esc(loc.customerBusinessName)}</div>
        <span class="op-badge"><span class="op-badge-dot"></span>${offline ? 'Offline Delivery' : 'Online Delivery'}</span>
      </div>
    </div>
    <div class="op-address">${SVG_PIN(offline ? '#f59e0b' : '#2563eb')}<span>${esc(loc.customerAddress)}</span></div>
    <div class="op-orders">${orders}</div>
    <div class="op-summary">
      <span class="op-summary-label">${n} ${word} at this location</span>
      <span class="op-summary-total">₹${inr(loc.totalAmount)}</span>
    </div>
    <div class="op-footer">${footer}</div>
  </div>`;
}

export default function OrdersMapView({ show, buyerId, onClose, onDataChanged }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const props = useRef({ buyerId, onClose, onDataChanged });
  useLayoutEffect(() => {
    props.current = { buyerId, onClose, onDataChanged };
  }, [buyerId, onClose, onDataChanged]);
  const [s, update] = useInstance(() => ({
    isLoading: false,
    isFullscreen: false,
    locations: [] as MapLocation[],
    stats: { ...DEFAULT_STATS } as MapStats,
    map: null as L.Map | null,
    markers: null as L.LayerGroup | null,
    initTimer: undefined as number | undefined,
  }));

  const destroyMap = () => {
    if (s.map) {
      s.map.remove();
      s.map = null;
      s.markers = null;
    }
  };

  const loadData = async () => {
    s.isLoading = true;
    update();
    const data = await ordersService.getOrderLocations(props.current.buyerId);
    if (data) {
      s.locations = data.locations || [];
      s.stats = data.stats || s.stats;
    }
    s.isLoading = false;
    update();
    renderMarkers();
  };

  const handleOfflineAction = async (mobile: string, action: OfflineAction, clicked: HTMLButtonElement, popupEl: HTMLElement | null) => {
    // as-built: only the first location with that mobile number is used
    const loc = s.locations.find((l) => l.customerMobileNumber === mobile);
    if (!loc) return;
    const orderIds = (loc.orders || []).map((o) => o.orderId);
    const buttons = Array.from((popupEl || clicked.parentElement!).querySelectorAll<HTMLButtonElement>('button.op-btn'));
    const original = buttons.map((b) => b.innerHTML);
    buttons.forEach((b) => {
      b.disabled = true;
      b.style.pointerEvents = 'none';
      b.style.opacity = '.7';
    });
    const spinColor = action === 'mark_delivered' ? '#22c55e' : action === 'mark_offline' ? '#f59e0b' : '#888';
    clicked.innerHTML = `${spinnerSvg(spinColor)}<span>Processing...</span>`;
    try {
      await ordersService.updateOfflineDelivery(orderIds, action, props.current.buyerId);
      s.map?.closePopup();
      await loadData();
      props.current.onDataChanged();
    } catch (e) {
      // as-built: no message is shown to the user
      console.error('Offline delivery action failed:', e);
      buttons.forEach((b, i) => {
        b.innerHTML = original[i];
        b.disabled = false;
        b.style.pointerEvents = '';
        b.style.opacity = '';
      });
    }
  };

  const renderMarkers = () => {
    const map = s.map;
    const group = s.markers;
    if (!map || !group) return;
    group.clearLayers();
    const points: L.LatLngExpression[] = [];
    s.locations.forEach((loc) => {
      const lat = parseFloat(String(loc.lat));
      const lng = parseFloat(String(loc.long));
      if (isNaN(lat) || isNaN(lng)) return;
      const offline = loc.status === 'offline';
      const color = offline ? '#f59e0b' : '#3b82f6';
      const icon = L.divIcon({ className: 'custom-map-pin', html: pinSvg(loc, color, offline), iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -36] });
      const marker = L.marker([lat, lng], { icon });
      marker.bindTooltip(tooltipHtml(loc, offline), { direction: 'auto', offset: [0, -20], className: 'map-hover-tooltip' });
      marker.bindPopup(popupHtml(loc, offline), { className: 'order-popup-wrap', maxWidth: 312, minWidth: 312, closeButton: true });
      marker.on('popupopen', (e: L.PopupEvent) => {
        const el = e.popup.getElement() || null;
        el?.querySelectorAll<HTMLButtonElement>('button.op-btn').forEach((btn) => {
          btn.onclick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            handleOfflineAction(btn.dataset.mobile || '', btn.dataset.action as OfflineAction, btn, el);
          };
        });
      });
      group.addLayer(marker);
      points.push([lat, lng]);
    });
    if (points.length > 0) map.fitBounds(L.latLngBounds(points as L.LatLngTuple[]), { padding: [40, 40] });
  };

  const initMap = () => {
    const el = mapEl.current;
    if (!el || s.map) return;
    const map = L.map(el, { zoomControl: false }).setView([17.4, 78.5], 12);
    L.control.zoom({ position: 'topleft' }).addTo(map);
    const Fullscreen = L.Control.extend({
      options: { position: 'topright' },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const a = L.DomUtil.create('a', 'map-fullscreen-btn', container) as HTMLAnchorElement;
        a.href = '#';
        a.title = 'Toggle fullscreen';
        a.setAttribute('role', 'button');
        a.innerHTML = '<i class="fas fa-expand"></i>';
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(a, 'click', (ev) => {
          L.DomEvent.preventDefault(ev);
          s.isFullscreen = !s.isFullscreen;
          a.innerHTML = s.isFullscreen ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
          update();
          window.setTimeout(() => s.map?.invalidateSize(), 350);
        });
        return container;
      },
    });
    new Fullscreen().addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    s.map = map;
    s.markers = L.layerGroup().addTo(map);
    renderMarkers();
  };

  useEffect(() => {
    if (!show || !buyerId) return;
    loadData();
    s.initTimer = window.setTimeout(() => initMap(), 100);
    return () => {
      window.clearTimeout(s.initTimer);
      destroyMap();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, buyerId]);

  const close = () => {
    destroyMap();
    s.isFullscreen = false;
    update();
    props.current.onClose();
  };

  if (!show) return null;

  return (
    <div className={`orders-map-panel map-panel${s.isFullscreen ? ' fullscreen' : ''}`}>
      <div className="map-header">
        <div className="map-header-left">
          <div className="map-header-icon"><i className="fas fa-map-marker-alt" /></div>
          <div>
            <h2>Orders Map View</h2>
            <p>Ready for Planning — customer locations</p>
          </div>
        </div>
        <div className="map-header-right">
          <div className="map-legend">
            <span className="legend-dot" style={{ background: '#3b82f6' }} /> Online{' '}
            <span className="legend-dot" style={{ background: '#f59e0b' }} /> Offline{' '}
          </div>
          <div className="map-stat"><i className="fas fa-shopping-bag" /> <strong>{s.stats.totalOrders}</strong> orders </div>
          <div className="map-stat"><i className="fas fa-location-dot" /> <strong>{s.stats.totalLocations}</strong> locations </div>
          <div className="map-stat"><span className="rupee-icon">₹</span> <strong>{ngNumber(s.stats.totalAmount, 0, 0)}</strong> total value </div>
          <button className="map-close-btn" onClick={close} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
      </div>
      <div className="map-body">
        <div id="orders-map" ref={mapEl} className="orders-map" />
        {s.isLoading && (
          <div className="map-loading">
            <i className="fas fa-spinner fa-spin" /> Loading locations...{' '}
          </div>
        )}
      </div>
    </div>
  );
}
