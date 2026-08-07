export default function OrderConfirmationScreen({ onBackToHome }: any) {
  return (
    <div className="screen-body order-confirmation-screen">
      <div className="top-bar">
        <div className="top-title">
          <h1>Order Confirmation</h1>
        </div>
      </div>

      <div className="oc-body">
        <div className="oc-title">Order Confirmation</div>
        <div className="oc-check">
          <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="oc-sub">Your order has been placed successfully!</p>
      </div>

      <div className="oc-footer">
        <button className="oc-home-btn" onClick={onBackToHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
