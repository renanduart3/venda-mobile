import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getPremiumStatus, checkSubscriptionFromDatabase, type PremiumStatus } from '@/lib/premium';
import { initializeIAP, getProducts, purchaseSubscription, restorePurchases, PRODUCT_IDS, type Product } from '@/lib/iap';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PremiumPage() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({ isPremium: false });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setInitializing(true);
      await initializeIAP();
      const availableProducts = await getProducts();
      setProducts(availableProducts);
      const status = await getPremiumStatus();
      setPremiumStatus(status);

      if (!status.isPremium) {
        await checkSubscriptionFromDatabase();
        const updatedStatus = await getPremiumStatus();
        setPremiumStatus(updatedStatus);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setInitializing(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      setLoading(true);
      const result = await purchaseSubscription(productId);

      if (result.success) {
        Alert.alert('Sucesso', 'Assinatura premium ativada com sucesso!');
        const status = await getPremiumStatus();
        setPremiumStatus(status);
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível processar a compra.');
      }
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar a compra.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const result = await restorePurchases();

      if (result.success) {
        await checkSubscriptionFromDatabase();
        const status = await getPremiumStatus();
        setPremiumStatus(status);

        if (status.isPremium) {
          Alert.alert('Sucesso', 'Assinatura restaurada com sucesso!');
        } else {
          Alert.alert('Aviso', 'Nenhuma assinatura ativa encontrada.');
        }
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível restaurar as compras.');
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao restaurar as compras.');
    } finally {
      setRestoring(false);
    }
  };

  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContainer: { padding: 20 },
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
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: '#fff',
      marginLeft: 6
    },
    expiryText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 8
    },
    restoreButton: {
      marginTop: 20,
      alignItems: 'center'
    },
    restoreText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background
    },
    infoText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 20,
      lineHeight: 18
    },
  });
  // Increase spacer: minimum 24, cap 36, add +12 to inset for comfort
  const bottomSpacer = Math.max(24, Math.min((insets.bottom || 0) + 12, 36));

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Carregando planos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.header}>Planos</Text>
        </View>

        {premiumStatus.isPremium && (
          <Card style={styles.section}>
            <View style={styles.planRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.planTitle}>Status Atual</Text>
                  <View style={{ marginLeft: 12 }}>
                    <View style={styles.statusBadge}>
                      <Check size={14} color="#fff" />
                      <Text style={styles.statusText}>Premium Ativo</Text>
                    </View>
                  </View>
                </View>
                {premiumStatus.expiryDate && (
                  <Text style={styles.expiryText}>
                    Válido até: {formatExpiryDate(premiumStatus.expiryDate)}
                  </Text>
                )}
                {premiumStatus.productId && (
                  <Text style={styles.expiryText}>
                    Plano: {premiumStatus.productId === PRODUCT_IDS.MONTHLY ? 'Mensal' : 'Anual'}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.section}>
          <View style={styles.planRow}>
            <View>
              <Text style={styles.planTitle}>Plano Gratuito</Text>
              <Text style={styles.planDesc}>Gestão comercial básica - sem proteção de dados</Text>
            </View>
            <Text style={styles.planDesc}>Grátis</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.planRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planTitle}>Premium</Text>
              <Text style={styles.planDesc}>
                Backup automático, relatórios detalhados e exportação de dados
              </Text>
            </View>
          </View>

          {products.length > 0 && (
            <View style={styles.subscribeRow}>
              <View style={styles.subscribeBtn}>
                <Button
                  title={loading ? 'Processando...' : `${products[0].localizedPrice}/mês`}
                  onPress={() => handlePurchase(PRODUCT_IDS.MONTHLY)}
                  disabled={loading || restoring || premiumStatus.isPremium}
                />
              </View>
              <View style={styles.subscribeBtnLast}>
                <Button
                  title={loading ? 'Processando...' : `${products[1]?.localizedPrice || 'R$ 99,90'}/ano`}
                  onPress={() => handlePurchase(PRODUCT_IDS.ANNUAL)}
                  disabled={loading || restoring || premiumStatus.isPremium}
                />
              </View>
            </View>
          )}
        </Card>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={loading || restoring}
        >
          <Text style={styles.restoreText}>
            {restoring ? 'Restaurando...' : 'Restaurar Compras'}
          </Text>
        </TouchableOpacity>

        <Card style={styles.section}>
          <Text style={styles.planTitle}>Por que escolher o Premium?</Text>
          <Text style={styles.planDesc}>
            • <Text style={{fontWeight: 'bold'}}>Backup automático:</Text> Seus dados ficam seguros na nuvem{'\n'}
            • <Text style={{fontWeight: 'bold'}}>Relatórios detalhados:</Text> Análises completas em PDF{'\n'}
            • <Text style={{fontWeight: 'bold'}}>Exportação de dados:</Text> Backup manual em CSV{'\n'}
            • <Text style={{fontWeight: 'bold'}}>Sincronização na nuvem:</Text> Acesso aos dados de qualquer lugar
          </Text>
        </Card>

        <Text style={styles.infoText}>
          As assinaturas são gerenciadas através da sua conta Google Play ou App Store.
          Você pode cancelar a qualquer momento através das configurações da sua conta.
        </Text>
      </ScrollView>
      {/* Discreet dark bottom area only for manage plan screen */}
      <View style={{ backgroundColor: colors.bottombar, height: bottomSpacer }} />
    </View>
  );
}
