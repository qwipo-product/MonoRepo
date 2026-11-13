// Port of SingleOrderComponent (chunk MZXBUYWH) — /create-single-order ("Quick Order").
// Spec: docs/specs/02-create-order-customer-master.md §2.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { addressService } from '../../api/services/address.service';
import { orderCreateService } from '../../api/services/orderCreate.service';
import type { GeocodeSuggestion } from '../../api/services/geocode.service';
import AddressAutocomplete from './AddressAutocomplete';
import './SingleOrderPage.css';

/** Number inputs keep their raw text; the model value follows Angular's NumberValueAccessor ('' → null). */
type NumText = string;
const toNum = (v: NumText): number | null => (v === '' || v === null || v === undefined ? null : parseFloat(v));

interface ItemRow { itemName: string; qty: NumText; unitPrice: NumText; weight: NumText }

// The production bundle contains a double-escaped "×" here, so the live UI shows the raw escape text.
const ITEMS_HINT = 'Add items to auto-apply defaults (1 kg weight, 10\\xc3\\x9710\\xc3\\x9710 cm dimensions). Without items, fill in the fields above manually.';

// [deviation] Angular calls .trim() on these and throws on a non-string (e.g. a geocode hit without a city);
// the replica treats a non-string as empty instead of crashing the React tree.
const t = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export default function SingleOrderPage() {
  const navigate = useNavigate();
  const { buyerId } = usePagePermissions('buyer_orders');

  const [isLoading, setIsLoading] = useState(false);
  const [hasDefaultAddress, setHasDefaultAddress] = useState(true); // starts true so the banner does not flash

  const [customerName, setCustomerName] = useState('');
  const [customerBusinessName, setCustomerBusinessName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [amount, setAmount] = useState<NumText>('');
  const [weight, setWeight] = useState<NumText>('');
  const [lat, setLat] = useState<NumText>('');
  const [long, setLong] = useState<NumText>('');
  const [length, setLength] = useState<NumText>('');
  const [width, setWidth] = useState<NumText>('');
  const [height, setHeight] = useState<NumText>('');
  const [items, setItems] = useState<ItemRow[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await addressService.getDefaultAddress(buyerId);
        if (alive) setHasDefaultAddress(!!res?.data?.id);
      } catch {
        if (alive) setHasDefaultAddress(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [buyerId]);

  const hasItems = items.length > 0 && items.some((i) => i.itemName.trim() !== '');

  const isFormValid = (): boolean => {
    const amt = toNum(amount);
    return (
      t(customerName) !== '' &&
      t(mobile) !== '' &&
      t(mobile).length === 10 &&
      t(address) !== '' &&
      t(pincode) !== '' &&
      t(city) !== '' &&
      t(state) !== '' &&
      !!amt &&
      amt > 0 &&
      hasDefaultAddress
    );
  };

  const onAddressSelected = (s: GeocodeSuggestion) => {
    setAddress(s.formatted);
    setCity(s.city);
    setState(s.state);
    setPincode(s.pincode);
    setLat(s.lat ? String(s.lat) : '');
    setLong(s.lon ? String(s.lon) : '');
  };

  const addItem = () => setItems((prev) => [...prev, { itemName: '', qty: '', unitPrice: '', weight: '' }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const updateItem = (index: number, patch: Partial<ItemRow>) => setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const saveOrder = async () => {
    if (!isFormValid()) return;
    setIsLoading(true);
    try {
      const latN = toNum(lat);
      const longN = toNum(long);
      const lN = toNum(length);
      const wN = toNum(width);
      const hN = toNum(height);
      const orderWeight = (hasItems && Number(toNum(weight))) || 1;
      const payload: Record<string, unknown> = {
        buyerId,
        customerName: customerName.trim(),
        customerBusinessName: customerBusinessName.trim() || customerName.trim(),
        customerMobileNumber: mobile,
        customerAddress: address.trim(),
        customerCity: city.trim(),
        customerState: state.trim(),
        customerCountry: country.trim(),
        customerPincode: pincode.trim(),
      };
      if (latN) payload.customerLat = String(latN);
      if (longN) payload.customerLong = String(longN);
      Object.assign(payload, {
        amount: Number(toNum(amount)),
        orderWeight,
        volumetricWeight: orderWeight,
        statusId: 1,
        orderDate: new Date().toISOString(),
        dimensions: hasItems && lN && wN && hN ? `${lN}x${wN}x${hN}` : '10x10x10',
      });
      if (hasItems) {
        payload.items = items
          .filter((i) => i.itemName.trim() !== '')
          .map((i) => {
            const qty = toNum(i.qty) || 1;
            const sellingPrice = toNum(i.unitPrice) || 0;
            const unitWeight = toNum(i.weight) || 0;
            return {
              itemId: i.itemName.trim().replace(/\s+/g, '-').toLowerCase(),
              itemName: i.itemName,
              qty,
              sellingPrice,
              unitWeight,
              totalWeight: unitWeight * qty,
              totalAmount: sellingPrice * qty,
            };
          });
      }

      const data = await orderCreateService.createSingleOrder(payload);
      const newId = data?.orderIds?.[0] || data?.orderId || data?.id;
      if (!newId) throw new Error('Order creation returned no ID');
      await Swal.fire({ icon: 'success', title: 'Order Created', text: 'Order has been created successfully.', timer: 2000, showConfirmButton: false });
      navigate(`/order-details?orderId=${newId}`);
    } catch (e: any) {
      console.error('Error creating order:', e);
      Swal.fire({ icon: 'error', title: 'Error', text: e?.message || 'Failed to create order. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formValid = isFormValid();

  return (
    <div className="single-order-container">
      <header className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/orders')}>
            <i className="fas fa-arrow-left" />
          </button>
          <h1>Create Order</h1>
        </div>
      </header>

      {isLoading && <DataLoading overlay={false} message="Creating order..." />}

      {!hasDefaultAddress && (
        <div className="warning-banner">
          <i className="fas fa-exclamation-triangle" />
          <div className="warning-content">
            <strong>No default warehouse address found</strong>
            <p>You need to set a default pickup address before creating orders.</p>
          </div>
          <button className="settings-link" onClick={() => navigate('/settings/addresses')}>
            Go to Settings
          </button>
        </div>
      )}

      {!isLoading && (
        <div className="form-card">
          {/* Customer Details */}
          <div className="form-section">
            <h2>Customer Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customerName">Customer Name <span className="required">*</span></label>
                <input type="text" id="customerName" name="customerName" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="businessName">Business Name</label>
                <input type="text" id="businessName" name="businessName" placeholder="Enter business name (optional)" value={customerBusinessName} onChange={(e) => setCustomerBusinessName(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number <span className="required">*</span></label>
                <input type="tel" id="mobile" name="mobile" maxLength={10} placeholder="Enter 10-digit mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <div className="form-group" />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="form-section">
            <h2>Delivery Address</h2>
            <div className="form-row full-width">
              <div className="form-group">
                <AddressAutocomplete placeholder="Start typing delivery address..." required onAddressSelected={onAddressSelected} />
                <input type="hidden" name="address" value={address} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pincode">Pincode <span className="required">*</span></label>
                <input type="text" id="pincode" name="pincode" maxLength={6} placeholder="Enter pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="city">City <span className="required">*</span></label>
                <input type="text" id="city" name="city" placeholder="Enter city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="state">State <span className="required">*</span></label>
                <input type="text" id="state" name="state" placeholder="Enter state" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input type="text" id="country" name="country" placeholder="India" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lat">Latitude</label>
                <input type="number" id="lat" name="lat" step="any" placeholder="Optional" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="long">Longitude</label>
                <input type="number" id="long" name="long" step="any" placeholder="Optional" value={long} onChange={(e) => setLong(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="form-section">
            <h2>Order Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Order Amount (INR) <span className="required">*</span></label>
                <input type="number" id="amount" name="amount" min={1} placeholder="Enter order amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              {hasItems && (
                <div className="form-group">
                  <label htmlFor="weight">Total Weight (kg)</label>
                  <input type="number" id="weight" name="weight" min={0.01} step={0.01} placeholder="Default: 1 kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
              )}
            </div>
            {hasItems && (
              <div className="lbh-section">
                <h3>Package Dimensions</h3>
                <div className="form-row three-col">
                  <div className="form-group">
                    <label htmlFor="length">Length (cm)</label>
                    <input type="number" id="length" name="length" min={0.1} step={0.1} placeholder="Length" value={length} onChange={(e) => setLength(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="width">Width (cm)</label>
                    <input type="number" id="width" name="width" min={0.1} step={0.1} placeholder="Width" value={width} onChange={(e) => setWidth(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="height">Height (cm)</label>
                    <input type="number" id="height" name="height" min={0.1} step={0.1} placeholder="Height" value={height} onChange={(e) => setHeight(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="form-section">
            <div className="items-header">
              <h2>
                Order Items <span className="optional-label">(Optional)</span>
              </h2>
              <button type="button" className="add-item-btn" onClick={addItem}>
                <i className="fas fa-plus" /> Add Item
              </button>
            </div>

            {items.length === 0 && <p className="items-hint">{ITEMS_HINT}</p>}

            {items.length > 0 && (
              <div className="items-table">
                <div className="items-table-header">
                  <span className="col-name">Item Name</span>
                  <span className="col-num">Qty</span>
                  <span className="col-num">Unit Price</span>
                  <span className="col-num">Weight (kg)</span>
                  <span className="col-action" />
                </div>
                {items.map((item, i) => (
                  <div className="item-row" key={i}>
                    <input type="text" className="col-name" placeholder="Item name" value={item.itemName} onChange={(e) => updateItem(i, { itemName: e.target.value })} />
                    <input type="number" className="col-num" min={1} placeholder="Qty" value={item.qty} onChange={(e) => updateItem(i, { qty: e.target.value })} />
                    <input type="number" className="col-num" min={0} placeholder="Price" value={item.unitPrice} onChange={(e) => updateItem(i, { unitPrice: e.target.value })} />
                    <input type="number" className="col-num" min={0} step={0.1} placeholder="Weight" value={item.weight} onChange={(e) => updateItem(i, { weight: e.target.value })} />
                    <button type="button" className="remove-item-btn col-action" onClick={() => removeItem(i)}>
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button type="button" className="cancel-btn" onClick={() => navigate('/orders')}>
              Cancel
            </button>
            <button type="button" className="save-btn" disabled={!formValid} onClick={saveOrder}>
              <i className="fas fa-save" /> Save Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
