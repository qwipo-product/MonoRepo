// Port of TripsComponent (`app-trips`, spec 04): KPI cards, applied-filter chips, dark-store seller actions,
// 14-column table with expandable rows, kebab menu + Download submenu, cancel modal, single / multi trip maps,
// paginator and localStorage filter persistence (`trips_filters`).
import { Fragment, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import Tooltip from '@mui/material/Tooltip';
import DataLoading from '../../components/DataLoading';
import FiltersModal from '../../components/FiltersModal';
import Paginator from '../../components/Paginator';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { buyerService } from '../../api/services/buyer.service';
import { filterPersistence } from '../../api/services/filterPersistence.service';
import { logisticsOrdersService as svc, type TripChannel, type TripRow, type TripStats } from '../../api/services/logisticsOrders.service';
import { getTripStatusLabel } from '../../utils/helpers';
import { addCurrency } from '../../utils/pipes';
import TripMapModal from './components/TripMapModal';
import MultiTripMapModal from './components/MultiTripMapModal';
import {
  calculateEstimatedCompletion, calculateTimeCovered, getOrderSummary, getTripStatusClass, hasReturnProducts, inrSymbol0,
  pickupChipLabel, statusClass,
} from './tripUtils';
import './TripsPage.css';

interface TempFilters {
  buyerId: string;
  logisticsOrderId?: string;
  pickupDate: string;
  statuses: number[];
  providerNames: string[];
  pageSize: number;
  pageNumber: number;
  [k: string]: any;
}

const ZERO_STATS: TripStats = { totalLogisticOrders: 0, inTransit: 0, delivered: 0, planned: 0 };
const KEBAB_MENU_HEIGHT = 220;
const SUBMENU_HEIGHT = 320;
const KEBAB_WIDTH = 230;

/**
 * The Trips page tabs. They share this screen and its columns, and each trip appears on one tab only:
 * `trips` = Direct Delivery (3PL trips: one vehicle delivers and brings returns back in the same trip),
 * `consolidated-delivery` = trips the CDS service center creates to collect the goods for CDS orders, and
 * `consolidated-returns` = trips that bring retailers' returns back from the CDS (they close with the return OTP).
 */
export type TripsView = 'trips' | 'consolidated-delivery' | 'consolidated-returns';

const TRIP_TABS: { view: TripsView; label: string; to: string; channel?: TripChannel; description: string; empty: string }[] = [
  { view: 'trips', label: 'Direct Delivery', to: '/trips', description: 'Track and manage delivery trips, routes, and drivers.', empty: 'No trips found' },
  {
    view: 'consolidated-delivery',
    label: 'Consolidated Delivery',
    to: '/trips/consolidated-delivery',
    channel: 'cds',
    description: 'Trips the CDS service center creates to collect your goods for CDS orders.',
    empty: 'No consolidated delivery trips yet.',
  },
  {
    view: 'consolidated-returns',
    label: 'Consolidated Returns',
    to: '/trips/consolidated-returns',
    channel: 'cds-returns',
    description: "Trips that bring retailers' returns back from the CDS service center. Each trip closes with the return OTP.",
    empty: 'No consolidated return trips yet.',
  },
];

export default function TripsPage({ view = 'trips' }: { view?: TripsView }) {
  const tab = TRIP_TABS.find((t) => t.view === view) ?? TRIP_TABS[0];
  const isConsolidated = view !== 'trips';
  const isDelivery = view === 'consolidated-delivery';
  const isReturns = view === 'consolidated-returns';
  const navigate = useNavigate();
  const { buyerId } = usePagePermissions('buyer_trips');
  // ngOnInit force-sets hasView = hasCreate = true, so the *ngIf="hasView" wrapper always renders.
  const hasView = true;

  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [stats, setStats] = useState<TripStats>(ZERO_STATS);
  const [tripsCount, setTripsCount] = useState(0);
  const [currentPage, _setCurrentPage] = useState(1);
  const [pageSize, _setPageSize] = useState(10);
  const [tempFilters, _setTempFilters] = useState<TempFilters>({ buyerId, logisticsOrderId: '', pickupDate: '', statuses: [], providerNames: [], pageSize: 10, pageNumber: 1 });
  const [providerNameOptions, setProviderNameOptions] = useState<string[]>([]);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filtersModalKey, setFiltersModalKey] = useState(0);
  const [isDarkStoreBuyer, setIsDarkStoreBuyer] = useState(false);

  const [selection, setSelection] = useState<{ ids: Set<string>; map: Map<string, TripRow> }>({ ids: new Set(), map: new Map() });
  const [expandedTripIndex, setExpandedTripIndex] = useState<number | null>(null);
  const [activeKebabMenu, setActiveKebabMenu] = useState<number | null>(null);
  const [kebabPos, setKebabPos] = useState({ top: 0, right: 0 });
  const [showDownloadSubmenu, setShowDownloadSubmenu] = useState(false);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, right: 0 });
  const [showSellerActionsMenu, setShowSellerActionsMenu] = useState(false);
  const [showPickupFormats, setShowPickupFormats] = useState(false);

  const [cancelModal, setCancelModal] = useState<{ show: boolean; logisticsOrderId: string; transactionId: string }>({ show: false, logisticsOrderId: '', transactionId: '' });
  const [mapTrip, setMapTrip] = useState<TripRow | null>(null);
  const [multiMapTrips, setMultiMapTrips] = useState<TripRow[] | null>(null);

  // Mutable component fields (Angular `this.*`) used by the async flows.
  const pageRef = useRef(1);
  const sizeRef = useRef(10);
  const filtersRef = useRef<TempFilters>(tempFilters);
  const statsRef = useRef<TripStats>(ZERO_STATS);
  const aliveRef = useRef(true);
  const setCurrentPage = (p: number) => {
    pageRef.current = p;
    _setCurrentPage(p);
  };
  const setPageSize = (s: number) => {
    sizeRef.current = s;
    _setPageSize(s);
  };
  const setTempFilters = (f: TempFilters) => {
    filtersRef.current = f;
    _setTempFilters(f);
  };
  // The saved `trips_filters` belong to the Direct Delivery tab; the consolidated tabs start unfiltered.
  const saveFilters = (f: TempFilters) => {
    if (!isConsolidated) filterPersistence.saveTripFilters(f);
  };
  const clearSavedFilters = () => {
    if (!isConsolidated) filterPersistence.clearTripFilters();
  };

  const resetData = () => {
    setTrips([]);
    statsRef.current = ZERO_STATS;
    setStats(ZERO_STATS);
    setTripsCount(0);
    setCurrentPage(1);
  };

  const loadTrips = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const f = filtersRef.current;
      const body = {
        buyerId,
        logisticsOrderId: '',
        pickupDate: f.pickupDate || '',
        statuses: f.statuses && f.statuses.length > 0 ? f.statuses : undefined,
        providerNames: f.providerNames && f.providerNames.length > 0 ? f.providerNames : undefined,
        pageSize: sizeRef.current,
        pageNumber: pageRef.current,
        channel: tab.channel,
      };
      const res = await svc.getLogisticOrdersDetails(body);
      if (!aliveRef.current) return;
      if (res) {
        setTrips(res.data);
        if (res.stats) {
          const s = {
            totalLogisticOrders: res.stats.totalLogisticOrders || 0,
            inTransit: res.stats.inTransit || 0,
            delivered: res.stats.delivered || 0,
            planned: res.stats.planned || 0,
          };
          statsRef.current = s;
          setStats(s);
        }
        if (res.pagination) {
          setTripsCount(res.pagination.totalCount);
          setPageSize(res.pagination.pageSize);
        }
        // Empty-page recovery. [deviation] guarded with currentPage > 1 so a filter matching nothing can't loop forever.
        if (res.data.length === 0 && statsRef.current.totalLogisticOrders > 0 && pageRef.current > 1) {
          setCurrentPage(1);
          await loadTrips();
        }
      } else {
        resetData();
      }
    } catch (e) {
      console.error('Error loading trips:', e);
      if (aliveRef.current) resetData();
    } finally {
      window.setTimeout(() => {
        if (aliveRef.current) setIsLoading(false);
      }, 300);
    }
  };

  // ------------------------------------------------------------ init (ngOnInit)
  useEffect(() => {
    aliveRef.current = true;
    // DARKSTORE detection (fire-and-forget). The dark-store seller actions are for 3PL trips (Direct Delivery).
    if (!isConsolidated) {
      buyerService
        .getBuyerById(buyerId)
        .then((data: any) => aliveRef.current && setIsDarkStoreBuyer((data?.buyerType ?? data?.buyer_type) === 'DARKSTORE'))
        .catch(() => aliveRef.current && setIsDarkStoreBuyer(false));
    }
    // Restore filters (pageNumber restored, pageSize forced back to 10 — as-built). Direct Delivery tab only.
    try {
      const saved = isConsolidated ? null : filterPersistence.getTripFilters();
      if (saved) {
        const raw = saved.statuses ?? saved.status;
        const statuses = Array.isArray(raw) ? raw : raw === 0 || raw === undefined || raw === null || raw === '' ? [] : [raw];
        setTempFilters({ ...saved, statuses, buyerId, pageSize: 10 });
        setCurrentPage(saved.pageNumber || 1);
      }
    } catch (e) {
      // As-built: corrupt JSON throws inside ngOnInit, so the list is never loaded.
      console.error('ERROR', e);
      setIsLoading(false);
      return () => {
        aliveRef.current = false;
      };
    }
    (async () => {
      await loadTrips();
      if (!aliveRef.current) return;
      const names = await svc.getProviderNames(buyerId, tab.channel);
      if (aliveRef.current) setProviderNameOptions(names || []);
    })();
    return () => {
      aliveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // host `document:click` → closeAllMenus()
  const closeAllMenus = () => {
    setActiveKebabMenu(null);
    setShowDownloadSubmenu(false);
    setShowSellerActionsMenu(false);
    setShowPickupFormats(false);
  };
  useEffect(() => {
    const onDoc = () => closeAllMenus();
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // ------------------------------------------------------------ filters
  const hasActiveFilters = () => tempFilters.statuses?.length > 0 || !!tempFilters.pickupDate || tempFilters.providerNames?.length > 0;
  const clearSelection = () => setSelection({ ids: new Set(), map: new Map() });

  const openFilters = () => {
    setFiltersModalKey((k) => k + 1); // new copy of tempFilters → unapplied edits are discarded
    setShowFiltersModal(true);
  };

  const applyFilters = (f: { statuses: number[]; pickupDate: string; providerNames: string[] }) => {
    const next: TempFilters = { ...f, buyerId, pageNumber: 1, pageSize: sizeRef.current };
    setTempFilters(next);
    saveFilters(next);
    setCurrentPage(1);
    clearSelection();
    setShowFiltersModal(false);
    loadTrips();
  };

  const clearFilters = () => {
    setTempFilters({ buyerId, logisticsOrderId: '', pickupDate: '', statuses: [], providerNames: [], pageSize: sizeRef.current, pageNumber: 1 });
    clearSavedFilters();
    setCurrentPage(1);
    clearSelection();
    loadTrips();
    setShowFiltersModal(false);
  };

  const applyChipRemoval = (next: TempFilters) => {
    setTempFilters(next);
    saveFilters(next);
    setCurrentPage(1);
    loadTrips();
  };
  const removeSingleStatus = (s: number) => applyChipRemoval({ ...filtersRef.current, statuses: filtersRef.current.statuses.filter((x) => x !== s) });
  const removeSingleProviderName = (n: string) => applyChipRemoval({ ...filtersRef.current, providerNames: filtersRef.current.providerNames.filter((x) => x !== n) });
  const removeDateFilter = () => applyChipRemoval({ ...filtersRef.current, pickupDate: '' });

  const onPage = (e: { pageIndex: number; pageSize: number }) => {
    setPageSize(e.pageSize);
    setCurrentPage(e.pageIndex + 1);
    const next = { ...filtersRef.current, pageNumber: e.pageIndex + 1, pageSize: e.pageSize };
    setTempFilters(next);
    saveFilters(next);
    loadTrips();
  };

  // ------------------------------------------------------------ selection
  const toggleTripSelection = (row: TripRow) =>
    setSelection((prev) => {
      const ids = new Set(prev.ids);
      const map = new Map(prev.map);
      if (ids.has(row.id)) {
        ids.delete(row.id);
        map.delete(row.id);
      } else {
        ids.add(row.id);
        map.set(row.id, row);
      }
      return { ids, map };
    });
  const isAllSelected = trips.length > 0 && trips.every((t) => selection.ids.has(t.id));
  const toggleSelectAll = () =>
    setSelection((prev) => {
      const ids = new Set(prev.ids);
      const map = new Map(prev.map);
      const all = trips.length > 0 && trips.every((t) => ids.has(t.id));
      trips.forEach((t) => {
        if (all) {
          ids.delete(t.id);
          map.delete(t.id);
        } else {
          ids.add(t.id);
          map.set(t.id, t);
        }
      });
      return { ids, map };
    });
  const selectedCount = selection.ids.size;
  const selectedRows = Array.from(selection.map.values());
  const allSelectedTripsPlanned = selectedRows.length > 0 && selectedRows.every((t) => t.logisticsOrderStatus === 'Planned');

  // ------------------------------------------------------------ menus
  const toggleKebabMenu = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (activeKebabMenu === index) {
      setActiveKebabMenu(null);
      setShowDownloadSubmenu(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const top = window.innerHeight - rect.bottom < KEBAB_MENU_HEIGHT ? Math.max(0, rect.top - KEBAB_MENU_HEIGHT - 4) : rect.bottom + 4;
    setKebabPos({ top, right: window.innerWidth - rect.right });
    setActiveKebabMenu(index);
    setShowDownloadSubmenu(false);
  };

  const toggleDownloadSubmenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (showDownloadSubmenu) {
      setShowDownloadSubmenu(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const top = rect.top + SUBMENU_HEIGHT <= window.innerHeight ? rect.top : Math.max(0, rect.bottom - SUBMENU_HEIGHT);
    setSubmenuPos({ top, right: kebabPos.right + KEBAB_WIDTH + 8 });
    setShowDownloadSubmenu(true);
  };

  // ------------------------------------------------------------ actions
  const toggleTripDetails = (index: number) => setExpandedTripIndex(expandedTripIndex === index ? null : index);
  const toggleShowAllLocations = (index: number) => setTrips((prev) => prev.map((t, i) => (i === index ? { ...t, showAllLocations: !t.showAllLocations } : t)));

  const openCancelTripModal = (logisticsOrderId: string, transactionId: string) => setCancelModal({ show: true, logisticsOrderId, transactionId });
  const closeCancelTripModal = () => setCancelModal((m) => ({ ...m, show: false }));

  const confirmCancelTrip = async () => {
    setIsLoading(true);
    const res = await svc.cancelTrip({ transactionId: cancelModal.transactionId, orderId: cancelModal.logisticsOrderId, reason: 152 });
    if (res && res.success === true) {
      closeCancelTripModal();
      setIsLoading(false);
      const r = await Swal.fire({ title: 'Trip has been cancelled successfully', icon: 'success', allowOutsideClick: false });
      if (r.isConfirmed) {
        setIsLoading(true);
        loadTrips();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      Swal.fire('Failed to cancel trip', 'error');
    }
  };

  const downloadPickupIndent = async (row: TripRow, isBeatwise: boolean) => {
    try {
      await svc.downloadPickupIndent(row.logisticsOrderId, isBeatwise);
      Swal.fire(isBeatwise ? 'Beat wise pickup list downloaded successfully' : 'Consolidate pickup list downloaded successfully');
    } catch {
      Swal.fire('Error downloading pickup list', 'error');
    }
  };
  const downloadSplitPickupList = async (row: TripRow) => {
    try {
      await svc.downloadSplitPickupList(row.logisticsOrderId);
      Swal.fire('Pickup list downloaded successfully');
    } catch {
      Swal.fire('Error downloading pickup list', 'error');
    }
  };
  const downloadConsolidatedLoadingSheet = async (row: TripRow) => {
    try {
      await svc.downloadConsolidatedLoadingSheet(row.logisticsOrderId);
      Swal.fire('Consolidated loading sheet downloaded successfully');
    } catch {
      Swal.fire('Error downloading consolidated loading sheet', 'error');
    }
  };
  const downloadCustomerWisePickupIndent = async (row: TripRow) => {
    try {
      await svc.downloadCustomerWisePickupIndent(row.id);
      Swal.fire('Customer wise pickup list downloaded successfully', 'success');
    } catch {
      Swal.fire('Error downloading pickup list', 'error');
    }
  };
  const downloadCdsWisePickupList = async (row: TripRow) => {
    try {
      await svc.downloadCdsWisePickupList(row.logisticsOrderId);
      Swal.fire('CDS wise pickup list downloaded successfully', 'success');
    } catch {
      Swal.fire('Error downloading pickup list', 'error');
    }
  };
  const downloadReturnReport = async (row: TripRow) => {
    try {
      await svc.downloadReturnReport(row.id, row.logisticsOrderId);
      Swal.fire('Return report downloaded successfully', 'success');
    } catch {
      Swal.fire('Error downloading return report', 'error');
    }
  };

  const downloadSellerPickupList = (format: 'excel' | 'pdf') => {
    setShowSellerActionsMenu(false);
    setShowPickupFormats(false);
    svc.downloadSellerPickupList(Array.from(selection.map.values()).map((t) => t.logisticsOrderId), format);
  };
  const downloadSellerWiseOrders = () => {
    setShowSellerActionsMenu(false);
    setShowPickupFormats(false);
    svc.downloadSellerWiseOrders(Array.from(selection.map.values()).map((t) => t.logisticsOrderId));
  };

  const trackOnMap = (row: TripRow) => setMapTrip(row);
  const openMultiTripMapView = () => setMultiMapTrips(Array.from(selection.map.values()));

  if (!hasView) return null;

  const kebabRow = activeKebabMenu !== null ? trips[activeKebabMenu] : undefined;

  // ------------------------------------------------------------ render helpers
  const renderDetails = (row: TripRow, index: number) => {
    const os = getOrderSummary(row);
    const locs = row.deliveryProgress.locations;
    const visible = row.showAllLocations ? locs : locs.slice(0, 3);
    const seg = (n: number) => `max(2px, ${(n / os.total) * 100}%)`;
    const routeRows: [string, string, string][] = [
      ['directions_car', 'Vehicle', row.vehicle || 'Not Assigned'],
      ['person', 'Driver Name', row.driver || 'Not Assigned'],
      ['phone', 'Contact Number', row.driverContactNumber || 'Not Available'],
      ['person_outline', 'Helper', row.helper || 'Not Assigned'],
      ['play_circle_outline', 'Start Time', row.startTime],
      ['access_time', 'Estimated Completion', calculateEstimatedCompletion(row)],
      ['vpn_key', 'Pickup OTP', row.pickupOTP || 'Not Available'],
      ['vpn_key', 'Return OTP', row.returnOTP || 'N/A'],
    ];
    // A Consolidated Delivery trip carries no returns (no Return OTP); a Consolidated Returns trip has no pickup
    // from the distributor (no Pickup OTP).
    const routeOverview = routeRows.filter(([, label]) => !(isDelivery && label === 'Return OTP') && !(isReturns && label === 'Pickup OTP'));
    const collectionSummary = (
      <div className="info-card collection-card">
        <div className="info-row no-icon"><span className="label">Total Sale Value</span><span className="value">{addCurrency(row.totalSaleValue)}</span></div>
        <div className="info-row no-icon dashed"><span className="label">Total Delivered Value</span><span className="value">{addCurrency(row.totalDeliveryValue)}</span></div>
        <div className="info-row no-icon"><span className="label">Total Partial Value</span><span className="value">{addCurrency(row.totalPartialValue)}</span></div>
        <div className="info-row no-icon"><span className="label">Total Return Value</span><span className="value">{addCurrency(row.totalReturnValue)}</span></div>
        <div className="info-row"><i className="material-icons">location_on</i><span className="label">Total Delivery Points</span><span className="value">{row.dropPoints || '0'}</span></div>
        <div className="info-row"><i className="material-icons">payments</i><span className="label">COD Collection</span><span className="value">{inrSymbol0(row.summary.codCollection)}</span></div>
        <div className="info-row"><i className="material-icons">smartphone</i><span className="label">Digital Collection</span><span className="value">{inrSymbol0(row.summary.digitalCollection)}</span></div>
        <div className="info-row"><i className="material-icons">account_balance_wallet</i><span className="label">Net Sale Collection</span><span className="value">{inrSymbol0(row.summary.netSaleCollection)}</span></div>
      </div>
    );
    return (
      <tr className="trip-details-row">
        <td colSpan={isConsolidated ? 11 : 14}>
          <div className="trip-details">
            {/* Direct Delivery: every card. Consolidated Delivery: Route Overview only. Consolidated Returns: Route
                Overview and Collection Summary (the return value). */}
            <div className={`details-container${isConsolidated ? ' compact' : ''}`}>
              <div className="detail-card route-overview">
                <h3>Route Overview</h3>
                <div className="info-card">
                  {routeOverview.map(([icon, label, value]) => (
                    <div className="info-row" key={label}>
                      <i className="material-icons">{icon}</i>
                      <span className="label">{label}</span>
                      <span className="value" title={value}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!isConsolidated && (
                <div className="detail-card trip-summary">
                  <h3>Order Summary</h3>
                  <div className="order-summary-grid">
                    {([
                      ['total', 'receipt_long', 'Total', os.total],
                      ['delivered', 'check_circle', 'Delivered', os.delivered],
                      ['partial', 'rule', 'Partial', os.partialDelivered],
                      ['returned', 'undo', 'Return', os.returned],
                      ['pending', 'schedule', 'Pending', os.pending],
                    ] as [string, string, string, number][]).map(([cls, icon, label, value]) => (
                      <div className={`os-item ${cls}`} key={cls}>
                        <div className="os-icon"><i className="material-icons">{icon}</i></div>
                        <div className="os-count">{value}</div>
                        <div className="os-label">{label}</div>
                      </div>
                    ))}
                  </div>
                  {os.total > 0 && (
                    <div className="os-progress">
                      <div className="seg delivered" style={{ width: seg(os.delivered) }} title={`Delivered: ${os.delivered}`} />
                      <div className="seg partial" style={{ width: seg(os.partialDelivered) }} title={`Partial: ${os.partialDelivered}`} />
                      <div className="seg returned" style={{ width: seg(os.returned) }} title={`Return: ${os.returned}`} />
                      <div className="seg pending" style={{ width: seg(os.pending) }} title={`Pending: ${os.pending}`} />
                    </div>
                  )}

                  <h3 className="collection-title">Collection Summary</h3>
                  {collectionSummary}
                </div>
              )}

              {isReturns && (
                <div className="detail-card trip-summary">
                  <h3>Collection Summary</h3>
                  {collectionSummary}
                </div>
              )}

              {!isConsolidated && (
                <div className="detail-card delivery-route">
                  <h3>Delivery Route</h3>
                  <div className="delivery-stops">
                    {visible.map((loc, i) => {
                      const isLastCollapsed = !row.showAllLocations && i === visible.length - 1;
                      return (
                        <div className={`delivery-stop${i === 0 ? ' first-stop' : ''}${isLastCollapsed ? ' last-visible-stop' : ''}`} key={loc.fulfillmentId || i}>
                          {i > 0 && <div className="connector" />}
                          {i === 0 ? (
                            <div className="stop-icon"><i className="material-icons">store</i></div>
                          ) : (
                            <div className="stop-number">{i}</div>
                          )}
                          <div className="stop-details">
                            <div className="stop-info">
                              <div className="stop-name">{loc.name || 'Unnamed Location'}</div>
                              <div className="stop-address">{loc.address || 'Address not available'}</div>
                              <div className="stop-time">{loc.time ? loc.time : 'Time not available'}</div>
                              <div className="stop-otp">
                                <span className="otp-label">OTP:</span>
                                <span className="otp-badge">{loc.otp || 'N/A'}</span>
                              </div>
                            </div>
                            {loc.status && (
                              <div className="stop-status">
                                <span className={`status-pill ${statusClass(loc.status)}`}>{loc.status}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {row.dropPoints && locs.length > 3 && (
                      <div className="show-more-container">
                        <button
                          className="show-more-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShowAllLocations(index);
                          }}
                        >
                          <i className="material-icons">{row.showAllLocations ? 'expand_less' : 'expand_more'}</i>
                          {row.showAllLocations ? 'Show Less' : 'Show More Stops'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="trips-container">
      <FiltersModal
        key={filtersModalKey}
        show={showFiltersModal}
        filters={{ ...tempFilters }}
        showStatusFilter
        showSLAFilter
        showDateFilter
        title="Trip Filters"
        statusType="trip"
        providerNameOptions={providerNameOptions}
        onClose={() => setShowFiltersModal(false)}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <div className="page-header">
        <div className="header-content">
          <div className="header-icon"><i className="material-icons">local_shipping</i></div>
          <div>
            <h1>Trips</h1>
            <p className="header-description">{tab.description}</p>
          </div>
        </div>
        <div className="actions">
          {/* The consolidated tabs have no map view. */}
          {!isConsolidated && (
            <Tooltip
              title={selectedCount === 0 ? 'Select one or more trips to view on map' : ''}
              placement="bottom"
              componentsProps={{ tooltip: { className: 'map-view-tooltip' } }}
            >
              <span>
                <button className="filter-btn map-view-btn" disabled={selectedCount === 0} onClick={openMultiTripMapView}>
                  <i className="material-icons">map</i> Map View{selectedCount > 0 ? ` (${selectedCount})` : ''}
                </button>
              </span>
            </Tooltip>
          )}
          <button className="filter-btn" onClick={openFilters}>
            <i className="material-icons">filter_list</i> Filter
          </button>
        </div>
      </div>

      <nav className="trip-type-tabs" aria-label="Trip type">
        {TRIP_TABS.map((t) => (
          <NavLink key={t.view} to={t.to} end className={({ isActive }) => `trip-type-tab${isActive ? ' active' : ''}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="stats-grid">
        {([
          ['Total Trips', stats.totalLogisticOrders, 'All Time', 'Logistics Network', 'fas fa-truck-loading', 'trips'],
          ['In Progress', stats.inTransit, 'Active Trips', 'On the road', 'fas fa-route', 'delivery'],
          ['Completed', stats.delivered, 'Completed Trips', 'Successfully delivered', 'fas fa-check-circle', 'customers'],
          ['Planned', stats.planned, 'Upcoming Trips', 'Scheduled for delivery', 'fas fa-calendar-alt', 'orders'],
        ] as [string, number, string, string, string, string][]).map(([title, value, sub, line, icon, cls]) => (
          <div className="stat-card" key={title}>
            <div className="stat-content">
              <div className="stat-title">{title}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-subtitle">{sub}</div>
              <div className="stat-line">{line}</div>
            </div>
            <div className={`stat-icon ${cls}`}><i className={icon} /></div>
            <div className="trend-indicator" />
          </div>
        ))}
      </div>

      {hasActiveFilters() && (
        <div className="applied-filters-bar">
          <span className="applied-label">Applied filters:</span>
          {tempFilters.statuses?.length > 0 && (
            <span className="filter-chip">
              <strong>Status:</strong>
              {tempFilters.statuses.map((s, i) => (
                <span className="chip-tag" key={s}>
                  {getTripStatusLabel(Number(s))}
                  <i className="fas fa-times tag-remove" onClick={() => removeSingleStatus(s)} />
                  {i < tempFilters.statuses.length - 1 && <span className="tag-sep">,</span>}
                </span>
              ))}
            </span>
          )}
          {tempFilters.providerNames?.length > 0 && (
            <span className="filter-chip">
              <strong>Provider:</strong>
              {tempFilters.providerNames.map((n, i) => (
                <span className="chip-tag" key={n}>
                  {n}
                  <i className="fas fa-times tag-remove" onClick={() => removeSingleProviderName(n)} />
                  {i < tempFilters.providerNames.length - 1 && <span className="tag-sep">,</span>}
                </span>
              ))}
            </span>
          )}
          {tempFilters.pickupDate && (
            <span className="filter-chip">
              {pickupChipLabel(tempFilters.pickupDate)}
              <button className="chip-remove" onClick={removeDateFilter}><i className="fas fa-times" /></button>
            </span>
          )}
          <button className="clear-all-btn" onClick={clearFilters}>Clear all</button>
        </div>
      )}

      {isDarkStoreBuyer && selectedCount > 0 && (
        <div className="seller-actions-bar">
          <span className="selected-count">{selectedCount} selected</span>
          <div className="seller-actions-wrapper" onClick={(e) => e.stopPropagation()}>
            <button
              className="seller-actions-btn"
              disabled={!allSelectedTripsPlanned}
              title={!allSelectedTripsPlanned ? 'Only trips in Planned state can be actioned' : ''}
              onClick={() => setShowSellerActionsMenu(!showSellerActionsMenu)}
            >
              {' Actions '}
              <i className="material-icons">{showSellerActionsMenu ? 'expand_less' : 'expand_more'}</i>
            </button>
            {showSellerActionsMenu && allSelectedTripsPlanned && (
              <div className="seller-actions-menu">
                <div className="menu-title">{selectedCount} {selectedCount === 1 ? 'trip' : 'trips'} selected</div>
                <div className="menu-item" onClick={() => setShowPickupFormats(!showPickupFormats)}>
                  <i className="material-icons">assignment</i>
                  <span>Seller Wise Pickup List</span>
                  <i className="material-icons caret">{showPickupFormats ? 'expand_less' : 'expand_more'}</i>
                </div>
                {showPickupFormats && (
                  <>
                    <div className="menu-item sub-item" onClick={() => downloadSellerPickupList('excel')}>
                      <i className="material-icons">grid_on</i>
                      <span>Excel (.xlsx)</span>
                    </div>
                    <div className="menu-item sub-item" onClick={() => downloadSellerPickupList('pdf')}>
                      <i className="material-icons">picture_as_pdf</i>
                      <span>PDF (.pdf)</span>
                    </div>
                  </>
                )}
                <div className="menu-item" onClick={downloadSellerWiseOrders}>
                  <i className="material-icons">request_quote</i>
                  <span>Seller Wise Orders List</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="trips-table-container">
        {isLoading && <DataLoading overlay={false} message="Loading trips..." showTip />}
        {!isLoading && trips.length > 0 && (
          <table className="trips-table">
            <thead>
              <tr>
                <th className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className="expand-cell" />
                <th>Trip Number</th>
                <th>Provider</th>
                <th>Status</th>
                {/* Consolidated trips: the distributor only hands the goods over (delivery) or receives the returns
                    (returns), so the service center's route columns (drop points, planned KMs, time covered) are not shown. */}
                {!isConsolidated && <th>Drop Points</th>}
                <th>Vol Weight</th>
                <th>Driver Name</th>
                {!isConsolidated && <th>Planned Kms</th>}
                <th>Created Date</th>
                <th>Arrival Time</th>
                {!isConsolidated && <th>Time Covered</th>}
                <th>Trip Charges</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((row, index) => {
                const expanded = expandedTripIndex === index;
                return (
                  <Fragment key={row.id + '-' + index}>
                    <tr className={`trip-row${expanded ? ' expanded' : ''}`}>
                      <td className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selection.ids.has(row.id)} onChange={() => toggleTripSelection(row)} />
                      </td>
                      <td className="expand-cell" onClick={() => toggleTripDetails(index)}>
                        <i className={`material-icons expand-icon${expanded ? ' rotated' : ''}`}>chevron_right</i>
                      </td>
                      <td className="trip-number">{row.logisticsOrderId}</td>
                      <td>{row.providerName}</td>
                      <td>
                        {/* +"Planned" is NaN → every badge gets the light-blue "planned" style (as-built) */}
                        <span className={`status-badge ${getTripStatusClass(+row.logisticsOrderStatus)}`}>{row.logisticsOrderStatus}</span>
                      </td>
                      {!isConsolidated && <td>{`${row.dropPoints || 'N/A'} / ${row.maxStopCount || 'N/A'}`}</td>}
                      {/* Consolidated trips: the weight only (the vehicle capacity is the service center's). On a
                          Consolidated Returns trip the weight is that of the returned goods (see the mock trips route). */}
                      <td>{isConsolidated ? `${row.volumetricWeight || 'N/A'}` : `${row.volumetricWeight || 'N/A'} / ${row.vehicleVolumetricCapacityKg || 'N/A'}`}</td>
                      <td>{row.driver || 'N/A'}</td>
                      {!isConsolidated && <td>{row.totalDistance || 'N/A'}</td>}
                      <td>{row.createdDate}</td>
                      <td>{row.arrivalTime || 'N/A'}</td>
                      {!isConsolidated && <td>{calculateTimeCovered(row)}</td>}
                      <td>{addCurrency(row.logisticsOrderCharges)}</td>
                      <td>
                        <button className="kebab-btn" title="Actions" onClick={(e) => toggleKebabMenu(index, e)}>
                          <i className="material-icons">more_vert</i>
                        </button>
                      </td>
                    </tr>
                    {expanded && renderDetails(row, index)}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {!isLoading && trips.length === 0 && (
          <div className="no-trips-message">
            <i className="fas fa-inbox" />
            <p>{tab.empty}</p>
          </div>
        )}
        {!isLoading && trips.length > 0 && (
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-1 bg-white mt-2 trips-paginator">
            <div className="text-muted small" />
            <div className="bg-transparent shadow-none paginator-wrap" aria-label="Select page of trips">
              <Paginator length={tripsCount} pageIndex={currentPage - 1} pageSize={pageSize} pageSizeOptions={[5, 10, 25, 50]} onPage={onPage} />
            </div>
          </div>
        )}
      </div>

      {/* Kebab dropdown (position:fixed, does not follow page scroll) */}
      {kebabRow && (
        <div className="kebab-dropdown" style={{ top: kebabPos.top, right: kebabPos.right }} onClick={(e) => e.stopPropagation()}>
          {/* Consolidated trips belong to the CDS service center, so the distributor cannot cancel them. */}
          {kebabRow.showCancelBtn && !isConsolidated && (
            <div
              className="kebab-item"
              onClick={() => {
                openCancelTripModal(kebabRow.id, kebabRow.transactionId);
                closeAllMenus();
              }}
            >
              <i className="material-icons" style={{ color: '#ef4444' }}>cancel</i>
              <span>Cancel</span>
            </div>
          )}
          {!isConsolidated && (
            <div
              className={`kebab-item${kebabRow.logisticsOrderStatus === 'Cancelled' ? ' disabled' : ''}`}
              onClick={() => {
                if (kebabRow.logisticsOrderStatus !== 'Cancelled') trackOnMap(kebabRow);
                closeAllMenus();
              }}
            >
              <i className="material-icons" style={{ color: '#3b82f6' }}>place</i>
              <span>Map view</span>
            </div>
          )}
          <div
            className="kebab-item"
            onClick={() => {
              closeAllMenus();
              navigate(isConsolidated ? `/trip-details/${kebabRow.id}?from=${view}` : `/trip-details/${kebabRow.id}`);
            }}
          >
            <i className="material-icons" style={{ color: '#3b82f6' }}>visibility</i>
            <span>View details</span>
          </div>
          <div className="kebab-item" onClick={toggleDownloadSubmenu}>
            <i className="material-icons" style={{ color: '#22c55e' }}>download</i>
            <span>Download</span>
            <i className={`material-icons submenu-chevron${showDownloadSubmenu ? ' open' : ''}`}>expand_more</i>
          </div>
        </div>
      )}
      {kebabRow && showDownloadSubmenu && (
        <div className="download-submenu" style={{ top: submenuPos.top, right: submenuPos.right }} onClick={(e) => e.stopPropagation()}>
          {isReturns ? (
            // Consolidated Returns: the returns as the Excel Return Report.
            <div className="submenu-item" onClick={() => { downloadReturnReport(kebabRow); closeAllMenus(); }}>
              <i className="fas fa-file-alt" /><span>Return Report</span>
            </div>
          ) : isDelivery ? (
            // Consolidated Delivery: the three pickup lists the CDS service center needs.
            <>
              <div className="submenu-item" onClick={() => { downloadPickupIndent(kebabRow, false); closeAllMenus(); }}>
                <i className="fas fa-file-alt" /><span>Consolidated Pickup List</span>
              </div>
              <div className="submenu-item" onClick={() => { downloadCdsWisePickupList(kebabRow); closeAllMenus(); }}>
                <i className="fas fa-file-alt" /><span>CDS Wise Pickup List</span>
              </div>
              <div className="submenu-item" onClick={() => { downloadCustomerWisePickupIndent(kebabRow); closeAllMenus(); }}>
                <i className="fas fa-file-alt" /><span>Customer Wise Pickup List</span>
              </div>
            </>
          ) : (
            <>
              <div className="submenu-item" onClick={() => { downloadPickupIndent(kebabRow, false); closeAllMenus(); }}>
                <i className="fas fa-file-alt" /><span>Consolidated Pickup List</span>
              </div>
              <div className="submenu-item" onClick={() => { downloadSplitPickupList(kebabRow); closeAllMenus(); }}>
                <i className="fas fa-file-alt" /><span>PickUp List</span>
              </div>
              <div className="submenu-item" onClick={() => { downloadConsolidatedLoadingSheet(kebabRow); closeAllMenus(); }}>
                <i className="fas fa-file-alt" /><span>Consolidated Loading Sheet</span>
              </div>
              <div className="submenu-item" onClick={() => { downloadPickupIndent(kebabRow, true); closeAllMenus(); }}>
                <i className="fas fa-file-alt" /><span>Beatwise Loading Sheet</span>
              </div>
              <div className="submenu-item" onClick={() => { downloadCustomerWisePickupIndent(kebabRow); closeAllMenus(); }}>
                <i className="fas fa-file-alt" /><span>Customer Wise Pickup List</span>
              </div>
              {hasReturnProducts(kebabRow) && (
                <div className="submenu-item" onClick={() => { downloadReturnReport(kebabRow); closeAllMenus(); }}>
                  <i className="fas fa-file-alt" /><span>Return Report</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {cancelModal.show && (
        <div className="trips-modal-overlay" onClick={closeCancelTripModal}>
          <div className="cancel-trip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ctm-header">
              <div className="ctm-title">
                <i className="fas fa-exclamation-triangle" />
                <h3>Cancel Trip</h3>
              </div>
              <button className="ctm-close" onClick={closeCancelTripModal}><i className="fas fa-times" /></button>
            </div>
            <div className="ctm-body">
              <p>Are you sure you want to cancel this trip? This action cannot be undone.</p>
            </div>
            <div className="ctm-footer">
              <button className="btn cancel-btn" onClick={closeCancelTripModal}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmCancelTrip}>Confirm Cancellation</button>
            </div>
          </div>
        </div>
      )}

      {mapTrip && <TripMapModal trip={mapTrip} onClose={() => setMapTrip(null)} />}
      {multiMapTrips && <MultiTripMapModal trips={multiMapTrips} onClose={() => setMultiMapTrips(null)} />}
    </div>
  );
}
