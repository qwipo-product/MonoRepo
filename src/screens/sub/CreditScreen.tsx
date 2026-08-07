import { Icon, StatusBar } from '../../components/Icons';

export default function CreditScreen({ onBack }: any) {
  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>Credit Partners</h1>
          </div>
        </div>

        <div className="empty-state-page">
          <div className="empty-state-icon-box">
            <Icon.Users size={36} />
          </div>
          <div className="empty-state-title">No Credit Partners Found</div>
          <div className="empty-state-sub">You don't have any credit partners available at this time.</div>
        </div>
      </div>
    </>
  );
}
