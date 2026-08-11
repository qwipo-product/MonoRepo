import { Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState, ScreenHeader } from '../components/ui';
import { formatInrExact } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronRight, Users } from '../lib/icons';
import { CREDIT_PARTNERS, type CreditPartner } from '../data/payments';

export function CreditPartnersScreen({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Credit Partners" onBack={onBack} />
      {CREDIT_PARTNERS.length === 0 ? (
        <EmptyState icon={<Users size={28} color={colors.foregroundSecondary} />} title="No Credit Partners Found" description="You don't have any credit partners available at this time." />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
          {CREDIT_PARTNERS.map((p) => (
            <PartnerCard key={p.id} partner={p} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function PartnerCard({ partner: p }: { partner: CreditPartner }) {
  const usedPct = p.totalCreditLimit ? Math.min(100, (p.usedCreditLimit / p.totalCreditLimit) * 100) : 0;
  const soon = p.daysDifference <= 3;
  return (
    <View className="overflow-hidden rounded-lg border border-border bg-card" style={shadows.sm}>
      <View className="flex-row items-center gap-3 p-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
          <Text className="text-lg">{p.logo}</Text>
        </View>
        <Text className="min-w-0 flex-1 text-sm font-semibold text-foreground">{p.name}</Text>
      </View>

      <View className="border-t border-border p-3">
        <Row label="Total limit" value={formatInrExact(p.totalCreditLimit)} />
        <Row label="Limit used" value={formatInrExact(p.usedCreditLimit)} />
        <Row label="Balance" value={formatInrExact(p.currentBalance)} strong />
        <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <View className="h-full rounded-full bg-primary" style={{ width: `${usedPct}%` }} />
        </View>
      </View>

      <View className="flex-row items-center justify-between gap-3 border-t border-border p-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs text-foreground-secondary">Upcoming due <Text className="font-semibold text-foreground">{formatInrExact(p.amountDue)}</Text></Text>
          <Text className={soon ? 'text-xs font-medium text-warning-foreground' : 'text-xs text-foreground-secondary'}>Due in {p.daysDifference} {p.daysDifference === 1 ? 'day' : 'days'}</Text>
        </View>
        <Pressable className="flex-row items-center gap-0.5">
          <Text className="text-sm font-semibold text-primary">Pay Now</Text>
          <ChevronRight size={15} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3 py-0.5">
      <Text className="text-xs text-foreground-secondary">{label}</Text>
      <Text className={strong ? 'text-sm font-semibold text-foreground' : 'text-sm font-medium text-foreground'}>{value}</Text>
    </View>
  );
}
