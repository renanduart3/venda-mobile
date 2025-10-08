
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Switch, Linking
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { usePremium } from '@/contexts/PremiumContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  initializeIAP, 
  getProducts, 
  purchaseSubscription, 
  restorePurchases, 
  Product, 
  PRODUCT_IDS,
  endConnection
} from '@/lib/iap';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Star, Zap, PieChart } from 'lucide-react-native';
import { ScrollView } from 'react-native-gesture-handler';

const MANAGE_SUBSCRIPTION_URL = {
  android: 'https://play.google.com/store/account/subscriptions',
  ios: 'https://apps.apple.com/account/subscriptions',
};

export default function PremiumPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isPremium, premiumUntil, checkPremiumStatus } = usePremium();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        await initializeIAP();
        const availableProducts = await getProducts();
        if (isMounted) {
          setProducts(availableProducts);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de IAP:', error);
        Alert.alert('Erro', 'Não foi possível carregar os planos. Tente novamente mais tarde.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      endConnection();
    };
  }, []);

  const handlePurchase = async () => {
    const productId = billingCycle === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;
    const product = products.find(p => p.productId === productId);

    if (!product) {
      Alert.alert('Erro', 'Plano não disponível no momento. Tente novamente mais tarde.');
      return;
    }

    try {
      setLoading(true);
      await purchaseSubscription(productId);
      // O listener do IAP cuidará da validação e atualização do status
    } catch (error: any) {
      if (error.error !== 'Compra cancelada pelo usuário.') {
        Alert.alert('Erro na Compra', error.error || 'Não foi possível processar a compra.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const { restored } = await restorePurchases();
      await checkPremiumStatus();
      if (restored > 0) {
        Alert.alert('Sucesso', 'Assinaturas restauradas com sucesso!');
      } else {
        Alert.alert('Aviso', 'Nenhuma assinatura ativa encontrada para restaurar.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível restaurar suas compras.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleManageSubscription = () => {
    const url = MANAGE_SUBSCRIPTION_URL[Platform.OS];
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir a página de gerenciamento de assinaturas.');
    });
  };

  const selectedProduct = products.find(p => p.productId === (billingCycle === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL));

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerContainer: { 
        backgroundColor: colors.surface, 
        padding: 20, 
        paddingTop: 50, 
        borderBottomWidth: 1, 
        borderBottomColor: colors.border 
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    headerTitle: { fontSize: 22, fontFamily: 'Inter-Bold', color: colors.text, marginLeft: 16 },
    content: { padding: 20 },
    title: { fontSize: 24, fontFamily: 'Inter-Bold', color: colors.text, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 16, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
    featureCard: { marginBottom: 16 },
    featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    featureText: { fontSize: 16, fontFamily: 'Inter-Medium', color: colors.text, marginLeft: 16 },
    pricingCard: { padding: 20, alignItems: 'center', marginTop: 16 },
    toggleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    toggleText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text },
    priceText: { fontSize: 32, fontFamily: 'Inter-Bold', color: colors.primary, marginVertical: 8 },
    priceUnit: { fontSize: 16, fontFamily: 'Inter-Regular', color: colors.textSecondary },
    saveBadge: { backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 12 },
    saveText: { color: colors.white, fontSize: 12, fontFamily: 'Inter-Bold' },
    button: { marginTop: 20, width: '100%' },
    restoreText: { color: colors.primary, fontFamily: 'Inter-SemiBold', textAlign: 'center', marginTop: 24 },
    footerText: { fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 32, lineHeight: 18 },
    statusContainer: { padding: 20 },
    statusTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: colors.text, textAlign: 'center', marginBottom: 12 },
    statusSubtitle: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  });

  if (loading && !selectedProduct) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
  }

  if (isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Status Premium</Text>
                <View style={{width: 24}}/>
            </View>
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Você é um usuário Premium!</Text>
          <Text style={styles.statusSubtitle}>
            Sua assinatura está ativa até {new Date(premiumUntil || 0).toLocaleDateString('pt-BR')}.
          </Text>
          <Button title="Gerenciar Assinatura" onPress={handleManageSubscription} />
          <Text style={styles.footerText}>Você pode gerenciar sua assinatura na página de configurações da sua conta Google Play ou Apple.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seja Premium</Text>
                <View style={{width: 24}}/>
            </View>
        </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Desbloqueie todo o potencial</Text>
        <Text style={styles.subtitle}>Acesso ilimitado a todos os recursos analíticos.</Text>

        <Card style={styles.featureCard}>
            <View style={styles.featureRow}><Star size={20} color={colors.primary}/><Text style={styles.featureText}>Exportação de Relatórios (PDF/CSV)</Text></View>
            <View style={styles.featureRow}><PieChart size={20} color={colors.primary}/><Text style={styles.featureText}>Relatórios e Análises Avançadas</Text></View>
            <View style={styles.featureRow}><Zap size={20} color={colors.primary}/><Text style={styles.featureText}>Scanner de Código de Barras</Text></View>
        </Card>

        <Card style={styles.pricingCard}>
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleText, billingCycle === 'monthly' && {color: colors.primary}]}>Mensal</Text>
            <Switch
              value={billingCycle === 'annual'}
              onValueChange={(val) => setBillingCycle(val ? 'annual' : 'monthly')}
              thumbColor={colors.primary}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              style={{ marginHorizontal: 12 }}
            />
            <Text style={[styles.toggleText, billingCycle === 'annual' && {color: colors.primary}]}>Anual</Text>
            <View style={styles.saveBadge}><Text style={styles.saveText}>-45%</Text></View>
          </View>

          {selectedProduct ? (
            <>
              <Text style={styles.priceText}>{selectedProduct.localizedPrice}</Text>
              <Text style={styles.priceUnit}>{billingCycle === 'monthly' ? 'por mês' : 'por ano'}</Text>
            </>
          ) : <ActivityIndicator color={colors.primary} style={{marginVertical: 20}}/>}

          <Button
            title={loading ? 'Processando...' : 'Continuar'}
            onPress={handlePurchase}
            disabled={loading || !selectedProduct}
            style={styles.button}
          />
        </Card>

        <TouchableOpacity onPress={handleRestore} disabled={loading}>
          <Text style={styles.restoreText}>Restaurar Compras</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          As assinaturas são gerenciadas através da sua conta Google Play ou App Store. Você pode cancelar a qualquer momento.
        </Text>

      </ScrollView>
    </View>
  );
}
