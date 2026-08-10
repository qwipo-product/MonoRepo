import { ScrollView, View, Text, Pressable, Linking } from 'react-native';
import { Phone, Mail, MessageCircle, type LucideIcon } from 'lucide-react-native';
import { Header } from '../components/Header';
import { Card } from '../ui/Card';

const ROWS: { icon: LucideIcon; label: string; value: string; href: string }[] = [
  { icon: Phone, label: 'Call support', value: '+91 1800 123 4567', href: 'tel:+9118001234567' },
  { icon: Mail, label: 'Email us', value: 'support@qwipo.com', href: 'mailto:support@qwipo.com' },
  { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', href: 'https://wa.me/9118001234567' },
];

export function ContactScreen({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Contact Us" onBack={onBack} />
      <ScrollView contentContainerClassName="gap-3 p-3">
        {ROWS.map((r) => (
          <Pressable key={r.label} onPress={() => Linking.openURL(r.href)}>
            <Card className="flex-row items-center gap-3 p-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
                <r.icon size={18} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{r.label}</Text>
                <Text className="text-xs text-foreground-secondary">{r.value}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
