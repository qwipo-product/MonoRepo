// Port of <app-move-rfp-dialog> (spec 05 §1.4.7): pick the returned orders to send back for re-delivery.
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { ngNumber } from '../tripUtils';
import './TripDialogs.css';

export interface MoveRfpOrder {
  stopNo: number;
  customerName: string;
  orderCount: number;
  amount: number;
  returnReason: string | null;
  orderIds: string[];
  rtoReasonId: number | null;
}
export interface MoveRfpData {
  totalReturnedCount: number;
  eligibleCount: number;
  orders: MoveRfpOrder[];
}

interface Props {
  data: MoveRfpData;
  onClose: (result?: { confirmed: true; orderIds: string[] }) => void;
}

const defaultSelection = (orders: MoveRfpOrder[]) => new Set(orders.map((o, i) => (o.rtoReasonId === 151 ? -1 : i)).filter((i) => i >= 0));

export default function MoveRfpDialog({ data, onClose }: Props) {
  const [selected, setSelected] = useState<Set<number>>(() => defaultSelection(data.orders));
  const allSelected = selected.size === data.orders.length;

  // With a 151 row present the header checkbox can never select everything (as-built).
  const toggleAll = () => setSelected(allSelected ? new Set() : defaultSelection(data.orders));
  const toggleOrder = (i: number) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const confirm = () => {
    const orderIds = data.orders.filter((_, i) => selected.has(i)).flatMap((o) => o.orderIds);
    onClose({ confirmed: true, orderIds });
  };

  return (
    <Dialog open onClose={() => onClose()} className="rfp-dialog-container trip-dialog" disableEnforceFocus PaperProps={{ className: 'trip-dialog-paper', style: { width: 700, maxWidth: '95vw' } }}>
      <div className="dialog-header">
        <h2 className="dialog-title">Move to RFP</h2>
        <button className="close-btn" onClick={() => onClose()}><i className="fas fa-times" /></button>
      </div>
      <div className="dialog-body">
        <p className="rfp-message"> Out of {data.totalReturnedCount} returns, following {data.eligibleCount} returns to Re-Delivery: </p>
        <div className="rfp-table-container">
          <table className="rfp-table">
            <thead>
              <tr>
                <th className="checkbox-col"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                <th className="text-left">Customer Name</th>
                <th className="text-right">Amount</th>
                <th>Return Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o, i) => (
                <tr key={i} className={selected.has(i) ? 'selected' : ''}>
                  <td className="checkbox-col"><input type="checkbox" checked={selected.has(i)} onChange={() => toggleOrder(i)} /></td>
                  <td className="text-left">{o.customerName}</td>
                  <td className="text-right">{'₹ ' + (ngNumber(o.amount) ?? '')}</td>
                  <td>{o.returnReason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="dialog-footer">
        <button className="cancel-btn" onClick={() => onClose()}>Cancel</button>
        <button className="confirm-btn primary-btn" disabled={selected.size === 0} onClick={confirm}>
          <i className="fas fa-undo" /> Return to Re-Delivery ({selected.size})
        </button>
      </div>
    </Dialog>
  );
}
