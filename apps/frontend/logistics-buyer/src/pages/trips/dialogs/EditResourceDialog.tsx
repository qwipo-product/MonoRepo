// Port of <app-edit-resource-dialog> (spec 05 §1.4.4): vehicle + driver with the capacity acknowledgement.
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import Swal from 'sweetalert2';
import { logisticsOrdersService as svc, type AvailablePerson, type AvailableVehicle } from '../../../api/services/logisticsOrders.service';
import './TripDialogs.css';

export interface EditResourceData {
  logisticsOrderId: string;
  currentVehicleId: string;
  currentVehicleRegNumber: string;
  currentDriverId: string;
  currentDriverPhone: string;
  tripVolumetricWeight: number | string;
}

interface Props {
  data: EditResourceData;
  onClose: (result?: { success: true; vehicle?: AvailableVehicle; driver?: AvailablePerson }) => void;
}

function capacityExceeded(vehicles: AvailableVehicle[], vehicleId: string, weight: number | string): boolean {
  const v = vehicles.find((x) => x.id === vehicleId);
  if (!v) return false;
  const cap = parseFloat(String(v.volumetricCapacityKg || v.weightCapacityKg || 0));
  const w = parseFloat(String(weight || 0));
  return cap > 0 && w > cap;
}

export default function EditResourceDialog({ data, onClose }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
  const [drivers, setDrivers] = useState<AvailablePerson[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [showCapacityWarning, setShowCapacityWarning] = useState(false);
  const [capacityAcknowledged, setCapacityAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setIsLoading(true);
      const [v, d] = await Promise.all([svc.getAvailableVehicles(data.logisticsOrderId), svc.getAvailableDrivers(data.logisticsOrderId)]);
      if (!alive) return;
      const vs = v?.vehicles || [];
      const ds = d?.drivers || [];
      setVehicles(vs);
      setDrivers(ds);
      const preV = vs.find((x) => x.id === data.currentVehicleId) || vs.find((x) => x.registrationNumber === data.currentVehicleRegNumber);
      const preD = ds.find((x) => x.id === data.currentDriverId) || ds.find((x) => x.phone === data.currentDriverPhone);
      const vid = preV ? preV.id : '';
      setVehicleId(vid);
      setDriverId(preD ? preD.id : '');
      setShowCapacityWarning(capacityExceeded(vs, vid, data.tripVolumetricWeight));
      setIsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [data]);

  const onVehicleChange = (id: string) => {
    setVehicleId(id);
    setCapacityAcknowledged(false);
    setShowCapacityWarning(capacityExceeded(vehicles, id, data.tripVolumetricWeight));
  };

  const canSubmit = !!vehicleId && !!driverId && !isSubmitting && !isLoading && (!showCapacityWarning || capacityAcknowledged);

  const submit = async () => {
    if (!canSubmit) return;
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    const driver = drivers.find((d) => d.id === driverId);
    setIsSubmitting(true);
    try {
      const res = await svc.assignResource({
        logisticsOrderId: data.logisticsOrderId,
        vehicleId,
        agentId: driverId,
        vehicleRegNumber: vehicle?.registrationNumber as string,
        vehicleVolumetricCapacityKg: vehicle?.volumetricCapacityKg || vehicle?.weightCapacityKg || 0,
        agentName: driver?.name as string,
        agentMobileNumber: driver?.phone as string,
      });
      if (res?.success === false) {
        Swal.fire({ title: 'Error', text: res?.error?.message || 'Failed to update resource. Please try again.', icon: 'error', confirmButtonColor: '#dc3545' });
      } else {
        // Anything but success === false (incl. a falsy response) counts as success — as-built.
        Swal.fire({ title: 'Success', text: 'Resources updated successfully.', icon: 'success', confirmButtonColor: '#28a745' });
        onClose({ success: true, vehicle, driver });
      }
    } catch (e) {
      console.error('Error updating resource:', e);
      Swal.fire({ title: 'Error', text: 'Failed to update resource. Please try again.', icon: 'error', confirmButtonColor: '#dc3545' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={() => onClose()} className="resource-dialog-container trip-dialog" disableEnforceFocus PaperProps={{ className: 'trip-dialog-paper', style: { width: 500, maxWidth: '95vw' } }}>
      <div className="dialog-header">
        <h2 className="dialog-title">Edit Resource</h2>
        <button className="close-btn" onClick={() => onClose()}><i className="fas fa-times" /></button>
      </div>
      <div className="dialog-body">
        <p className="dialog-subtitle">Update the vehicle and driver details for this trip.</p>
        {isLoading ? (
          <>
            {[0, 1].map((k) => (
              <div className="skeleton-group" key={k}>
                <div className="skeleton skeleton-label" />
                <div className="skeleton skeleton-select" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="vehicle">Select Vehicle <span className="required">*</span></label>
              <select id="vehicle" value={vehicleId} onChange={(e) => onVehicleChange(e.target.value)}>
                <option value="" disabled>Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{`${v.registrationNumber} - ${v.name}`}</option>
                ))}
              </select>
              {vehicles.length === 0 && <div className="no-data-text">No vehicles available for this order.</div>}
            </div>
            <div className="form-group">
              <label htmlFor="driver">Select Driver <span className="required">*</span></label>
              <select id="driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="" disabled>Select a driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{`${d.name} (${d.phone})`}</option>
                ))}
              </select>
              {drivers.length === 0 && <div className="no-data-text">No drivers available for this order.</div>}
            </div>
          </>
        )}
      </div>
      {showCapacityWarning && (
        <div className="capacity-warning">
          <label>
            <input type="checkbox" checked={capacityAcknowledged} onChange={(e) => setCapacityAcknowledged(e.target.checked)} />
            <span>I acknowledge that the trip weight exceeds the selected vehicle's capacity and accept the risks associated with this assignment.</span>
          </label>
        </div>
      )}
      <div className="dialog-footer">
        <button className="cancel-btn" onClick={() => onClose()}>Cancel</button>
        <button className="primary-btn" disabled={!canSubmit} onClick={submit}>
          {isSubmitting ? (<><i className="fas fa-spinner fa-spin" /> Updating...</>) : (<><i className="fas fa-save" /> Update Resource</>)}
        </button>
      </div>
    </Dialog>
  );
}
