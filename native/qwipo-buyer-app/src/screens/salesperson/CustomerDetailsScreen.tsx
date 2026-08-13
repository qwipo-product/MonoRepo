import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ScreenHeader, SegmentedControl } from '../../components/ui';
import { OrdersPanel, RecoPanel } from './customerPanels';
import { colors, shadows } from '../../lib/theme';
import { Phone, MapPin } from '../../lib/icons';
import type { Order } from '../../data/orders';
import { CUSTOMERS } from '../../data/salesperson';
import { formatDate } from '../../lib/date';

type Tab = 'info' | 'orders' | 'reco';

export function CustomerDetailsScreen({ customerId, onBack, onOpenOrder }: { customerId: string; onBack: () => void; onOpenOrder: (order: Order) => void }) {
  const c = CUSTOMERS.find((x) => x.id === customerId) ?? CUSTOMERS[0];
  const [tab, setTab] = useState<Tab>('info');

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={c.businessName} onBack={onBack} />
      <View className="border-b border-border bg-card px-3 py-2.5">
        <SegmentedControl<Tab> value={tab} onChange={setTab} options={[{ value: 'info', label: 'Info' }, { value: 'orders', label: 'Orders' }, { value: 'reco', label: 'Reco' }]} />
      </View>

      {tab === 'info' && (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16 }}>
          <View className="rounded-lg border border-border bg-card p-4" style={shadows.sm}>
            <Text className="text-sm font-semibold text-foreground">{c.businessName}</Text>
            <Text className="mt-0.5 text-xs text-foreground-secondary">{c.name}</Text>
            <View className="mt-2 flex-row items-start gap-2">
              <MapPin size={14} color={colors.foregroundSecondary} />
              <Text className="flex-1 text-xs text-foreground-secondary">{c.address}</Text>
            </View>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-md bg-muted py-2">
                <Phone size={14} color={colors.foreground} />
                <Text className="text-xs font-medium text-foreground">{c.mobile}</Text>
              </View>
              <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-md bg-muted py-2">
                <MapPin size={14} color={colors.foreground} />
                <Text className="text-xs font-medium text-foreground">Navigate</Text>
              </View>
            </View>
            <View className="mt-3 border-t border-border pt-3">
              <Text className="text-xs font-medium text-success-foreground">{formatDate(c.lastOrderDate)}</Text>
            </View>
          </View>
        </ScrollView>
      )}
      {tab === 'orders' && <OrdersPanel customerId={c.id} businessName={c.businessName} onOpenOrder={onOpenOrder} />}
      {tab === 'reco' && <RecoPanel customerId={c.id} />}
    </View>
  );
}
