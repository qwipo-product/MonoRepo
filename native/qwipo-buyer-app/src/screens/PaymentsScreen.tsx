import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, EmptyState, ScreenHeader } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { formatInrExact } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronRight, CreditCard } from '../lib/icons';
import { PAYMENT_VENDORS, GATEWAY_LABEL, type PaymentVendor } from '../data/payments';

export function PaymentsScreen({ onBack, onOpenVendor }: { onBack: () => void; onOpenVendor: (vendorId: string) => void }) {
  const [noGateway, setNoGateway] = useState<PaymentVendor | null>(null);
  const open = (v: PaymentVendor) => (v.gateways.length === 0 ? setNoGateway(v) : onOpenVendor(v.id));

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Payments" onBack={onBack} />
      {PAYMENT_VENDORS.length === 0 ? (
        <EmptyState icon={<CreditCard size={28} color={colors.foregroundSecondary} />} title="No Payments Found" description="You have no payment gateways available at this time." />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
          {PAYMENT_VENDORS.map((v) => (
            <Pressable key={v.id} onPress={() => open(v)} className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3" style={shadows.sm}>
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
                <Text className="text-lg font-bold text-primary">{v.logo}</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{v.name}</Text>
                <Text className="mt-0.5 text-xs text-foreground-secondary">Outstanding <Text className="font-semibold text-foreground">{formatInrExact(v.outstandingAmount)}</Text></Text>
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  {v.gateways.length ? (
                    v.gateways.map((g) => (
                      <View key={g} className="rounded-md bg-muted px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-foreground-secondary">{GATEWAY_LABEL[g]}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-[11px] font-medium text-warning-foreground">No gateways configured</Text>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color={colors.foregroundSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Sheet open={!!noGateway} onClose={() => setNoGateway(null)} title="No gateways found" subtitle={noGateway?.name} footer={<Button fullWidth onPress={() => setNoGateway(null)}>OK</Button>}>
        <Text className="text-sm text-foreground-secondary">No payment gateways are configured for this vendor yet. Please try another vendor.</Text>
      </Sheet>
    </View>
  );
}
