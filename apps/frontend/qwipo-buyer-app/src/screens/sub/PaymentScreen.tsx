import { Icon, StatusBar } from '../../components/Icons';

export default function PaymentScreen({ onBack }: any) {
  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>Payments</h1>
          </div>
        </div>

        <div className="empty-state-page">
          <div className="empty-state-icon-box">
            <Icon.CreditCard size={36} />
          </div>
          <div className="empty-state-title">No Payments Found</div>
          <div className="empty-state-sub">You have no payment gateways available at this time.</div>
        </div>
      </div>
    </>
  );
}
