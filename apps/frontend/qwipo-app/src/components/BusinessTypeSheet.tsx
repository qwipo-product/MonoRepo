import { Check } from 'lucide-react';
import BottomSheet from './BottomSheet';

export const BUSINESS_TYPES = [
  'Kirana',
  'Restaurant',
  'Caterers',
  'Tiffin Centers',
  'PG/Hostel',
  'Wholesale',
  'Bakery',
  'Sweet House',
  'Medicals',
  'Supermarket',
];

/* Business-type picker sheet — shared by Onboarding and Complete KYC. */
export default function BusinessTypeSheet({
  value,
  onClose,
  onSelect,
}: {
  value: string;
  onClose: () => void;
  onSelect: (t: string) => void;
}) {
  return (
    <BottomSheet title="Business Type" onClose={onClose}>
      <div className="space-y-1">
        {BUSINESS_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-sm ${
              t === value ? 'bg-muted font-medium text-primary' : 'text-foreground hover:bg-muted'
            }`}
          >
            <span>{t}</span>
            {t === value && <Check className="h-4 w-4" />}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
