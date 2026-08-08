import { Clock, Mail, Phone, MapPin } from 'lucide-react';
import StatusBar from '../../components/StatusBar';
import ScreenHeader from '../../components/ScreenHeader';

const INFO = [
  { icon: Clock, label: 'Office Timing', value: '09:00 AM to 6:00 PM - IST' },
  { icon: Mail, label: 'Email Address', value: 'info@qwipo.com' },
  { icon: Phone, label: 'Customer Care Number', value: '9121222836' },
];

export default function HelpScreen({ onBack }: any) {
  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Contact Us" onBack={onBack} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-center text-sm text-muted-foreground">If you have any query or need any further help</p>
        <img src="/brand/qwipo-logo.svg" alt="Qwipo" className="mx-auto h-8" />

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {INFO.map(({ icon: Icon, label, value }, i) => (
            <div key={label} className={`flex items-center gap-3 p-3.5 ${i > 0 ? 'border-t border-border' : ''}`}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4.5 w-4.5" /></span>
              <span><span className="block text-xs text-muted-foreground">{label}</span><span className="block text-sm font-medium">{value}</span></span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="text-sm font-semibold">Your Business Advisor</div>
          <div className="mt-2 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1"><span className="block text-sm font-medium">Vinodkumar Musku</span><span className="block text-xs text-muted-foreground">9100466765</span></span>
            <a href="tel:9100466765" aria-label="Call business advisor" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Phone className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </div>
  );
}
