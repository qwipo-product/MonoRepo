import { Users } from 'lucide-react';
import StatusBar from '../../components/StatusBar';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';

export default function CreditScreen({ onBack }: any) {
  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Credit Partners" onBack={onBack} />
      </div>
      <EmptyState icon={Users} title="No Credit Partners Found" sub="You don't have any credit partners available at this time." />
    </div>
  );
}
