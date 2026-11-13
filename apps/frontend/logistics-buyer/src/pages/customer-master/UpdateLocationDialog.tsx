// Port of <app-update-location-dialog> (chunk SMDAVJ5U). Spec 02 §3.5.
import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import type { CustomerLocationUpdate, CustomerMasterRow } from '../../api/services/customerMaster.service';
import './UpdateLocationDialog.css';

const COORD_REGEX = /^-?\d{1,3}\.\d{1,20}$/;

interface Props {
  open: boolean;
  customer: CustomerMasterRow | null;
  /** result = undefined when closed without saving (Cancel / X / backdrop / Esc). */
  onClose: (result?: CustomerLocationUpdate) => void;
}

export default function UpdateLocationDialog({ open, customer, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth={false}
      PaperProps={{ sx: { width: 520, maxWidth: 'calc(100vw - 48px)', borderRadius: '12px', m: 3 } }}
    >
      {customer && <DialogBody customer={customer} onClose={onClose} />}
    </Dialog>
  );
}

function DialogBody({ customer, onClose }: { customer: CustomerMasterRow; onClose: Props['onClose'] }) {
  // values must be strings (.trim() is called on them)
  const [originalLatitude] = useState<string>(customer.latitude || '');
  const [originalLongitude] = useState<string>(customer.longitude || '');
  const [originalAddress] = useState<string>(customer.address || '');
  const [originalIsBulkOrder] = useState<'yes' | 'no'>(customer.is_bulk_order ? 'yes' : 'no');
  const [latitude, setLatitude] = useState<string>(customer.latitude || '');
  const [longitude, setLongitude] = useState<string>(customer.longitude || '');
  const [address, setAddress] = useState<string>(customer.address || '');
  const [isBulkOrder, setIsBulkOrder] = useState<'yes' | 'no'>(customer.is_bulk_order ? 'yes' : 'no');

  const latValid = COORD_REGEX.test(latitude.trim());
  const lngValid = COORD_REGEX.test(longitude.trim());
  const latError = latitude.trim() !== '' && !latValid;
  const lngError = longitude.trim() !== '' && !lngValid;
  const isValid = latValid && lngValid;
  const hasChanged =
    latitude.trim() !== originalLatitude.trim() ||
    longitude.trim() !== originalLongitude.trim() ||
    address.trim() !== originalAddress.trim() ||
    isBulkOrder !== originalIsBulkOrder;

  const save = () => {
    if (!isValid || !hasChanged) return;
    onClose({
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      address: address.trim() || undefined, // a cleared address is dropped from the JSON → cannot be cleared
      is_bulk_order: isBulkOrder === 'yes',
    });
  };

  return (
    <div className="update-location-dialog" role="dialog">
      <IconButton className="close-btn" aria-label="Close" onClick={() => onClose()}>
        <span className="material-icons">close</span>
      </IconButton>

      <div className="dialog-header">
        <h2 className="dialog-title">
          <span className="material-icons title-icon">place</span>
          Update Customer Location
        </h2>
        <p className="dialog-subtitle">
          {customer.customer_name || customer.business_name} <span className="uid-tag">UID: {customer.customer_unique_id}</span>
        </p>
      </div>

      <DialogContent sx={{ p: 0, overflow: 'visible' }}>
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Latitude <span className="required">*</span></label>
            <input type="text" className={`field-input${latError ? ' field-input--error' : ''}`} placeholder="e.g. 28.431589" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            {latError && <span className="field-error">Format: digits.digits (e.g. 28.431589). No spaces or letters.</span>}
          </div>
          <div className="form-field">
            <label className="field-label">Longitude <span className="required">*</span></label>
            <input type="text" className={`field-input${lngError ? ' field-input--error' : ''}`} placeholder="e.g. 77.088234" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            {lngError && <span className="field-error">Format: digits.digits (e.g. 77.088234). No spaces or letters.</span>}
          </div>
          <div className="form-field full-width">
            <label className="field-label">Address</label>
            <textarea className="field-input" rows={2} placeholder="Full delivery address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="form-field full-width">
            <label className="field-label">Bulk Order Customer</label>
            <select className="field-input" value={isBulkOrder} onChange={(e) => setIsBulkOrder(e.target.value as 'yes' | 'no')}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
      </DialogContent>

      <div className="dialog-footer">
        <span className="spacer" />
        <Button variant="outlined" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" disabled={!isValid || !hasChanged} onClick={save} startIcon={<span className="material-icons">save</span>}>
          Save
        </Button>
      </div>
    </div>
  );
}
