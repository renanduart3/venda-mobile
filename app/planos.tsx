import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import {
  ArrowLeft,
  Crown,
  Check,
  Star,
  Shield,
  Zap,
  Download,
  Cloud
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';
import { subscriptionManager, SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/subscriptions';
import { enablePremium, disablePremium, isPremium } from '@/lib/premium';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Planos() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  // Increase spacer: ensure minimum 24, cap at 36 for very tall gesture areas
  const bottomSpacer = Math.max(24, Math.min((insets.bottom || 0) + 12, 36));

  // Obter o plano atual baseado na seleção
  const currentPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === selectedPlan);

  useEffect(() => {
    loadActiveSubscription();
  }, []);

  const loadActiveSubscription = async () => {
    try {
      const subscription = await subscriptionManager.getActiveSubscription();
      setActiveSubscription(subscription);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!currentPlan) return;
    
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Disponível no Android',
        'As assinaturas estão disponíveis apenas no Android através do Google Play Store.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await subscriptionManager.purchaseSubscription(currentPlan);
      
      if (result.success) {
        Alert.alert('Sucesso!', 'Assinatura ativada com sucesso!');
        // Atualizar estado local
        await loadActiveSubscription();
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível processar a assinatura.');
      }
    } catch (error) {
      console.error('Erro na assinatura:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      const restored = await subscriptionManager.restorePurchases();
      if (restored) {
        await loadActiveSubscription();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível restaurar as compras.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevEnablePremium = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await enablePremium(in30Days, 'android', currentPlan?.sku || 'dev_sku');
      Alert.alert('Dev', 'Premium ativado localmente por 30 dias.');
      await loadActiveSubscription();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível ativar premium em dev.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevDisablePremium = async () => {
    setIsLoading(true);
    try {
      await disablePremium();
      Alert.alert('Dev', 'Premium desativado.');
      await loadActiveSubscription();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível desativar premium em dev.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.topbar,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.topbar,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.onTopbar,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    heroTitle: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    plansContainer: {
      marginBottom: 32,
    },
    planCard: {
      position: 'relative',
    },
    planCardRecommended: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 4,
      marginBottom: 20,
    },
    toggleOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: 'center',
    },
    toggleOptionActive: {
      backgroundColor: colors.primary,
    },
    toggleOptionInactive: {
      backgroundColor: 'transparent',
    },
    toggleText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    },
    toggleTextActive: {
      color: colors.white,
    },
    toggleTextInactive: {
      color: colors.textSecondary,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    planInfo: {
      flex: 1,
    },
    planName: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    planDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    planPrice: {
      alignItems: 'flex-end',
    },
    priceValue: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    pricePeriod: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    savings: {
      backgroundColor: colors.success + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    savingsText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: colors.success,
    },
    recommendedBadge: {
      position: 'absolute',
      top: -8,
      right: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    recommendedText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
    },
    featuresList: {
      marginBottom: 20,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureIcon: {
      marginRight: 12,
    },
    featureText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      flex: 1,
    },
    subscribeButton: {
      width: '100%',
      backgroundColor: colors.primary,
    },
    activeSubscription: {
      backgroundColor: colors.success + '20',
      borderColor: colors.success,
      borderWidth: 1,
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
    },
    activeText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.success,
      textAlign: 'center',
    },
    restoreButton: {
      marginTop: 16,
    },
    footer: {
      marginTop: 32,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
    },
    footerText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
  });

  const getFeatureIcon = (index: number) => {
    const icons = [Crown, Star, Shield, Zap, Download, Cloud];
    const Icon = icons[index % icons.length];
    return <Icon size={16} color={colors.success} />;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.onTopbar} />
        </TouchableOpacity>
        <Text style={styles.title}>Planos Premium</Text>
      </View>
      {__DEV__ && (
        <View style={{ alignSelf: 'center', marginTop: 8, backgroundColor: colors.warning + '20', borderColor: colors.warning, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 12, fontFamily: 'Inter-SemiBold', color: colors.warning }}>Desenvolvimento</Text>
        </View>
      )}

  <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Proteja Seus Dados</Text>
          <Text style={styles.heroSubtitle}>
            Com o Premium, seus dados ficam seguros com backup automático e você tem acesso a relatórios detalhados
          </Text>
        </View>

        {/* Active Subscription */}
        {activeSubscription && (
          <Card style={styles.activeSubscription}>
            <Text style={styles.activeText}>
              ✅ Você já possui uma assinatura ativa!
            </Text>
          </Card>
        )}

        {/* Toggle de Período */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              selectedPlan === 'monthly' ? styles.toggleOptionActive : styles.toggleOptionInactive
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text style={[
              styles.toggleText,
              selectedPlan === 'monthly' ? styles.toggleTextActive : styles.toggleTextInactive
            ]}>
              Mensal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              selectedPlan === 'yearly' ? styles.toggleOptionActive : styles.toggleOptionInactive
            ]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <Text style={[
              styles.toggleText,
              selectedPlan === 'yearly' ? styles.toggleTextActive : styles.toggleTextInactive
            ]}>
              Anual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plano Selecionado */}
        {currentPlan && (
          <View style={styles.plansContainer}>
            <Card
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardRecommended
              ]}
            >
              {selectedPlan === 'yearly' && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMENDADO</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName} numberOfLines={1} ellipsizeMode="tail">{currentPlan.name}</Text>
                  <Text style={styles.planDescription} numberOfLines={2} ellipsizeMode="tail">{currentPlan.description}</Text>
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.priceValue}>{currentPlan.price}</Text>
                  <Text style={styles.pricePeriod}>
                    {currentPlan.period === 'monthly' ? '/mês' : '/ano'}
                  </Text>
                  {currentPlan.savings && (
                    <View style={styles.savings}>
                      <Text style={styles.savingsText}>{currentPlan.savings}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.featuresList}>
                {currentPlan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      {getFeatureIcon(index)}
                    </View>
                    <Text style={styles.featureText} numberOfLines={2} ellipsizeMode="tail">{feature}</Text>
                  </View>
                ))}
              </View>

              {__DEV__ || Platform.OS !== 'android' ? (
                <Button
                  title={activeSubscription ? 'Assinatura Ativa' : 'Assinar (disponível no build)'}
                  onPress={() => {}}
                  disabled
                  style={styles.subscribeButton}
                  variant="outline"
                />
              ) : (
                <Button
                  title={activeSubscription ? 'Assinatura Ativa' : 'Assinar Agora'}
                  onPress={handleSubscribe}
                  disabled={!!activeSubscription || isLoading}
                  style={styles.subscribeButton}
                  variant="primary"
                />
              )}
            </Card>
          </View>
        )}

        {/* Restore Purchases */}
        <Button
          title="Restaurar Compras"
          onPress={handleRestorePurchases}
          variant="outline"
          style={styles.restoreButton}
          disabled={isLoading}
        />
        <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>
          Reinstalou ou trocou de aparelho? Toque em &quot;Restaurar Compras&quot; para
          recuperar sua assinatura ativa pela conta da loja.
        </Text>

        {__DEV__ && (
          <View style={{ marginTop: 12, gap: 8 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
              Ferramentas de desenvolvimento (somente em dev)
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
              <Button
                title="Ativar Premium (Dev)"
                onPress={handleDevEnablePremium}
                variant="secondary"
                size="sm"
              />
              <Button
                title="Desativar Premium (Dev)"
                onPress={handleDevDisablePremium}
                variant="outline"
                size="sm"
              />
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={{fontWeight: 'bold'}}>Plano Gratuito:</Text> Gestão comercial básica, mas sem proteção de dados{'\n'}
            <Text style={{fontWeight: 'bold'}}>Plano Premium:</Text> Backup automático, relatórios detalhados e exportação{'\n\n'}
            As assinaturas são gerenciadas pelo Google Play Store.{'\n'}
            Você pode cancelar a qualquer momento nas configurações da sua conta.
          </Text>
        </View>
      </ScrollView>
      {/* Discreet dark bottom area to align with system nav region on this screen only */}
      <View style={{ backgroundColor: colors.bottombar, height: bottomSpacer }} />
    </View>
  );
}
