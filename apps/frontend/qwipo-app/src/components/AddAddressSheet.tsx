import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { Button } from '@mockups/ui';

const ctrl = 'h-11 w-full rounded-md border border-border bg-input-background px-3 text-sm outline-none placeholder:text-muted-foreground';

/* Add-address sheet — minimal delivery-location form. */
export default function AddAddressSheet({ onClose, onSave }: { onClose: () => void; onSave: (a: any) => void }) {
  const [f, setF] = useState({ line1: '', line2: '', city: '', state: '', pincode: '' });
  const valid = f.line1.trim() && f.city.trim() && /^\d{6}$/.test(f.pincode);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <BottomSheet title="Add new address" onClose={onClose}>
      <div className="space-y-3">
        <input className={ctrl} placeholder="Address line 1" value={f.line1} onChange={(e) => set('line1', e.target.value)} />
        <input className={ctrl} placeholder="Address line 2 (optional)" value={f.line2} onChange={(e) => set('line2', e.target.value)} />
        <div className="flex gap-3">
          <input className={ctrl} placeholder="City" value={f.city} onChange={(e) => set('city', e.target.value)} />
          <input className={ctrl} placeholder="State" value={f.state} onChange={(e) => set('state', e.target.value)} />
        </div>
        <input className={ctrl} inputMode="numeric" maxLength={6} placeholder="Pincode" value={f.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} />
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => onSave({ ...f, icon: '📍' })}>Save address</Button>
      </div>
    </BottomSheet>
  );
}
