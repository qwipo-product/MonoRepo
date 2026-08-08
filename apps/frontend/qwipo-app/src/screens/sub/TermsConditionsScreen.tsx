import { Phone } from 'lucide-react';
import StatusBar from '../../components/StatusBar';
import ScreenHeader from '../../components/ScreenHeader';

const CLAUSES = [
  ['1. Acceptance', 'By using the Qwipo platform you agree to these terms and our privacy policy.'],
  ['2. Orders & Delivery', 'Orders are subject to seller minimum order value and stock. Delivery windows are indicative.'],
  ['3. Pricing', 'Prices are set by sellers and may change without notice. Taxes apply as per GST rules.'],
  ['4. Cancellations', 'Orders may be cancelled before the seller confirms dispatch. Refunds follow our policy.'],
  ['5. Liability', 'Qwipo connects buyers and sellers and is not liable for seller-side quality disputes.'],
];

export default function TermsConditionsScreen({ onBack }: any) {
  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Terms & Conditions" onBack={onBack} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <img src="/brand/qwipo-logo.svg" alt="Qwipo" className="h-7" />
        <div className="space-y-3">
          {CLAUSES.map(([head, body]) => (
            <div key={head} className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className="text-sm font-semibold">{head}</div>
              <div className="mt-1 text-sm text-muted-foreground">{body}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
          <Phone className="h-4 w-4 text-muted-foreground" /> +91 9121222836
        </div>
        <p className="pb-2 text-center text-xs text-muted-foreground">© Qwipo · B2B Commerce</p>
      </div>
    </div>
  );
}
