// Port of <app-update-delivery-address-modal> (spec 01 §1.8, spec 02 §4.3) — "Modify Delivery Address for Orders".
import { useEffect } from 'react';
import Swal from 'sweetalert2';
import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';
import { ordersService } from '../../../api/services/orders.service';
import { ngNumber, useInstance } from '../useInstance';
import './UpdateDeliveryAddressModal.css';

interface Props {
  buyerId: string;
  /** Closes with `{updated:true}` after a successful update; ✕ / Cancel close with undefined. */
  onClose: (result?: { updated: boolean }) => void;
}

interface FoundOrder {
  orderId: string;
  refOrderId: string;
  customerBusinessName: string;
  customerMobileNumber: string;
  amount: number;
  orderWeight: number;
  selected: boolean;
  isDeliveryAddressUpdated: boolean;
}

interface CustomerHit {
  id: string;
  customer_name?: string;
  business_name?: string;
  address?: string;
  mobile_number?: string;
  [k: string]: any;
}

/** Split on comma / newline / tab / semicolon / pipe / space, trim, drop empties, de-duplicate (first occurrence wins). */
function parseInvoices(input: string): string[] {
  const out: string[] = [];
  input.split(/[,\n\t;| ]+/).map((x) => x.trim()).filter(Boolean).forEach((x) => {
    if (!out.includes(x)) out.push(x);
  });
  return out;
}

export default function UpdateDeliveryAddressModal({ buyerId, onClose }: Props) {
  const [s, update] = useInstance(() => ({
    invoiceInput: '',
    isSearchingOrders: false,
    searchMessage: '',
    orders: [] as FoundOrder[],
    customerQuery: '',
    customerTimer: undefined as number | undefined,
    isSearchingCustomers: false,
    customerResults: [] as CustomerHit[],
    customerSearchMessage: '',
    selectedCustomer: null as CustomerHit | null,
    isSubmitting: false,
    closed: false,
  }));

  useEffect(() => () => window.clearTimeout(s.customerTimer), [s]);

  const close = (result?: { updated: boolean }) => {
    if (s.closed) return;
    s.closed = true;
    window.clearTimeout(s.customerTimer);
    onClose(result);
  };

  // ---------------------------------------------------------------- step 1 — orders
  const searchInvoices = async () => {
    const invoices = parseInvoices(s.invoiceInput);
    if (invoices.length === 0) {
      s.searchMessage = 'Please enter at least one invoice number.';
      update();
      return;
    }
    s.isSearchingOrders = true;
    s.searchMessage = '';
    update();
    try {
      const rows = await ordersService.searchByInvoice(invoices, buyerId);
      // a new search replaces the previous list and its selections
      s.orders = rows.map((r: any) => ({
        orderId: r.order_id,
        refOrderId: r.ref_order_id,
        customerBusinessName: r.customer_business_name || r.customer_name,
        customerMobileNumber: r.customer_mobile_number,
        amount: Number(r.amount) || 0,
        orderWeight: Number(r.order_weight) || 0,
        selected: true,
        isDeliveryAddressUpdated: !!r.is_delivery_address_updated,
      }));
      if (s.orders.length === 0) {
        s.searchMessage = 'No orders found. Please check the invoice numbers or ensure orders are in "Ready for Planning" status.';
      } else if (s.orders.length < invoices.length) {
        const found = s.orders.map((o) => o.refOrderId);
        const missing = invoices.filter((inv) => !found.includes(inv));
        s.searchMessage = `${missing.length} invoice(s) not loaded (${missing.join(', ')}). Invoice may be incorrect or not in "Ready for Planning" status.`;
      } else {
        s.searchMessage = '';
      }
    } catch (e) {
      // effectively unreachable: the service returns [] on HTTP errors
      console.error('Error searching orders:', e);
      s.searchMessage = 'Error searching for orders. Please try again.';
    } finally {
      s.isSearchingOrders = false;
      update();
    }
  };

  const toggleOrder = (o: FoundOrder) => {
    o.selected = !o.selected;
    update();
  };

  // ---------------------------------------------------------------- step 2 — customer
  const searchCustomers = async (query: string) => {
    s.isSearchingCustomers = true;
    s.customerSearchMessage = '';
    update();
    try {
      const results = await ordersService.searchCustomers(query.trim(), buyerId);
      s.customerResults = results || [];
      s.customerSearchMessage = s.customerResults.length === 0 ? 'No customers found.' : '';
    } catch (e) {
      console.error('Error searching customers:', e);
      s.customerResults = [];
      s.customerSearchMessage = 'Error searching customers.';
    } finally {
      s.isSearchingCustomers = false;
      update();
    }
  };

  const onCustomerQueryChange = (value: string) => {
    s.customerQuery = value;
    window.clearTimeout(s.customerTimer);
    if (value.trim().length >= 2) {
      s.customerTimer = window.setTimeout(() => searchCustomers(value), 300); // debounceTime(300)
    } else {
      s.customerResults = [];
      s.customerSearchMessage = '';
    }
    update();
  };

  const selectCustomer = (c: CustomerHit) => {
    s.selectedCustomer = c;
    s.customerResults = [];
    s.customerQuery = c.customer_name || c.business_name || '';
    update();
  };

  const clearCustomer = () => {
    s.selectedCustomer = null;
    s.customerQuery = '';
    s.customerResults = [];
    update();
  };

  // ---------------------------------------------------------------- submit
  const selectedOrders = s.orders.filter((o) => o.selected);
  const totalAmount = selectedOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalWeight = selectedOrders.reduce((sum, o) => sum + o.orderWeight, 0);
  const canSubmit = selectedOrders.length > 0 && !!s.selectedCustomer && !s.isSubmitting;

  const onSubmit = async () => {
    if (!canSubmit || !s.selectedCustomer) return;
    s.isSubmitting = true;
    update();
    try {
      const response = await ordersService.updateDeliveryAddress({
        orderIds: selectedOrders.map((o) => o.orderId),
        targetCustomerMasterId: s.selectedCustomer.id,
        buyerId,
      });
      if (response?.success) {
        const data = response.data;
        Swal.fire({
          icon: 'success',
          title: 'Delivery Address Modified',
          text: `${data.updatedCount} order(s) updated to ${data.targetCustomer.name} (${data.targetCustomer.mobile}).`,
          confirmButtonColor: '#3085d6',
          timer: 3000,
          showConfirmButton: false,
        });
        close({ updated: true });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response?.error?.message || 'Failed to update delivery address. Please try again.',
          confirmButtonColor: '#3085d6',
        });
      }
    } catch (err: any) {
      // reached only if something throws (e.g. a success response without `data`)
      const code = err?.error?.error?.code ?? err?.error?.code ?? err?.status ?? err?.code;
      const message = err?.error?.error?.message || err?.error?.message || err?.message;
      const text = message || 'An unexpected error occurred. Please try again.';
      if (code === 404) Swal.fire({ icon: 'warning', title: 'Not Found', text, confirmButtonColor: '#3085d6' });
      else if (code === 400) Swal.fire({ icon: 'warning', title: 'Cannot Modify', text, confirmButtonColor: '#3085d6' });
      else Swal.fire({ icon: 'error', title: 'Error', text, confirmButtonColor: '#3085d6' });
    } finally {
      s.isSubmitting = false;
      update();
    }
  };

  const invoiceCount = parseInvoices(s.invoiceInput).length;
  const c = s.selectedCustomer;

  return (
    <Dialog
      open
      className="update-delivery-address-dialog-panel"
      maxWidth={false}
      disableEscapeKeyDown
      PaperProps={{ sx: { maxWidth: '95vw', maxHeight: '95vh', m: 0, width: 'auto', borderRadius: '12px', overflow: 'hidden' } }}
    >
      <div className="update-delivery-dialog">
        {/* Header */}
        <div className="udd-header">
          <div>
            <h2>Modify Delivery Address for Orders</h2>
            <p>Select orders and modify their delivery address to a different customer</p>
          </div>
          <button className="udd-close-btn" aria-label="Close" onClick={() => close()}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="udd-body">
          {/* Step 1 */}
          <div className="udd-column">
            <div className="step-label">Step 1</div>
            <h3 className="step-title">Select Orders</h3>
            <label className="field-label">Invoice Numbers</label>
            <textarea
              className="invoice-textarea"
              rows={3}
              placeholder="Paste invoices — comma, newline, tab, semicolon, pipe, or space separated"
              value={s.invoiceInput}
              onChange={(e) => { s.invoiceInput = e.target.value; update(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Enter searches instead of adding a newline
                  searchInvoices();
                }
              }}
            />
            <div className="search-actions">
              {s.invoiceInput.trim() && <span className="invoice-count"> {invoiceCount} invoice(s) entered </span>}
              <button className="btn-search" disabled={s.isSearchingOrders || !s.invoiceInput.trim()} onClick={searchInvoices}>
                {s.isSearchingOrders ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <span className="material-icons">search</span>}
                <span>{s.isSearchingOrders ? 'Searching Orders...' : 'Search Orders'}</span>
                {!s.isSearchingOrders && <span className="material-icons btn-arrow">arrow_forward</span>}
              </button>
            </div>

            {s.searchMessage && (
              <p className="msg-warning">
                <span className="material-icons">warning_amber</span>
                {s.searchMessage}
              </p>
            )}

            {s.isSearchingOrders && (
              <div className="skeleton-list">
                {[0, 1, 2].map((i) => (
                  <div className="skeleton-row" key={i}>
                    <div className="sk sk-check" />
                    <div className="sk-lines">
                      <div className="sk sk-line" style={{ width: '70%' }} />
                      <div className="sk sk-line" style={{ width: '45%' }} />
                    </div>
                    <div className="sk sk-short" />
                  </div>
                ))}
              </div>
            )}

            {s.orders.length > 0 && !s.isSearchingOrders && (
              <div className="orders-results">
                <div className="list-header">Orders Found ({s.orders.length})</div>
                <div className="orders-list">
                  {s.orders.map((o) => (
                    <div key={o.orderId} className={`order-row${o.selected ? ' selected' : ''}`} onClick={() => toggleOrder(o)}>
                      <input type="checkbox" checked={o.selected} onClick={(e) => e.stopPropagation()} onChange={() => toggleOrder(o)} />
                      <div className="order-info">
                        <span className="order-invoice">{o.refOrderId}</span>
                        <span className="order-customer">{o.customerBusinessName}</span>
                      </div>
                      <div className="order-meta">
                        <span className="order-amount">₹{ngNumber(o.amount, 0, 0)}</span>
                        <span className="sep">|</span>
                        <span className="order-weight">{ngNumber(o.orderWeight, 0, 0)} kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {s.orders.length === 0 && !s.isSearchingOrders && !s.searchMessage && (
              <div className="empty-card">
                <div className="empty-icon"><span className="material-icons">description</span></div>
                <div className="empty-title">No Orders Selected</div>
                <div className="empty-hint">
                  Paste invoice numbers above and click<br />
                  <strong>"Search Orders"</strong> to load orders.
                </div>
              </div>
            )}
          </div>

          <div className="vertical-divider" />

          {/* Step 2 */}
          <div className="udd-column">
            <div className="step-label">Step 2</div>
            <h3 className="step-title">Select Delivery Customer</h3>
            <label className="field-label">Search customer by name or phone</label>
            <div className="customer-search">
              <span className="material-icons search-icon">search</span>
              <input
                type="text"
                placeholder="Search customer by name or phone"
                value={s.customerQuery}
                onChange={(e) => onCustomerQueryChange(e.target.value)}
              />
              {s.selectedCustomer && (
                <button className="clear-btn" aria-label="Clear" onClick={clearCustomer}>
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>

            {s.isSearchingCustomers && (
              <p className="msg-muted">
                <CircularProgress size={12} sx={{ color: 'inherit' }} /> Finding matching customers...
              </p>
            )}
            {s.customerSearchMessage && (
              <p className="msg-warning">
                <span className="material-icons">warning_amber</span>
                {s.customerSearchMessage}
              </p>
            )}

            {!s.selectedCustomer && s.customerResults.length > 0 && (
              <div className="customer-list">
                {s.customerResults.map((r) => (
                  <div key={r.id} className="customer-card" onClick={() => selectCustomer(r)}>
                    <div className="customer-main">
                      <div className="customer-name">{r.customer_name || r.business_name}</div>
                      <div className="customer-address">{r.address}</div>
                    </div>
                    <div className="customer-mobile">{r.mobile_number}</div>
                  </div>
                ))}
              </div>
            )}

            {c && (
              <div className="selected-customer">
                <div className="sc-top">
                  <div className="sc-avatar"><span className="material-icons">store</span></div>
                  <div>
                    <div className="sc-name">{c.customer_name || c.business_name}</div>
                    <div className="sc-mobile">{c.mobile_number}</div>
                  </div>
                </div>
                {c.address && (
                  <div className="sc-address">
                    <span className="material-icons">location_on</span>
                    <span>{c.address}</span>
                  </div>
                )}
              </div>
            )}

            {!s.selectedCustomer && s.customerResults.length === 0 && !s.isSearchingCustomers && !s.customerSearchMessage && (
              <div className="empty-card">
                <div className="empty-icon"><span className="material-icons">person_search</span></div>
                <div className="empty-title">No Customer Selected</div>
                <div className="empty-hint">
                  Search customer by name or phone<br />and select a delivery customer.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="udd-footer">
          {selectedOrders.length > 0 && s.selectedCustomer ? (
            <div className="summary-chips">
              <span className="chip"><span className="material-icons">receipt</span>Selected: <strong>{selectedOrders.length}</strong> orders</span>
              <span className="chip"><span className="material-icons">currency_rupee</span><strong>₹{ngNumber(totalAmount, 0, 0)}</strong></span>
              <span className="chip"><span className="material-icons">scale</span><strong>{ngNumber(totalWeight, 0, 0)}</strong> kg</span>
              <span className="chip chip-highlight"><span className="material-icons">person</span>{s.selectedCustomer.customer_name || s.selectedCustomer.business_name}</span>
            </div>
          ) : (
            <div className="spacer" />
          )}
          <div className="footer-actions">
            <button className="btn-cancel" onClick={() => close()}>Cancel</button>
            <button className="btn-primary-udd" disabled={!canSubmit} onClick={onSubmit}>
              {s.isSubmitting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <span className="material-icons">swap_horiz</span>}
              <span>{s.isSubmitting ? 'Modifying...' : 'Modify'}</span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
