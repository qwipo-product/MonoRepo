import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import dayjs, { type Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { usePagePermissions } from '../hooks/usePagePermissions';
import { getOrderStatusLabel, getTripStatusLabel, toYMD } from '../utils/helpers';
import './FiltersModal.css';

export interface OrderFilters {
  statusId: number[] | number | string | '';
  startDate: string;
  endDate: string;
  buyerId: string[];
  customerName: string[];
  customerMobile: string[];
  [k: string]: any;
}
export interface TripFilters {
  statuses: number[];
  pickupDate: string;
  providerNames: string[];
}

interface Props {
  show: boolean;
  filters?: Record<string, any>;
  showStatusFilter?: boolean;
  /** Unused in the original as well. */
  showSLAFilter?: boolean;
  showDateFilter?: boolean;
  title?: string;
  statusType?: 'order' | 'trip';
  providerNameOptions?: string[];
  onClose: () => void;
  onApply: (f: any) => void;
  onClear: () => void;
}

const ORDER_STATUS_OPTIONS = [9, 1, 2, 3, 4, 5, 6, 8, 10, 11, 12];
const TRIP_STATUS_OPTIONS = [1, 2, 3, 4];

/** Port of <app-filters-modal> (spec 00 §14.3): order mode (dates + single status) and trip mode (pickup date + multi-selects). */
export default function FiltersModal({
  show, filters = {}, showStatusFilter = true, showDateFilter = true, title = 'Filters', statusType = 'order', providerNameOptions = [],
  onClose, onApply, onClear,
}: Props) {
  const { buyerId } = usePagePermissions('buyer_dashboard');
  const today = useMemo(() => dayjs().endOf('day'), []);
  const defaultsOrder = (): OrderFilters => ({ statusId: [], startDate: '', endDate: '', buyerId: [buyerId], customerName: [], customerMobile: [] });
  const [orderF, setOrderF] = useState<OrderFilters>(() => ({ ...defaultsOrder(), ...filters }));
  const [tripF, setTripF] = useState<TripFilters>({ statuses: [], pickupDate: '', providerNames: [] });
  const [openDrop, setOpenDrop] = useState<'' | 'status' | 'provider'>('');
  const dropRef = useRef<HTMLDivElement>(null);

  // Rebuild temp state whenever the seed `filters` change (ngOnChanges).
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    if (statusType === 'order') setOrderF({ ...defaultsOrder(), ...filters });
    else {
      const s = filters.statuses ?? filters.status ?? [];
      const statuses = Array.isArray(s) ? [...s] : s === 0 ? [] : [s];
      setTripF({ statuses, pickupDate: filters.pickupDate || '', providerNames: Array.isArray(filters.providerNames) ? [...filters.providerNames] : [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, statusType, buyerId]);

  useEffect(() => {
    if (show && statusType === 'trip') setOpenDrop('');
  }, [show, statusType]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.multi-select-dropdown')) setOpenDrop('');
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  if (!show) return null;

  const close = () => {
    setOpenDrop('');
    onClose();
  };

  const apply = () => {
    if (statusType === 'order') {
      const f = { ...orderF };
      f.startDate = f.startDate ? toYMD(f.startDate) : '';
      f.endDate = f.endDate ? toYMD(f.endDate) : '';
      if (f.startDate && f.endDate && f.endDate < f.startDate) {
        Swal.fire({ icon: 'warning', text: 'End date cannot be less than start date', showConfirmButton: true, confirmButtonText: 'OK' });
        return;
      }
      if (f.startDate && !f.endDate) f.endDate = f.startDate;
      if (f.endDate && !f.startDate) f.startDate = f.endDate;
      let s: any = f.statusId;
      if (!s && s !== 0) s = [];
      else if (!Array.isArray(s)) s = [s];
      f.statusId = (s as any[]).map(Number).filter((x) => x !== 0);
      onApply(f);
    } else {
      onApply({ statuses: tripF.statuses.map(Number), pickupDate: tripF.pickupDate ? toYMD(tripF.pickupDate) : '', providerNames: [...tripF.providerNames] });
    }
    onClose();
  };

  const clear = () => {
    if (statusType === 'order') setOrderF(defaultsOrder());
    else setTripF({ statuses: [], pickupDate: '', providerNames: [] });
    onClear();
    onClose();
  };

  const statusSelectValue = (() => {
    const s: any = orderF.statusId;
    if (Array.isArray(s)) return s.length === 1 ? String(s[0]) : s.length === 0 ? '' : '__multi__';
    return s === '' || s == null ? '' : String(s);
  })();

  const toggleIn = (key: 'statuses' | 'providerNames', v: any) =>
    setTripF((p) => {
      const arr = p[key] as any[];
      return { ...p, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  const multi = (key: 'statuses' | 'providerNames', kind: 'status' | 'provider', options: { value: any; label: string }[], placeholder: string) => {
    const selected = tripF[key] as any[];
    const labelOf = (v: any) => options.find((o) => o.value === v)?.label ?? String(v);
    return (
      <div className={`multi-select-dropdown ${kind}-dropdown`} ref={dropRef}>
        <div className="multi-select-trigger" onClick={(e) => { e.stopPropagation(); setOpenDrop(openDrop === kind ? '' : kind); }}>
          {selected.length === 0 ? (
            <span className="placeholder-text">{placeholder}</span>
          ) : (
            <span className="chips">
              {selected.slice(0, 2).map((v) => (
                <span className="chip" key={String(v)}>
                  {labelOf(v)}
                  <i className="fas fa-times chip-close" onClick={(e) => { e.stopPropagation(); toggleIn(key, v); }} />
                </span>
              ))}
              {selected.length > 2 && <span className="more-badge">+{selected.length - 2}</span>}
            </span>
          )}
          <i className="fas fa-chevron-down arrow" />
        </div>
        {openDrop === kind && (
          <div className="multi-select-options" onClick={(e) => e.stopPropagation()}>
            {options.map((o) => (
              <label className="option" key={String(o.value)}>
                <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggleIn(key, o.value)} />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const dateField = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <DatePicker
      value={value ? dayjs(value) : null}
      onChange={(d: Dayjs | null) => onChange(d && d.isValid() ? d.format('YYYY-MM-DD') : '')}
      maxDate={today}
      format="M/D/YYYY"
      slotProps={{ textField: { size: 'small', placeholder, fullWidth: true, inputProps: { readOnly: true, placeholder } } }}
    />
  );

  return (
    <div className="modal-overlay fm-overlay" onClick={close}>
      <div className="modal-content filters-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={close} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div className="filter-grid">
            {statusType === 'order' && showDateFilter && (
              <div className="filter-row">
                <div className="filter-col">
                  <label>Order Start Date</label>
                  {dateField(orderF.startDate, (v) => setOrderF((p) => ({ ...p, startDate: v })), 'Order Start Date')}
                </div>
                <div className="filter-col">
                  <label>Order End Date</label>
                  {dateField(orderF.endDate, (v) => setOrderF((p) => ({ ...p, endDate: v })), 'Order End Date')}
                </div>
              </div>
            )}
            {statusType === 'trip' && showDateFilter && (
              <div className="filter-row">
                <div className="filter-col">
                  <label>Pickup Date</label>
                  <input type="date" className="fm-input" value={tripF.pickupDate} onChange={(e) => setTripF((p) => ({ ...p, pickupDate: e.target.value }))} />
                </div>
                <div className="filter-col">
                  <label>Status</label>
                  {multi('statuses', 'status', TRIP_STATUS_OPTIONS.map((v) => ({ value: v, label: getTripStatusLabel(v) })), 'All Status')}
                </div>
              </div>
            )}
            {statusType === 'trip' && providerNameOptions.length > 0 && (
              <div className="filter-row">
                <div className="filter-col">
                  <label>Provider Name</label>
                  {multi('providerNames', 'provider', providerNameOptions.map((p) => ({ value: p, label: p })), 'All')}
                </div>
                <div className="filter-col" />
              </div>
            )}
            {statusType === 'order' && showStatusFilter && (
              <div className="filter-row">
                <div className="filter-col">
                  <label>Status</label>
                  <select className="fm-input" value={statusSelectValue} onChange={(e) => setOrderF((p) => ({ ...p, statusId: e.target.value === '' ? [] : e.target.value }))}>
                    <option value=""> All </option>
                    {statusSelectValue === '__multi__' && <option value="__multi__" hidden />}
                    {ORDER_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={String(s)}>{getOrderStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-col" />
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={clear}>Clear All</button>
          <button className="save-btn" onClick={apply}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
