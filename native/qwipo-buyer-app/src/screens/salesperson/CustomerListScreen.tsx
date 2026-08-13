import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { EmptyState, ScreenHeader, SearchField } from '../../components/ui';
import { ShopCard } from './ShopCard';
import { colors, shadows } from '../../lib/theme';
import { Users } from '../../lib/icons';
import { CUSTOMERS } from '../../data/salesperson';
import { formatDate } from '../../lib/date';

export function CustomerListScreen({ onBack, onOpenCustomer }: { onBack: () => void; onOpenCustomer: (customerId: string) => void }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const list = query ? CUSTOMERS.filter((c) => c.businessName.toLowerCase().includes(query) || c.mobile.includes(query)) : CUSTOMERS;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Customers" onBack={onBack} />
      <View className="border-b border-border bg-card px-3 py-2.5">
        <SearchField value={q} onChangeText={setQ} placeholder="Search by business or mobile" />
      </View>
      {list.length === 0 ? (
        <EmptyState icon={<Users size={28} color={colors.foregroundSecondary} />} title="No Customers Found" description={query ? 'No customer matches your search.' : 'Please contact your manager.'} />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
          <View className="rounded-lg border border-border bg-card px-4 py-2.5" style={shadows.sm}>
            <Text className="text-sm font-medium text-foreground">Total customers: <Text className="font-semibold">{CUSTOMERS.length}</Text></Text>
          </View>
          {list.map((c, i) => (
            <ShopCard
              key={c.id}
              badge={i + 1}
              title={c.businessName}
              subtitle={c.name}
              address={c.address}
              mobile={c.mobile}
              lat={c.lat}
              lng={c.lng}
              footer={<Text className="text-xs font-medium text-success-foreground">{formatDate(c.lastOrderDate)}</Text>}
              onOpen={() => onOpenCustomer(c.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
