/* Brand lockup at the top of Login / OTP — Qwipo mark + "powered by DigiDukaan". */
export default function AuthBrand() {
  return (
    <div className="flex flex-col items-center gap-3">
      <img src="/brand/qwipo-primary.svg" alt="Qwipo" className="w-32" />
      <img
        src="/brand/digidukaan-logo.svg"
        alt="Powered by ONDC DigiDukaan"
        className="h-6"
      />
    </div>
  );
}
