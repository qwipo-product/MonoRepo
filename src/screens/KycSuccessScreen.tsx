export default function KycSuccessScreen({ onCallSupport, onPlaceOrder }: any) {
  return (
    <div className="auth-screen kyc-success-screen">
      <div className="kyc-success-body">
        <div className="kyc-success-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="kyc-success-title">Congratulations! 🎉</h1>
        <p className="kyc-success-sub">
          Your KYC is confirmed
          <br />
          You are all set and you're now eligible to place orders seamlessly on our app
          <br />
          Start shopping now!
        </p>
      </div>

      <div className="kyc-success-footer">
        <button className="kyc-success-btn" onClick={onCallSupport}>
          Call Customer Support
        </button>
        <button className="kyc-success-btn" onClick={onPlaceOrder}>
          Place Order
        </button>
      </div>
    </div>
  );
}
