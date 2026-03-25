import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { subscriptionManager, SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/subscriptions';
import { checkSubscriptionFromDatabase, getPremiumStatus } from '@/lib/premium';
import { restorePurchases as iapRestorePurchases } from '@/lib/iap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  checkEarlyAdopterAvailability,
  EarlyAdopterStatus,
  formatPrice,
  PRICING,
  getPricingDisplayInfo,
  PricingDisplayInfo
} from '@/lib/early-adopters';

export default function Planos() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [earlyAdopterStatus, setEarlyAdopterStatus] = useState<EarlyAdopterStatus | null>(null);
  const [monthlyPricing, setMonthlyPricing] = useState<PricingDisplayInfo | null>(null);
  const [yearlyPricing, setYearlyPricing] = useState<PricingDisplayInfo | null>(null);
  const [purchaseDialogVisible, setPurchaseDialogVisible] = useState(false);
  const [purchaseDialogMessage, setPurchaseDialogMessage] = useState('Processando sua assinatura...');

  const bottomSpacer = Math.max(32, (insets.bottom || 0) + 24);

  const currentPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === selectedPlan);

  useEffect(() => {
    loadActiveSubscription();
    loadEarlyAdopterStatus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActiveSubscription();
    }, [])
  );

  const loadEarlyAdopterStatus = async () => {
    try {
      const status = await checkEarlyAdopterAvailability();
      setEarlyAdopterStatus(status);

      const monthlyInfo = await getPricingDisplayInfo('premium_monthly_plan');
      const yearlyInfo = await getPricingDisplayInfo('premium_yearly_plan');

      setMonthlyPricing(monthlyInfo);
      setYearlyPricing(yearlyInfo);
    } catch (error) {
      console.error('Erro ao carregar status early adopter:', error);
    }
  };

  const loadActiveSubscription = async () => {
    try {
      const dbSync = await checkSubscriptionFromDatabase();
      if (!dbSync.success) {
        console.warn('[Planos] Falha ao sincronizar assinatura no banco; usando cache local premium.');
      }

      const premiumStatus = dbSync.success && dbSync.status
        ? dbSync.status
        : await getPremiumStatus();

      if (premiumStatus.isPremium) {
        const normalizedProductId = premiumStatus.productId?.toLowerCase() || '';
        const planId = normalizedProductId.includes('month')
          ? 'monthly'
          : (normalizedProductId.includes('year') || normalizedProductId.includes('annual'))
            ? 'yearly'
            : 'yearly';

        setActiveSubscription({
          isActive: true,
          planId,
          hasLifetimeAccess: premiumStatus.hasLifetimeAccess
        });
      } else {
        setActiveSubscription(null);
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      setActiveSubscription(null);
    }
  };

  const getPlanIdFromProductId = (productId?: string) => {
    const normalizedProductId = productId?.toLowerCase() || '';
    if (normalizedProductId.includes('month')) return 'monthly';
    if (normalizedProductId.includes('year') || normalizedProductId.includes('annual')) return 'yearly';
    return 'yearly';
  };

  const doSubscribe = async () => {
    let shouldHideDialog = true;
    setIsLoading(true);
    setPurchaseDialogMessage('Aguardando confirmação da compra no Google Play...');
    setPurchaseDialogVisible(true);

    try {
      const result = await subscriptionManager.purchaseSubscription(currentPlan!);

      if (result.success) {
        setPurchaseDialogMessage('Validando assinatura e sincronizando acesso premium...');

        const dbSync = await checkSubscriptionFromDatabase({ skipStoreRevalidation: true });
        const premiumStatus = dbSync.success && dbSync.status
          ? dbSync.status
          : await getPremiumStatus();

        if (!premiumStatus.isPremium) {
          Alert.alert(
            'Assinatura em processamento',
            'A compra foi concluída, mas a ativação ainda está sincronizando. Aguarde alguns segundos e tente novamente.'
          );
          return;
        }

        setActiveSubscription({
          isActive: true,
          planId: getPlanIdFromProductId(premiumStatus.productId),
          hasLifetimeAccess: premiumStatus.hasLifetimeAccess
        });

        setPurchaseDialogMessage('Assinatura ativa! Redirecionando para o dashboard...');
        shouldHideDialog = false;
        await new Promise(resolve => setTimeout(resolve, 700));
        router.replace('/(tabs)');
      } else if (result.cancelled) {
        // noop — usuário cancelou voluntariamente
      } else if (result.reason === 'auth') {
        Alert.alert('Sessão expirada', 'Faça login novamente antes de assinar.');
      } else if (result.reason === 'config') {
        Alert.alert('Pagamento indisponível', 'A Play Store ou a configuração da assinatura não está pronta neste dispositivo.');
      } else if (result.reason === 'validation') {
        Alert.alert('Assinatura não ativada', result.error || 'A compra não foi validada como assinatura ativa.');
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível processar a assinatura.');
      }
    } catch (error) {
      console.error('Erro na assinatura:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
      if (shouldHideDialog) {
        setPurchaseDialogVisible(false);
      }
    }
  };

  const handleSubscribe = () => {
    if (!currentPlan) return;

    if (Platform.OS !== 'android') {
      Alert.alert(
        'Disponível no Android',
        'As assinaturas estão disponíveis apenas no Android através do Google Play Store.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Aviso de upgrade: assinatura mensal ativa tentando ir para anual
    if (activeSubscription?.planId === 'monthly' && selectedPlan === 'yearly') {
      Alert.alert(
        'Atenção: Upgrade para Plano Anual',
        'O plano anual é uma nova assinatura independente no Google Play.\n\nSe você não cancelar o plano mensal antes, será cobrado pelos dois planos simultaneamente.\n\nRecomendamos cancelar o plano mensal em Assinaturas do Google Play antes de continuar.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Entendi, continuar', onPress: doSubscribe },
        ]
      );
      return;
    }

    doSubscribe();
  };

  const handleVerifyAccess = async () => {
    let shouldHideDialog = true;
    setIsLoading(true);
    setPurchaseDialogMessage('Verificando acesso premium...');
    setPurchaseDialogVisible(true);

    try {
      const dbSync = await checkSubscriptionFromDatabase();

      if (dbSync.success && dbSync.status?.isPremium) {
        const premiumStatus = dbSync.status;
        setActiveSubscription({
          isActive: true,
          planId: getPlanIdFromProductId(premiumStatus.productId),
          hasLifetimeAccess: premiumStatus.hasLifetimeAccess
        });
        setPurchaseDialogMessage('Acesso premium confirmado!');
        shouldHideDialog = false;
        await new Promise(resolve => setTimeout(resolve, 600));
        setPurchaseDialogVisible(false);
        return;
      }

      // DB não confirmou premium; tenta recuperar compras diretamente do Google Play
      setPurchaseDialogMessage('Consultando compras no Google Play...');
      const restoreResult = await iapRestorePurchases();

      if (restoreResult.success && restoreResult.restored > 0) {
        const updatedSync = await checkSubscriptionFromDatabase({ skipStoreRevalidation: true });
        const premiumStatus = updatedSync.success && updatedSync.status
          ? updatedSync.status
          : await getPremiumStatus();

        if (premiumStatus.isPremium) {
          setActiveSubscription({
            isActive: true,
            planId: getPlanIdFromProductId(premiumStatus.productId),
            hasLifetimeAccess: premiumStatus.hasLifetimeAccess
          });
          setPurchaseDialogMessage('Acesso premium recuperado!');
          shouldHideDialog = false;
          await new Promise(resolve => setTimeout(resolve, 600));
          setPurchaseDialogVisible(false);
          return;
        }
      }

      Alert.alert(
        'Nenhuma assinatura ativa',
        'Não foi encontrada nenhuma assinatura ativa associada a esta conta no Google Play.\n\nSe você realizou uma compra recentemente e não foi ativada, aguarde alguns minutos e tente novamente.'
      );
    } catch (error) {
      console.error('[Planos] Erro ao verificar acesso:', error);
      Alert.alert('Erro', 'Não foi possível verificar o acesso. Tente novamente.');
    } finally {
      setIsLoading(false);
      if (shouldHideDialog) {
        setPurchaseDialogVisible(false);
      }
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
    earlyAdopterBanner: {
      backgroundColor: colors.primary + '15',
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      marginBottom: 24,
    },
    earlyAdopterBannerUrgent: {
      backgroundColor: colors.warning + '15',
      borderLeftColor: colors.warning,
    },
    earlyAdopterTitle: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      marginBottom: 8,
    },
    earlyAdopterTitleUrgent: {
      color: colors.warning,
    },
    earlyAdopterDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    earlyAdopterCounter: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      marginTop: 4,
    },
    earlyAdopterCounterUrgent: {
      color: colors.warning,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 24,
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
    originalPriceStriked: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
      marginBottom: 2,
    },
    discountBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginBottom: 6,
    },
    discountBadgeText: {
      fontSize: 11,
      fontFamily: 'Inter-Bold',
      color: colors.white,
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
    purchaseDialogOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    purchaseDialogCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 18,
      paddingVertical: 20,
      alignItems: 'center',
    },
    purchaseDialogTitle: {
      marginTop: 14,
      fontSize: 17,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      textAlign: 'center',
    },
    purchaseDialogMessage: {
      marginTop: 8,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const getFeatureIcon = (index: number) => {
    const icons = [Crown, Star, Shield, Zap, Download, Cloud];
    const Icon = icons[index % icons.length];
    return <Icon size={16} color={colors.success} />;
  };

  const isEarlyAdopter = earlyAdopterStatus?.isAvailable ?? true;
  const pricing = selectedPlan === 'monthly' ? monthlyPricing : yearlyPricing;

  // Preços reais baseados no status
  const currentPrice = isEarlyAdopter
    ? (selectedPlan === 'monthly' ? PRICING.MONTHLY.earlyAdopter : PRICING.YEARLY.earlyAdopter)
    : (selectedPlan === 'monthly' ? PRICING.MONTHLY.regular : PRICING.YEARLY.regular);

  const regularPrice = selectedPlan === 'monthly' ? PRICING.MONTHLY.regular : PRICING.YEARLY.regular;
  const slotsUsed = earlyAdopterStatus?.currentCount ?? 20;
  const totalSlots = earlyAdopterStatus?.totalSlots ?? 300;
  const slotsRemaining = earlyAdopterStatus?.slotsRemaining ?? (totalSlots - slotsUsed);
  const isUrgent = slotsRemaining <= 50;

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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomSpacer }}
      >

        {/* Early Adopter Banner — vagas disponíveis */}
        {isEarlyAdopter && earlyAdopterStatus !== null && (
          <View style={[styles.earlyAdopterBanner, isUrgent && styles.earlyAdopterBannerUrgent]}>
            <Text style={[styles.earlyAdopterTitle, isUrgent && styles.earlyAdopterTitleUrgent]}>
              {slotsRemaining <= 10 ? '⚡ Últimas vagas!' : '🎉 Preço de lançamento'}
            </Text>
            <Text style={styles.earlyAdopterDescription}>
              90% de desconto vitalício para os primeiros 300 clientes da plataforma.
            </Text>
            <Text style={styles.earlyAdopterDescription}>
              <Text style={{ fontFamily: 'Inter-Bold', color: colors.primary }}>
                R$ {PRICING.MONTHLY.earlyAdopter.toFixed(2).replace('.', ',')} mensal
              </Text>
              {'  ou  '}
              <Text style={{ fontFamily: 'Inter-Bold', color: colors.primary }}>
                R$ {PRICING.YEARLY.earlyAdopter.toFixed(2).replace('.', ',')} anual
              </Text>
              {' — para sempre.'}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginBottom: 10 }}>
              Após os 300: R$ {PRICING.MONTHLY.regular.toFixed(2).replace('.', ',')}/mês ou R$ {PRICING.YEARLY.regular.toFixed(2).replace('.', ',')}/ano (preço normal)
            </Text>
            <Text style={[styles.earlyAdopterCounter, isUrgent && styles.earlyAdopterCounterUrgent]}>
              {`${slotsUsed}/${totalSlots} clientes — restam ${slotsRemaining} vagas`}
            </Text>
          </View>
        )}

        {/* Banner — vagas esgotadas */}
        {!isEarlyAdopter && earlyAdopterStatus !== null && (
          <View style={[styles.earlyAdopterBanner, { backgroundColor: colors.surface, borderLeftColor: colors.textSecondary }]}>
            <Text style={[styles.earlyAdopterTitle, { color: colors.text }]}>
              Plano Premium
            </Text>
            <Text style={styles.earlyAdopterDescription}>
              Assinatura mensal por{' '}
              <Text style={{ fontFamily: 'Inter-Bold', color: colors.primary }}>
                R$ {PRICING.MONTHLY.regular.toFixed(2).replace('.', ',')}/mês
              </Text>{' '}
              ou anual por{' '}
              <Text style={{ fontFamily: 'Inter-Bold', color: colors.primary }}>
                R$ {PRICING.YEARLY.regular.toFixed(2).replace('.', ',')}/ano
              </Text>.
            </Text>
          </View>
        )}

        {/* Active Subscription */}
        {activeSubscription && (
          <Card style={[styles.activeSubscription, activeSubscription.hasLifetimeAccess && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.activeText, activeSubscription.hasLifetimeAccess && { color: colors.primary }]}>
              {activeSubscription.hasLifetimeAccess
                ? '⭐ Você possui Acesso Vitalício!'
                : '✅ Você já possui uma assinatura ativa!'}
            </Text>
          </Card>
        )}

        {/* Toggle Mensal / Anual */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleOption, selectedPlan === 'monthly' ? styles.toggleOptionActive : styles.toggleOptionInactive]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text style={[styles.toggleText, selectedPlan === 'monthly' ? styles.toggleTextActive : styles.toggleTextInactive]}>
              Mensal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, selectedPlan === 'yearly' ? styles.toggleOptionActive : styles.toggleOptionInactive]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <Text style={[styles.toggleText, selectedPlan === 'yearly' ? styles.toggleTextActive : styles.toggleTextInactive]}>
              Anual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card do Plano */}
        {currentPlan && (
          <View style={styles.plansContainer}>
            <Card style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardRecommended]}>
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
                  {isEarlyAdopter ? (
                    <>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>PREÇO DE LANÇAMENTO</Text>
                      </View>
                      <Text style={styles.priceValue}>{formatPrice(currentPrice)}</Text>
                      <Text style={styles.originalPriceStriked}>
                        Depois: {formatPrice(regularPrice)}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.priceValue}>{formatPrice(currentPrice)}</Text>
                    </>
                  )}
                  <Text style={styles.pricePeriod}>
                    {currentPlan.period === 'monthly' ? '/mês' : '/ano'}
                  </Text>
                  {isEarlyAdopter && (
                    <View style={styles.savings}>
                      <Text style={styles.savingsText}>
                        {selectedPlan === 'monthly'
                          ? `Economize ${formatPrice(PRICING.MONTHLY.regular - PRICING.MONTHLY.earlyAdopter)}/mês`
                          : `Economize ${formatPrice(PRICING.YEARLY.regular - PRICING.YEARLY.earlyAdopter)}/ano`}
                      </Text>
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

              {/* Botão de Assinar */}
              <Button
                title={(() => {
                  if (isLoading) return 'Processando...';
                  if (activeSubscription?.hasLifetimeAccess) return 'Acesso Vitalício Desbloqueado';

                  if (activeSubscription) {
                    if (activeSubscription.planId === selectedPlan) {
                      return 'Seu Plano Atual';
                    } else if (activeSubscription.planId === 'monthly' && selectedPlan === 'yearly') {
                      return 'Fazer Upgrade para Anual';
                    } else {
                      return 'Assinatura Ativa';
                    }
                  }

                  return 'Assinar Agora';
                })()}
                onPress={handleSubscribe}
                disabled={
                  isLoading ||
                  !!activeSubscription?.hasLifetimeAccess ||
                  (activeSubscription && !(activeSubscription.planId === 'monthly' && selectedPlan === 'yearly'))
                }
                style={styles.subscribeButton}
                variant={(activeSubscription && !(activeSubscription.planId === 'monthly' && selectedPlan === 'yearly')) ? 'outline' : 'primary'}
              />
            </Card>
          </View>
        )}

        {/* O botão 'Restaurar Compras' foi removido aqui.
            A arquitetura atual do app recupera, protege e reativa 
            orgânica e silenciosamente os dados offline das licenças de forma automática 
            no login e via cache TTL na camada do lib/premium.ts 
        */}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={{ fontWeight: 'bold' }}>Plano Gratuito:</Text> Gestão comercial básica com operações fundamentais{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Plano Premium:</Text> Serviço estendido com backups na nuvem, análises e relatórios{'\n\n'}
          </Text>
          {!activeSubscription && (
            <Button
              title="Verificar Acesso Premium"
              variant="outline"
              onPress={handleVerifyAccess}
              disabled={isLoading}
              style={{ marginBottom: 12 }}
            />
          )}
          <Button
            title="Cancelar ou Gerenciar Assinaturas"
            variant="outline"
            onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions?package=com.renanduart3.vendamobile')}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.footerText, { fontSize: 12 }]}>
            O Venda Mobile não possui carência nem taxas de cancelamento. Diretrizes Google Play respeitadas.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={purchaseDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.purchaseDialogOverlay}>
          <View style={styles.purchaseDialogCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.purchaseDialogTitle}>Processando assinatura</Text>
            <Text style={styles.purchaseDialogMessage}>{purchaseDialogMessage}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
