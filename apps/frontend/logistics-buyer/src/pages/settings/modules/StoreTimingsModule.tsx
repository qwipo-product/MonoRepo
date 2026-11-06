// Shared module A — "Store Timings" (spec 07 §3), used by Profile and /settings/store.
// The original component state is mutable and partly shared by reference (buyerConfig.storeConfig === storeConfig), and
// several edge cases depend on exceptions thrown half-way through (missing storeConfig / weeklyHolidays). To keep that
// behaviour exact, the logic is ported as a controller object that mutates itself and asks React to re-render.
import { useState, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { buyerSettingsService } from '../../../api/services/buyerSettings.service';

interface Holiday {
  date: Date;
  description: string;
}
interface CalendarDay {
  number: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  date: Date;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad2 = (n: number | string) => String(n).padStart(2, '0');
const fmtMonthYear = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // date:'MMMM yyyy'
const fmtHoliday = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); // date:'MMM d, yyyy'

export class StoreTimingsController {
  update: () => void = () => {};

  buyerId = '';
  storeConfig: any = { openingTime: '', closingTime: '', isTemporarilyClosed: false, weeklyHolidays: [], specificClosureDates: [] };
  deliveryConfig: any = {
    otpVerificationEnabled: true,
    deliveryOtpEnabled: true,
    pickupOtpEnabled: true,
    returnOtpEnabled: true,
    supportedVehicleTypes: [],
    geoFenceContactNumber: 0,
  };
  buyerConfig: any = { storeConfig: this.storeConfig, deliveryConfig: this.deliveryConfig };
  hours = Array.from({ length: 24 }, (_, i) => i);
  minutes = [0, 15, 30, 45];
  /** number initially; a string once the user picks an option (Angular `[value]` binding). */
  selectedOpeningHour: number | string = 0;
  selectedOpeningMinute: number | string = 0;
  selectedClosingHour: number | string = 0;
  selectedClosingMinute: number | string = 0;
  weeklyHolidays: string[] = [];
  tempWeeklyHolidays: string[] = [];
  isShopClosed = false;
  holidays: Holiday[] = [];
  tempHolidays: Holiday[] = [];
  selectedHolidayDate = '';
  showDatepicker = false;
  calendarDate = new Date();
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: CalendarDay[] = [];
  isLoadingSettings = false;
  isSavingSettings = false;
  isSavingBusinessHours = false;
  isSavingHoliday = false;
  businessHoursError = '';
  holidayError = '';
  showBusinessHoursModal = false;
  showHolidaysModal = false;

  // ------------------------------------------------------------ load
  async loadStoreSettings() {
    this.isLoadingSettings = true; // never rendered
    try {
      const data = await buyerSettingsService.getBuyerSettings(this.buyerId);
      if (data?.buyer_config) {
        this.buyerConfig = data.buyer_config;
        this.storeConfig = data.buyer_config.storeConfig;
        this.deliveryConfig = data.buyer_config.deliveryConfig;
        this.updateUIFromConfig();
      }
    } catch (e) {
      console.error('Error loading store settings:', e);
    } finally {
      this.isLoadingSettings = false;
      this.update();
    }
  }

  /** Throws (as-built) when storeConfig / weeklyHolidays / specificClosureDates are missing. */
  updateUIFromConfig() {
    if (this.storeConfig.openingTime) {
      const [h, m] = String(this.storeConfig.openingTime).split(':');
      this.selectedOpeningHour = parseInt(h);
      this.selectedOpeningMinute = parseInt(m);
    }
    if (this.storeConfig.closingTime) {
      const [h, m] = String(this.storeConfig.closingTime).split(':');
      this.selectedClosingHour = parseInt(h);
      this.selectedClosingMinute = parseInt(m);
      console.log('Closing time:', this.selectedClosingHour, this.selectedClosingMinute);
    }
    this.isShopClosed = this.storeConfig.isTemporarilyClosed;
    this.weeklyHolidays = [...this.storeConfig.weeklyHolidays];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.holidays = (this.storeConfig.specificClosureDates as string[])
      .filter((s) => {
        const d = new Date(s);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      })
      .map((s) => ({ date: new Date(s), description: '' }));
    this.tempHolidays = [...this.holidays];
  }

  // ------------------------------------------------------------ persistence (§3.6)
  async saveStoreSettings() {
    if (!this.buyerId) return;
    try {
      this.isSavingSettings = true;
      const body = {
        buyerId: this.buyerId,
        adminConfig: { warehouseLocation: [], isPermissionsEnabled: false }, // always hard-coded (resets admin_config)
        buyerConfig: this.buyerConfig,
      };
      const result = await buyerSettingsService.saveBuyerSettings(body);
      void result; // assigned but ignored — success and failure look the same
    } finally {
      this.isSavingSettings = false;
    }
  }

  // ------------------------------------------------------------ business hours (§3.4)
  openBusinessHoursModal() {
    this.tempWeeklyHolidays = [...this.weeklyHolidays];
    this.showBusinessHoursModal = true;
    this.update();
  }

  closeBusinessHoursModal() {
    this.showBusinessHoursModal = false;
    this.businessHoursError = '';
    try {
      this.updateUIFromConfig(); // reverts the selects (throws when storeConfig is missing → console error, as-built)
      this.tempWeeklyHolidays = [...this.weeklyHolidays];
    } finally {
      this.update();
    }
  }

  toggleWeekend(day: string) {
    const i = this.tempWeeklyHolidays.indexOf(day);
    if (i > -1) this.tempWeeklyHolidays.splice(i, 1);
    else this.tempWeeklyHolidays.push(day);
    this.update();
  }

  validateBusinessHours(): boolean {
    this.businessHoursError = '';
    // NOTE: the selects hold strings after a pick; the spec documents numeric minute arithmetic, so values are coerced.
    const open = Number(this.selectedOpeningHour) * 60 + Number(this.selectedOpeningMinute);
    const close = Number(this.selectedClosingHour) * 60 + Number(this.selectedClosingMinute);
    if (open >= close) {
      this.businessHoursError = 'Opening time must be before closing time';
      return false;
    }
    if (close - open < 60) {
      this.businessHoursError = 'Business hours must be at least 1 hour';
      return false;
    }
    return true;
  }

  async saveBusinessHours() {
    if (!this.validateBusinessHours()) {
      this.update();
      return;
    }
    try {
      this.isSavingBusinessHours = true;
      this.update();
      this.storeConfig.openingTime = `${pad2(this.selectedOpeningHour)}:${pad2(this.selectedOpeningMinute)}`;
      this.storeConfig.closingTime = `${pad2(this.selectedClosingHour)}:${pad2(this.selectedClosingMinute)}`;
      this.storeConfig.isTemporarilyClosed = this.isShopClosed;
      this.storeConfig.weeklyHolidays = [...this.tempWeeklyHolidays];
      this.weeklyHolidays = [...this.tempWeeklyHolidays];
      this.buyerConfig.storeConfig = this.storeConfig;
      await this.saveStoreSettings();
      this.showBusinessHoursModal = false; // no success message
    } catch (e) {
      console.error('Error saving business hours:', e);
      this.businessHoursError = 'Failed to save business hours';
    } finally {
      this.isSavingBusinessHours = false;
      this.update();
    }
  }

  // ------------------------------------------------------------ non-operating days (§3.5)
  openHolidaysModal() {
    this.showHolidaysModal = true;
    this.update();
  }

  closeHolidaysModal() {
    this.showHolidaysModal = false;
    this.selectedHolidayDate = '';
    this.holidayError = '';
    this.tempHolidays = [...this.holidays];
    // showDatepicker is NOT reset (as-built: the picker can still be open on reopen)
    this.update();
  }

  toggleDatepickerInput() {
    this.showDatepicker = !this.showDatepicker;
    this.update();
  }

  generateCalendarDays() {
    const y = this.calendarDate.getFullYear();
    const m = this.calendarDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: CalendarDay[] = [];
    const cell = (date: Date, inMonth: boolean): CalendarDay => ({
      number: date.getDate(),
      inMonth,
      isToday: date.toDateString() === new Date().toDateString(),
      isSelected: false, // never true → `.selected` never appears (as-built)
      isPast: date < today,
      date,
    });
    const lead = firstDay.getDay();
    const prevLast = new Date(y, m, 0).getDate();
    for (let i = lead - 1; i >= 0; i--) days.push(cell(new Date(y, m - 1, prevLast - i), false));
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(cell(new Date(y, m, d), true));
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) days.push(cell(new Date(y, m + 1, d), false));
    this.calendarDays = days;
  }

  prevMonth() {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() - 1, 1);
    this.generateCalendarDays();
    this.update();
  }

  nextMonth() {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 1);
    this.generateCalendarDays();
    this.update();
  }

  selectDate(day: CalendarDay) {
    if (!day.inMonth || day.isPast) return;
    const d = day.date;
    this.selectedHolidayDate = `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
    this.generateCalendarDays();
    this.showDatepicker = false;
    this.update();
  }

  validateHolidayDate(d: Date): boolean {
    this.holidayError = '';
    if (isNaN(d.getTime())) {
      this.holidayError = 'Invalid date';
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) {
      this.holidayError = 'Cannot add past dates as holidays';
      return false;
    }
    if (this.holidays.some((h) => h.date.toDateString() === d.toDateString())) {
      this.holidayError = 'This date is already added as a holiday';
      return false;
    }
    return true;
  }

  /**
   * TZ quirk reproduced as-built: the new date is stored as `toISOString().split("T")[0]` of LOCAL midnight, which in
   * UTC+ time zones (IST) is the previous day — picking 14 Nov stores "…-11-13" (list shows Nov 14 until reload).
   */
  private closureDatesFromTemp() {
    return this.tempHolidays.map((h) => h.date.toISOString().split('T')[0]);
  }

  async addHoliday() {
    if (!this.selectedHolidayDate) {
      this.holidayError = 'Please select a date';
      this.update();
      return;
    }
    const d = new Date(this.selectedHolidayDate);
    if (!this.validateHolidayDate(d)) {
      this.update();
      return;
    }
    try {
      this.isSavingHoliday = true;
      this.tempHolidays.push({ date: d, description: 'Holiday' });
      this.update();
      this.storeConfig.specificClosureDates = this.closureDatesFromTemp();
      this.buyerConfig.storeConfig = this.storeConfig;
      await this.saveStoreSettings();
      this.holidays = [...this.tempHolidays];
      this.selectedHolidayDate = '';
      this.showDatepicker = false;
      this.generateCalendarDays();
      this.holidayError = '';
    } catch (e) {
      console.error('Error adding holiday:', e);
      this.holidayError = 'Failed to add holiday'; // the pushed entry stays visible (as-built)
    } finally {
      this.isSavingHoliday = false;
      this.update();
    }
  }

  async removeHoliday(index: number) {
    try {
      this.isSavingHoliday = true;
      this.tempHolidays.splice(index, 1);
      this.update();
      this.storeConfig.specificClosureDates = this.closureDatesFromTemp();
      this.buyerConfig.storeConfig = this.storeConfig;
      await this.saveStoreSettings();
      this.holidays = [...this.tempHolidays];
    } catch (e) {
      console.error('Error removing holiday:', e);
      this.holidayError = 'Failed to remove holiday';
    } finally {
      this.isSavingHoliday = false;
      this.update();
    }
  }
}

/** Creates the controller once per page instance and wires it to React re-renders. */
export function useStoreTimings(buyerId: string) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [c] = useState(() => {
    const controller = new StoreTimingsController();
    controller.buyerId = buyerId;
    return controller;
  });
  c.update = force;
  useEffect(() => {
    c.generateCalendarDays();
    c.loadStoreSettings();
    c.update();
    return () => {
      c.update = () => {};
    };
  }, []);
  return c;
}

/**
 * `<select [(ngModel)]>` with `[value]` options: a model value with no matching option renders a BLANK select
 * (e.g. closing minute 59 from "23:59"), unlike React which would fall back to the first option.
 */
function NgSelect({ value, options, onChange }: { value: number | string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const ref = useRef<HTMLSelectElement>(null);
  const v = String(value);
  const matches = options.some((o) => o.value === v);
  useLayoutEffect(() => {
    if (ref.current && !matches) ref.current.selectedIndex = -1;
  });
  return (
    <select ref={ref} value={v} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

interface ViewProps {
  c: StoreTimingsController;
  /** Profile: both Edit buttons use `.edit-btn`. Store: the Business Hours button has ONLY Bootstrap's `.btn` (as-built). */
  variant: 'profile' | 'store';
}

/** Summary cards (§3.3) + both modals (§3.4, §3.5). Rendered inside the page's `section.settings-section`. */
export function StoreTimingsView({ c, variant }: ViewProps) {
  const hourOptions = c.hours.map((h) => ({ value: String(h), label: pad2(h) }));
  const minuteOptions = c.minutes.map((m) => ({ value: String(m), label: pad2(m) }));

  return (
    <>
      <div className="settings-cards">
        <div className="settings-card">
          <div className="card-icon">
            <i className="far fa-clock" />
          </div>
          <div className="card-content">
            <h3>Business Hours</h3>
            <p>Configure your business operating hours and open days</p>
          </div>
          <button className={variant === 'profile' ? 'edit-btn' : 'btn'} onClick={() => c.openBusinessHoursModal()}>
            <i className="fas fa-edit" /> Edit
          </button>
        </div>
        <div className="settings-card">
          <div className="card-icon">
            <i className="fas fa-calendar-times" />
          </div>
          <div className="card-content">
            <h3>Non-Operating Days</h3>
            <p>Manage holidays and other non-operating days</p>
          </div>
          <button className="edit-btn" onClick={() => c.openHolidaysModal()}>
            <i className="fas fa-edit" /> Edit
          </button>
        </div>
      </div>

      {c.showBusinessHoursModal && (
        <div className="modal-overlay" onClick={() => c.closeBusinessHoursModal()}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <i className="far fa-clock" />
                <h3>Business Hours</h3>
              </div>
              <button className="close-btn" disabled={c.isSavingBusinessHours} onClick={() => c.closeBusinessHoursModal()}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-body">
              {c.businessHoursError && (
                <div className="error-message pb-11">
                  <i className="fas fa-exclamation-circle" /> {c.businessHoursError}{' '}
                </div>
              )}
              <div className="time-setting">
                <div className="time-label">
                  <i className="far fa-calendar" />
                  <span>Shop Opening Time</span>
                  <span className="required">*</span>
                </div>
                <div className="time-inputs">
                  <div className="time-select">
                    <NgSelect value={c.selectedOpeningHour} options={hourOptions} onChange={(v) => ((c.selectedOpeningHour = v), c.update())} />
                    <i className="fas fa-chevron-down" />
                  </div>
                  <span className="time-separator">:</span>
                  <div className="time-select">
                    <NgSelect value={c.selectedOpeningMinute} options={minuteOptions} onChange={(v) => ((c.selectedOpeningMinute = v), c.update())} />
                    <i className="fas fa-chevron-down" />
                  </div>
                </div>
              </div>
              <div className="time-setting">
                <div className="time-label">
                  <i className="far fa-calendar" />
                  <span>Shop Closing Time</span>
                  <span className="required">*</span>
                </div>
                <div className="time-inputs">
                  <div className="time-select">
                    <NgSelect value={c.selectedClosingHour} options={hourOptions} onChange={(v) => ((c.selectedClosingHour = v), c.update())} />
                    <i className="fas fa-chevron-down" />
                  </div>
                  <span className="time-separator">:</span>
                  <div className="time-select">
                    <NgSelect value={c.selectedClosingMinute} options={minuteOptions} onChange={(v) => ((c.selectedClosingMinute = v), c.update())} />
                    <i className="fas fa-chevron-down" />
                  </div>
                </div>
              </div>
              <div className="open-days">
                <div className="days-label">
                  <i className="far fa-calendar-alt" />
                  <span>Open Days</span>
                </div>
                <div className="days-grid">
                  {DAYS.map((day) => {
                    const closed = c.tempWeeklyHolidays.includes(day.toLowerCase());
                    return (
                      <div className="day-item" key={day}>
                        <label className={`day-checkbox${!closed ? ' selected' : ''}`}>
                          <input type="checkbox" checked={!closed} onChange={() => c.toggleWeekend(day.toLowerCase())} />
                          <i className="fas fa-check" />
                          <span>{day}</span>
                          {closed && <span className="status">Closed</span>}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn cancel-btn" disabled={c.isSavingBusinessHours} onClick={() => c.closeBusinessHoursModal()}>
                {' Cancel '}
              </button>
              <button className="btn save-btn" disabled={c.isSavingBusinessHours} onClick={() => c.saveBusinessHours()}>
                {c.isSavingBusinessHours && <i className="fas fa-spinner fa-spin" />}
                {c.isSavingBusinessHours ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {c.showHolidaysModal && (
        <div className="modal-overlay" onClick={() => c.closeHolidaysModal()}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <i className="fas fa-calendar-times" />
                <h3>Non-Operating Days</h3>
              </div>
              <button className="close-btn" disabled={c.isSavingHoliday} onClick={() => c.closeHolidaysModal()}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-body">
              {c.holidayError && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle" /> {c.holidayError}{' '}
                </div>
              )}
              <div className="add-holiday">
                <div className="holiday-date-picker">
                  <div className="date-input-container">
                    <input type="text" readOnly placeholder="Select a date" value={c.selectedHolidayDate} onClick={() => c.toggleDatepickerInput()} />
                    <i className="fas fa-calendar-alt" />
                  </div>
                  {c.showDatepicker && (
                    <div className="datepicker">
                      <div className="datepicker-header">
                        <button className="month-nav" onClick={() => c.prevMonth()}>
                          <i className="fas fa-chevron-left" />
                        </button>
                        <div className="current-month">{fmtMonthYear(c.calendarDate)}</div>
                        <button className="month-nav" onClick={() => c.nextMonth()}>
                          <i className="fas fa-chevron-right" />
                        </button>
                      </div>
                      <div className="weekdays">
                        {c.weekdays.map((w) => (
                          <div className="weekday" key={w}>
                            {w}
                          </div>
                        ))}
                      </div>
                      <div className="calendar-days">
                        {c.calendarDays.map((day, i) => (
                          <div
                            key={i}
                            className={[
                              'calendar-day',
                              day.inMonth && 'in-month',
                              day.isToday && 'today',
                              day.isSelected && 'selected',
                              day.isPast && 'past',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => c.selectDate(day)}
                          >
                            {` ${day.number} `}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button className="add-btn" disabled={!c.selectedHolidayDate || c.isSavingHoliday} onClick={() => c.addHoliday()}>
                  <i className={c.isSavingHoliday ? 'fas fa-spinner fa-spin' : 'fas fa-plus'} />
                  {c.isSavingHoliday ? 'Adding...' : 'Add Holiday'}
                </button>
              </div>
              <div className="holidays-list">
                <h4>Current Holidays</h4>
                <div className="holiday-items">
                  {c.tempHolidays.map((h, i) => (
                    <div className="holiday-item" key={i}>
                      <div className="holiday-info">
                        <div className="holiday-date">{fmtHoliday(h.date)}</div>
                        <div className="holiday-description">{h.description || 'Holiday'}</div>
                      </div>
                      <button className="remove-btn" disabled={c.isSavingHoliday} onClick={() => c.removeHoliday(i)}>
                        <i className={c.isSavingHoliday ? 'fas fa-spinner fa-spin' : 'fas fa-trash-alt'} />
                      </button>
                    </div>
                  ))}
                  {c.tempHolidays.length === 0 && <div className="no-holidays">No holidays added yet</div>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn cancel-btn" disabled={c.isSavingHoliday} onClick={() => c.closeHolidaysModal()}>
                {' Cancel '}
              </button>
              <button className="btn save-btn" disabled={c.isSavingHoliday} onClick={() => c.closeHolidaysModal()}>
                <i className="fas fa-check" /> Done{' '}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
