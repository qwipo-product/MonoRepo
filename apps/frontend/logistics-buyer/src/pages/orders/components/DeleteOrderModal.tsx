// Port of <app-delete-order-modal> (spec 01 §1.6 "Delete order flow").
import './DeleteOrderModal.css';

interface Props {
  /** The invoice number shown in the text (row.refOrderId || ""). */
  orderId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteOrderModal({ orderId, onConfirm, onCancel }: Props) {
  return (
    <div className="delete-order-modal-overlay" onClick={onCancel}>
      <div className="delete-order-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dom-header">
          <h3>Delete Order</h3>
        </div>
        <div className="dom-body">
          <p>
            Are you sure you want to delete order <strong className="font-semibold text-foreground">{orderId}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="dom-footer">
          <button className="btn btn-secondary" onClick={onCancel}>No, Keep Order</button>
          <button className="btn btn-danger" onClick={onConfirm}>Yes, Delete Order</button>
        </div>
      </div>
    </div>
  );
}
