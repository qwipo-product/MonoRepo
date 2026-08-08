import { CreditCard } from 'lucide-react';
import StatusBar from '../../components/StatusBar';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';

export default function PaymentScreen({ onBack }: any) {
  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Payments" onBack={onBack} />
      </div>
      <EmptyState icon={CreditCard} title="No Payments Found" sub="You have no payment gateways available at this time." />
    </div>
  );
}
