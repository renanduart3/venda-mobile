import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { enablePremium, isPremium } from '@/lib/premium';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function PremiumPage() {
  const { colors } = useTheme();
  const router = useRouter();

  const activate = async (type: 'monthly' | 'yearly') => {
    // demo activation — in production integrate IAP
    const ok = await enablePremium();
    if (ok) {
      Alert.alert('Premium Ativado', `Premium ativado (${type})`);
      router.back();
    } else {
      Alert.alert('Erro', 'Não foi possível ativar o premium.');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backButton: { marginRight: 12 },
    header: { fontSize: 20, fontFamily: 'Inter-Bold', color: colors.text },
    section: { marginBottom: 16 },
    planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text },
    planDesc: { fontSize: 13, fontFamily: 'Inter-Regular', color: colors.textSecondary },
    subscribeRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
    subscribeBtn: { flex: 1, marginRight: 8 },
    subscribeBtnLast: { flex: 1 },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.header}>Planos</Text>
      </View>

      <Card style={styles.section}>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planTitle}>Free</Text>
            <Text style={styles.planDesc}>Todas as funcionalidades, sem relatórios, exportar e scan.</Text>
          </View>
          <Text style={styles.planDesc}>Grátis</Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planTitle}>Premium</Text>
            <Text style={styles.planDesc}>Relatórios (PDF), exportar CSV e escanear produtos para venda.</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.planTitle}>$3 / mês</Text>
            <Text style={styles.planDesc}>ou $29.99 / ano</Text>
          </View>
        </View>
        <View style={styles.subscribeRow}>
          <View style={styles.subscribeBtn}>
            <Button title="Assinar Mensal ($3)" onPress={() => activate('monthly')} />
          </View>
          <View style={styles.subscribeBtnLast}>
            <Button title="Assinar Anual ($29.99)" onPress={() => activate('yearly')} />
          </View>
        </View>
      </Card>

      <View style={{ marginTop: 20 }}>
        <Text style={{ color: colors.textSecondary }}>
          Preços mostrados como exemplos para USD/EUR/BRL. Para internacionalizar, os valores e textos devem ser traduzidos e os métodos de pagamento configurados por região.
        </Text>
      </View>
    </View>
  );
}
