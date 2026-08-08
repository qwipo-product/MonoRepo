import { useState } from 'react';
import { Plus, ChevronRight, MapPin, Truck, Check } from 'lucide-react';
import { savedAddresses as initial } from '../../data';
import StatusBar from '../../components/StatusBar';
import ScreenHeader from '../../components/ScreenHeader';
import AddAddressSheet from '../../components/AddAddressSheet';

export default function AddressesScreen({ onBack, onSaved }: any) {
  const [addresses, setAddresses] = useState(initial as any[]);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState('');

  const setDefault = (id: string) => {
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    setToast('Address updated successfully');
    setTimeout(() => onSaved?.(), 1100);
  };
  const handleSave = (next: any) => {
    setAddresses((prev) => [{ ...next, id: `addr${prev.length + 1}`, isDefault: prev.length === 0 }, ...prev]);
    setAddOpen(false);
  };

  return (
    <div className="relative flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Saved addresses" subtitle={`${addresses.length} delivery locations`} onBack={onBack} />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <button onClick={() => setAddOpen(true)} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3.5 text-left">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block text-sm font-semibold">Add new address</span><span className="block text-xs text-muted-foreground">Save a new delivery location</span></span>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {addresses.map((a) => (
          <div key={a.id} className={`rounded-xl border bg-card p-3 shadow-sm ${a.isDefault ? 'border-primary' : 'border-border'}`}>
            <div className="flex gap-3">
              <span className="text-2xl">{a.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{a.line1}</div>
                <div className="text-xs text-muted-foreground">{a.line2}, {a.city}, {a.state}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {a.pincode}</span>
              {a.isDefault ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><Truck className="h-3 w-3" /> Delivering here</span>
              ) : (
                <button onClick={() => setDefault(a.id)} className="text-xs font-medium text-primary">Set as default</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {addOpen && <AddAddressSheet onClose={() => setAddOpen(false)} onSave={handleSave} />}
      {toast && (
        <div className="absolute inset-x-0 bottom-6 mx-auto flex w-fit items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg" role="status">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}
    </div>
  );
}
