export default function CancelOrderDialog({ orderId, onClose, onConfirm }: any) {
  return (
    <div className="dlg-backdrop" onClick={onClose}>
      <div
        className="cancel-dlg-card"
        role="dialog"
        aria-labelledby="cancel-dlg-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cancel-dlg-title" id="cancel-dlg-title">
          Do you want to cancel this order?
        </div>

        <div className="cancel-dlg-actions">
          <button className="cancel-dlg-btn" onClick={onClose}>
            No
          </button>
          <button className="cancel-dlg-btn primary" onClick={() => onConfirm?.({ orderId })}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
