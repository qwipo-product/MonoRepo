// Port of <app-update-helper-dialog> (spec 05 §1.4.3).
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import Swal from 'sweetalert2';
import { logisticsOrdersService as svc, type AvailablePerson } from '../../../api/services/logisticsOrders.service';
import './TripDialogs.css';

interface Props {
  /** API orderId (trip number). */
  logisticsOrderId: string;
  onClose: (result?: { success: true }) => void;
}

export default function UpdateHelperDialog({ logisticsOrderId, onClose }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [helpers, setHelpers] = useState<AvailablePerson[]>([]);
  const [selectedHelper, setSelectedHelper] = useState<AvailablePerson | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setIsLoading(true);
      const data = await svc.getAvailableHelpers(logisticsOrderId);
      if (!alive) return;
      setHelpers(data?.helpers || []);
      setIsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [logisticsOrderId]);

  const submit = async () => {
    if (!selectedHelper) return;
    setIsSubmitting(true);
    try {
      const res = await svc.assignHelper({
        logisticsOrderId,
        helperId: selectedHelper.id,
        helperName: selectedHelper.name,
        helperMobileNumber: selectedHelper.phone,
      });
      if (res && res.success !== false) {
        Swal.fire({ title: 'Success', text: `Helper Updated to ${selectedHelper.name} successfully!`, icon: 'success', confirmButtonColor: '#28a745' });
        onClose({ success: true });
      } else {
        Swal.fire({ title: 'Error', text: res?.error?.message || 'Failed to assign helper. Please try again.', icon: 'error', confirmButtonColor: '#dc3545' });
      }
    } catch (e) {
      console.error('Error assigning helper:', e);
      Swal.fire({ title: 'Error', text: 'Failed to assign helper. Please try again.', icon: 'error', confirmButtonColor: '#dc3545' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={() => onClose()} className="helper-dialog-container trip-dialog" disableEnforceFocus PaperProps={{ className: 'trip-dialog-paper', style: { width: 500, maxWidth: '95vw' } }}>
      <div className="dialog-header">
        <h2 className="dialog-title">Update Helper</h2>
        <button className="close-btn" onClick={() => onClose()}><i className="fas fa-times" /></button>
      </div>
      <div className="dialog-body">
        {isLoading ? (
          <div className="loading-text">Loading available helpers...</div>
        ) : (
          <div className="form-group">
            <label htmlFor="helper">Select Helper <span className="required">*</span></label>
            <select id="helper" defaultValue="" onChange={(e) => setSelectedHelper(helpers.find((h) => h.id === e.target.value))}>
              <option value="" disabled>Select a helper</option>
              {helpers.map((h) => (
                <option key={h.id} value={h.id}>{`${h.name} (${h.phone})`}</option>
              ))}
            </select>
            {!isLoading && helpers.length === 0 && <div className="no-data-text">No helpers available for this order.</div>}
          </div>
        )}
      </div>
      <div className="dialog-footer">
        <button className="cancel-btn" onClick={() => onClose()}>Cancel</button>
        <button className="primary-btn" disabled={!selectedHelper || isSubmitting} onClick={submit}>
          {isSubmitting ? (<><i className="fas fa-spinner fa-spin" /> Updating...</>) : (<><i className="fas fa-user-check" /> Update</>)}
        </button>
      </div>
    </Dialog>
  );
}
