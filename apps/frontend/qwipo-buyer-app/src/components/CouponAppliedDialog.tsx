import { Icon } from './Icons';

export default function CouponAppliedDialog({ coupon, onClose }: any) {
  return (
    <div className="dlg-backdrop" onClick={onClose}>
      <div
        className="coupon-dlg-card"
        role="dialog"
        aria-labelledby="coupon-dlg-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="coupon-dlg-check">
          <Icon.Check />
        </div>
        <div className="coupon-dlg-title" id="coupon-dlg-title">
          Coupon applied successfully
        </div>
        <div className="coupon-dlg-code">‘{coupon?.code}’</div>
        <div className="coupon-dlg-sub">{coupon?.title}</div>
        <button className="coupon-dlg-btn" onClick={onClose}>
          Great
        </button>
      </div>
    </div>
  );
}
