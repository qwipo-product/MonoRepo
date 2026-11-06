// Port of <app-error-fix-dialog> (spec 01 §1.7, spec 02 §4.2) — opened from the Orders list for Pending (9) orders.
// Reactive-forms behaviour is emulated: each field is a control with value / touched / dirty and Angular-style
// validators (required, min, max, pattern, datepicker parse/max/filter).
import { useEffect, type ReactElement } from 'react';
import Swal from 'sweetalert2';
import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs, { type Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ordersService, type ValidationErrorItem, type ValidationErrorsData } from '../../../api/services/orders.service';
import { normalizeExcelDate } from '../../../utils/helpers';
import { useInstance } from '../useInstance';
import './ErrorFixDialog.css';

export interface ErrorFixResult {
  updated: boolean;
  allFixed?: boolean;
  errorsFixed?: number;
  remainingErrors?: number;
}

interface Props {
  orderId: string;
  orderRef: string;
  onClose: (result: ErrorFixResult) => void;
}

type InputType = 'text' | 'number' | 'tel' | 'date' | 'select';
interface FieldMeta {
  displayLabel: string;
  inputType: InputType;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  options?: { value: string; label: string }[];
}

/** Field metadata (labels mirror the Excel import columns). */
const FIELD_METADATA: Record<string, FieldMeta> = {
  customer_uniq_identifier: { displayLabel: 'UID', inputType: 'text', placeholder: 'Enter UID', required: true },
  customer_id: { displayLabel: 'Customer ID', inputType: 'text', placeholder: 'Enter customer ID', required: true },
  ref_order_id: { displayLabel: 'Invoice ID', inputType: 'text', placeholder: 'Enter invoice ID', required: true },
  order_date: { displayLabel: 'Billing Date', inputType: 'date', placeholder: 'YYYY-MM-DD', required: true },
  customer_name: { displayLabel: 'Store Name', inputType: 'text', placeholder: 'Enter store name', required: true },
  customer_address: { displayLabel: 'Store Address', inputType: 'text', placeholder: 'Enter store address', required: true },
  customer_lat: { displayLabel: 'Delivery Latitude', inputType: 'number', placeholder: 'e.g., 28.6139', required: true, min: -90, max: 90 },
  customer_long: { displayLabel: 'Delivery Longitude', inputType: 'number', placeholder: 'e.g., 77.2090', required: true, min: -180, max: 180 },
  customer_mobile_number: { displayLabel: 'Store Mobile', inputType: 'tel', placeholder: 'Enter 10-digit mobile', required: true, pattern: /^[6-9]\d{9}$/ },
  customer_pincode: { displayLabel: 'Pincode', inputType: 'text', placeholder: 'Enter pincode', required: true },
  total_amount: { displayLabel: 'Net Invoice Value', inputType: 'number', placeholder: 'Enter net invoice value', min: 0 },
  order_type: {
    displayLabel: 'Order Type', inputType: 'select', placeholder: 'Select an option', required: true,
    options: [{ value: 'Digital', label: 'Digital' }, { value: 'Sales', label: 'Sales' }],
  },
  beat: { displayLabel: 'Beat', inputType: 'text', placeholder: 'Alphabetic only' },
  item_name: { displayLabel: 'Item Description', inputType: 'text', placeholder: 'Enter item description', required: true },
  qty: { displayLabel: 'Quantity', inputType: 'number', placeholder: 'Enter quantity', required: true, min: 1 },
  unit_weight: { displayLabel: 'Weight', inputType: 'number', placeholder: 'Enter weight', required: true, min: 0.001 },
  mrp: { displayLabel: 'MRP', inputType: 'number', placeholder: 'Enter MRP', required: true, min: 0.01 },
  length: { displayLabel: 'Length (cm)', inputType: 'number', placeholder: 'Enter length', required: true, min: 0.1 },
  width: { displayLabel: 'Width (cm)', inputType: 'number', placeholder: 'Enter width', required: true, min: 0.1 },
  height: { displayLabel: 'Height (cm)', inputType: 'number', placeholder: 'Enter height', required: true, min: 0.1 },
};

/** Unknown field names render as text inputs with no validators, labelled with the raw fieldName. */
const metaFor = (fieldName: string): FieldMeta => FIELD_METADATA[fieldName] ?? { displayLabel: fieldName, inputType: 'text' };

// ---------------------------------------------------------------- Angular-style validators
type Errors = Record<string, any>;
type Validator = (value: any) => Errors | null;
const isEmptyInputValue = (v: any) => v === null || v === undefined || ((typeof v === 'string' || Array.isArray(v)) && v.length === 0);
const vRequired: Validator = (v) => (isEmptyInputValue(v) ? { required: true } : null);
const vMin = (min: number): Validator => (v) => {
  if (isEmptyInputValue(v)) return null;
  const n = parseFloat(v);
  return !isNaN(n) && n < min ? { min: { min, actual: v } } : null;
};
const vMax = (max: number): Validator => (v) => {
  if (isEmptyInputValue(v)) return null;
  const n = parseFloat(v);
  return !isNaN(n) && n > max ? { max: { max, actual: v } } : null;
};
const vPattern = (re: RegExp): Validator => (v) => {
  if (isEmptyInputValue(v)) return null;
  return re.test(String(v)) ? null : { pattern: { requiredPattern: String(re), actualValue: v } };
};
const ISO_8601 = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/;
/** matDatepicker validators: parse (NativeDateAdapter only deserialises ISO-8601 strings), max = today, filter = no future dates. */
const vDatepicker: Validator = (v) => {
  if (isEmptyInputValue(v)) return null;
  let d: Date | null = null;
  if (v instanceof Date) d = v;
  else if (typeof v === 'string' && ISO_8601.test(v)) d = new Date(v);
  if (!d || isNaN(d.getTime())) return { matDatepickerParse: { text: String(v) } };
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (d.getTime() > endOfToday.getTime()) return { matDatepickerMax: true, matDatepickerFilter: true };
  return null;
};

function validatorsFor(fieldName: string, meta: FieldMeta): Validator[] {
  const list: Validator[] = [];
  if (meta.required) list.push(vRequired);
  if (meta.inputType === 'number') {
    if (meta.min !== undefined) list.push(vMin(meta.min));
    if (meta.max !== undefined) list.push(vMax(meta.max));
    // as-built: this rejects negative numbers, so a negative latitude/longitude can never pass
    list.push(vPattern(/^\d*\.?\d*$/));
  }
  if (meta.inputType === 'tel') {
    list.push(vPattern(/^[6-9]\d{9}$/));
    if (meta.pattern) list.push(vPattern(meta.pattern));
  }
  if (meta.inputType === 'date') list.push(vDatepicker);
  if (fieldName === 'beat') list.push(vPattern(/^[a-zA-Z\s]+$/));
  if (fieldName === 'customer_pincode') list.push(vPattern(/^\d{6}$/));
  if (fieldName === 'customer_lat' || fieldName === 'customer_long') list.push(vPattern(/^-?\d+\.?\d*$/));
  return list;
}

function runValidators(fieldName: string, value: any): Errors | null {
  const errs = validatorsFor(fieldName, metaFor(fieldName)).reduce<Errors>((acc, v) => Object.assign(acc, v(value) || {}), {});
  return Object.keys(errs).length ? errs : null;
}

function errorMessageFor(fieldName: string, errors: Errors): string {
  const meta = metaFor(fieldName);
  const label = meta.displayLabel;
  if (errors.required) return `${label} is required`;
  if (errors.min) return meta.inputType === 'number' ? `${label} must be at least ${errors.min.min}` : `${label} is too short`;
  if (errors.max) return meta.inputType === 'number' ? `${label} must be at most ${errors.max.max}` : `${label} is too long`;
  if (errors.pattern) {
    if (meta.inputType === 'tel') return 'Please enter a valid 10-digit mobile number starting with 6-9';
    if (fieldName === 'beat') return 'Beat should contain alphabetic characters only';
    return `${label} format is invalid`;
  }
  if (errors.email) return 'Please enter a valid email address';
  if (errors.minlength) return `${label} must be at least ${errors.minlength.requiredLength} characters`;
  if (errors.maxlength) return `${label} must be at most ${errors.maxlength.requiredLength} characters`;
  return `${label} is invalid`;
}

// ---------------------------------------------------------------- component
interface Ctl {
  value: any;
  touched: boolean;
  dirty: boolean;
}
type Form = Record<string, Ctl>;
type Tab = 'customer_order' | 'product';

export default function ErrorFixDialog({ orderId, orderRef, onClose }: Props) {
  const [s, update] = useInstance(() => ({
    isLoading: true,
    isSaving: false,
    errors: null as ValidationErrorsData | null,
    customerForm: {} as Form,
    productForms: {} as Record<string, Form>,
    productGroups: [] as { itemId: string; rowNumber?: number; errors: ValidationErrorItem[] }[],
    activeTab: 'customer_order' as Tab,
    closed: false,
  }));

  useEffect(() => {
    let alive = true;
    (async () => {
      s.isLoading = true;
      update();
      const data = await ordersService.getOrderValidationErrors(orderId);
      if (!alive) return;
      s.errors = data;
      if (data) {
        const cust: Form = {};
        (data.groups?.customer_order?.errors || []).forEach((e) => {
          cust[e.fieldName] = { value: e.currentValue || '', touched: false, dirty: false };
        });
        s.customerForm = cust;
        const groups: Record<string, ValidationErrorItem[]> = {};
        (data.groups?.product?.errors || []).forEach((e) => {
          const key = e.itemId || 'unknown';
          (groups[key] = groups[key] || []).push(e);
        });
        const forms: Record<string, Form> = {};
        Object.entries(groups).forEach(([itemId, errs]) => {
          forms[itemId] = {};
          errs.forEach((e) => (forms[itemId][e.fieldName] = { value: e.currentValue || '', touched: false, dirty: false }));
        });
        s.productForms = forms;
        // keyvalue pipe → sections sorted by key
        s.productGroups = Object.keys(groups)
          .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
          .map((itemId) => ({ itemId, rowNumber: groups[itemId].find((e) => e.rowNumber != null)?.rowNumber, errors: groups[itemId] }));
        s.activeTab = (data.groups?.customer_order?.count || 0) > 0 ? 'customer_order' : 'product';
      }
      s.isLoading = false;
      update();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const close = (result: ErrorFixResult) => {
    if (s.closed) return;
    s.closed = true;
    onClose(result);
  };

  const customerCount = s.errors?.groups?.customer_order?.count || 0;
  const productCount = s.errors?.groups?.product?.count || 0;
  const totalErrors = s.errors?.totalErrors || 0;

  const isValid = (fieldName: string, c?: Ctl) => !c || !runValidators(fieldName, c.value);
  const isCorrected = (fieldName: string, c?: Ctl) => !!c && isValid(fieldName, c) && c.dirty;

  const remainingCustomer = () =>
    (s.errors?.groups?.customer_order?.errors || []).filter((e) => !isCorrected(e.fieldName, s.customerForm[e.fieldName])).length;
  const remainingForItem = (itemId: string, errs: ValidationErrorItem[]) =>
    errs.filter((e) => !isCorrected(e.fieldName, s.productForms[itemId]?.[e.fieldName])).length;
  const remainingProduct = () => s.productGroups.reduce((sum, g) => sum + remainingForItem(g.itemId, g.errors), 0);

  const setValue = (c: Ctl, value: any) => {
    c.value = value;
    c.dirty = true;
    update();
  };
  const touch = (c: Ctl) => {
    if (!c.touched) {
      c.touched = true;
      update();
    }
  };

  // ---------------------------------------------------------------- save
  const saveChanges = async () => {
    if (!s.errors) return;
    s.isSaving = true;
    update();
    try {
      const updates: { fieldName: string; newValue: any; itemId?: string }[] = [];
      const changed = (c: Ctl | undefined, currentValue: any) =>
        !!c && c.dirty && c.value !== null && c.value !== '' && c.value !== undefined && String(c.value) !== String(currentValue);
      (s.errors.groups?.customer_order?.errors || []).forEach((e) => {
        const c = s.customerForm[e.fieldName];
        if (changed(c, e.currentValue)) {
          let newValue = c.value;
          if (e.fieldName === 'order_date') newValue = normalizeExcelDate(String(c.value));
          updates.push({ fieldName: e.fieldName, newValue });
        }
      });
      Object.entries(s.productForms).forEach(([itemId, form]) => {
        const errs = s.productGroups.find((g) => g.itemId === itemId)?.errors || [];
        errs.forEach((e) => {
          const c = form[e.fieldName];
          if (changed(c, e.currentValue)) updates.push({ fieldName: e.fieldName, newValue: c.value, itemId });
        });
      });
      // as-built: form validity is not checked — invalid but changed values are sent
      if (updates.length === 0) {
        close({ updated: false, allFixed: false, errorsFixed: 0, remainingErrors: s.errors.totalErrors });
        return;
      }
      const result = await ordersService.fixOrderErrors(orderId, updates);
      if (result) {
        if (result.allErrorsResolved) {
          await Swal.fire({ icon: 'success', title: 'All Errors Fixed!', text: result.message, timer: 2000, showConfirmButton: false });
          close({ updated: true, allFixed: true, errorsFixed: result.errorsFixed, remainingErrors: 0 });
        } else {
          close({ updated: true, allFixed: false, errorsFixed: result.errorsFixed, remainingErrors: result.remainingErrors });
        }
      } else {
        Swal.fire({ icon: 'error', title: 'Save Failed', text: 'Failed to save changes. Please try again.' });
      }
    } catch (e) {
      console.error('Error saving fixes:', e);
      Swal.fire({ icon: 'error', title: 'Error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      s.isSaving = false;
      update();
    }
  };

  const onPrimary = () => {
    if (s.activeTab === 'customer_order' && productCount > 0) {
      s.activeTab = 'product';
      update();
    } else {
      saveChanges();
    }
  };

  // ---------------------------------------------------------------- field rendering
  const renderField = (e: ValidationErrorItem, c: Ctl | undefined, key: string) => {
    if (!c) return null;
    const meta = metaFor(e.fieldName);
    const errs = runValidators(e.fieldName, c.value);
    const invalid = !!errs;
    let message = '';
    if (c.touched && invalid) message = errorMessageFor(e.fieldName, errs!);
    else if (!(!invalid && c.dirty)) message = e.errorMessage;
    const cls = `field-input${!e.isMandatory ? ' warning-border' : ''}${c.touched && invalid ? ' is-invalid' : ''}`;

    let control: ReactElement;
    if (meta.inputType === 'date') {
      const dv: Dayjs | null = c.value instanceof Date
        ? dayjs(c.value)
        : typeof c.value === 'string' && ISO_8601.test(c.value) ? dayjs(c.value) : null;
      control = (
        <div className={`date-input-wrapper${!e.isMandatory ? ' warning-border' : ''}`}>
          <span className="material-icons date-icon">calendar_today</span>
          <DatePicker
            value={dv && dv.isValid() ? dv : null}
            onChange={(d: Dayjs | null) => setValue(c, d && d.isValid() ? d.startOf('day').toDate() : null)}
            onClose={() => touch(c)}
            maxDate={dayjs().endOf('day')}
            shouldDisableDate={(d) => d.isAfter(dayjs().endOf('day'))}
            format="M/D/YYYY"
            slotProps={{
              textField: { size: 'small', placeholder: meta.placeholder, fullWidth: true, onBlur: () => touch(c), inputProps: { placeholder: meta.placeholder } },
              popper: { sx: { zIndex: 1700 } },
            }}
          />
        </div>
      );
    } else if (meta.inputType === 'select') {
      control = (
        <select className={`field-select${!e.isMandatory ? ' warning-border' : ''}`} value={c.value ?? ''} onChange={(ev) => setValue(c, ev.target.value)} onBlur={() => touch(c)}>
          <option value="" disabled>{meta.placeholder || 'Select an option'}</option>
          {(meta.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    } else {
      control = (
        <input
          type={meta.inputType}
          className={cls}
          placeholder={meta.placeholder || ''}
          value={c.value ?? ''}
          onChange={(ev) => setValue(c, ev.target.value)}
          onBlur={() => touch(c)}
        />
      );
    }
    return (
      <div className="form-field" key={key}>
        <label className="field-label">
          {meta.displayLabel}
          {e.isMandatory && <span className="required-asterisk">*</span>}
        </label>
        {control}
        {message && <p className="error-message">{message}</p>}
      </div>
    );
  };

  const remCust = remainingCustomer();
  const remProd = remainingProduct();
  const hasErrors = !!s.errors && totalErrors > 0;

  return (
    <Dialog
      open
      className="error-fix-dialog-panel"
      maxWidth={false}
      disableEscapeKeyDown
      PaperProps={{ sx: { maxWidth: '90vw', maxHeight: '90vh', m: 0, width: 'auto' } }}
    >
      <div className="error-fix-dialog">
        <button className="close-icon-btn" aria-label="Close" onClick={() => close({ updated: false })}>
          <span className="material-icons">close</span>
        </button>

        <div className="dialog-header">
          <h2 className="dialog-title">
            <span className="material-icons title-icon">warning</span>
            Fix Order Errors – {orderRef}
          </h2>
          <p className="dialog-subtitle">
            Review and correct the fields below. <span className="required-asterisk">*</span> indicates mandatory fields.
          </p>
        </div>

        {!s.isLoading && hasErrors && (
          <div className="tabs-row">
            <button
              className={`tab-btn${s.activeTab === 'customer_order' ? ' active' : ''}`}
              disabled={customerCount === 0}
              onClick={() => { s.activeTab = 'customer_order'; update(); }}
            >
              <span className="material-icons">person</span>
              Customer &amp; Order Information
              <span className="tab-count">{remCust}</span>
            </button>
            <button
              className={`tab-btn${s.activeTab === 'product' ? ' active' : ''}`}
              disabled={productCount === 0}
              onClick={() => { s.activeTab = 'product'; update(); }}
            >
              <span className="material-icons">inventory_2</span>
              Product Information
              <span className="tab-count">{remProd}</span>
            </button>
          </div>
        )}

        <div className="mat-dialog-content">
          {s.isLoading ? (
            <div className="loading-state">
              <CircularProgress size={40} />
              <p>Loading errors...</p>
            </div>
          ) : !hasErrors ? (
            <div className="empty-state">
              <span className="material-icons success-icon">check_circle</span>
              <h3>No Validation Errors</h3>
              <p>This order has no validation errors and is ready for processing.</p>
            </div>
          ) : s.activeTab === 'customer_order' ? (
            <div className="form-section">
              <h3 className="section-header">
                <span className="material-icons">receipt</span> Order: {orderRef} <span className="field-count">{remCust} fields</span>
              </h3>
              <div className="form-grid">
                {(s.errors!.groups.customer_order.errors || []).map((e, i) => renderField(e, s.customerForm[e.fieldName], `c-${e.fieldName}-${i}`))}
              </div>
            </div>
          ) : (
            <div>
              {s.productGroups.map((g) => (
                <div className="form-section" key={g.itemId}>
                  <h3 className="section-header">
                    <span className="material-icons">local_offer</span> Item: {g.itemId}{' '}
                    {g.rowNumber != null && <span className="row-number">(Row {g.rowNumber})</span>}
                    <span className="field-count">({remainingForItem(g.itemId, g.errors)} fields)</span>
                  </h3>
                  <div className="form-grid">
                    {g.errors.map((e, i) => renderField(e, s.productForms[g.itemId]?.[e.fieldName], `p-${g.itemId}-${e.fieldName}-${i}`))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {s.errors && totalErrors > 0 && (
          <div className="dialog-actions">
            <button
              className="mat-stroked-btn nav-btn"
              disabled={!(s.activeTab === 'product' && customerCount > 0)}
              onClick={() => { s.activeTab = 'customer_order'; update(); }}
            >
              <span className="material-icons">chevron_left</span> Previous
            </button>
            <button className="mat-stroked-btn cancel-btn" onClick={() => close({ updated: false })}>Cancel</button>
            <button className="mat-raised-btn next-btn" disabled={s.isSaving} onClick={onPrimary}>
              {s.isSaving ? (
                <CircularProgress size={18} sx={{ color: '#fff' }} />
              ) : s.activeTab === 'customer_order' && productCount > 0 ? (
                <>Next <span className="material-icons">chevron_right</span></>
              ) : (
                <><span className="material-icons">save</span> Update</>
              )}
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
