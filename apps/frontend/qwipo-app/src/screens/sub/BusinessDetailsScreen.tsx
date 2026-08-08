import { customer } from '../../data';
import StatusBar from '../../components/StatusBar';
import ScreenHeader from '../../components/ScreenHeader';

export default function BusinessDetailsScreen({ onBack }: any) {
  const c: any = customer;
  const fields = [
    { label: 'Shop Name', required: true, value: c.businessName },
    { label: 'Owner Name', required: false, value: c.name },
    { label: 'Mobile Number', required: true, value: c.phone },
    { label: 'Address', required: true, value: c.location },
    { label: 'GSTIN Number (optional)', required: false, value: c.gst },
  ];
  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Business Details" onBack={onBack} />
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {fields.map((f) => (
          <div key={f.label} className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="text-xs text-muted-foreground">{f.label}{f.required && <span className="text-destructive"> *</span>}</div>
            <div className="mt-0.5 text-sm font-medium">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
