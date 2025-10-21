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

export default function Planos() {
  const { colors } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);

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

  const handleSubscribe = async (plan: SubscriptionPlan) => {
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
      const result = await subscriptionManager.purchaseSubscription(plan);
      
      if (result.success) {
        // Atualizar estado local
        await loadActiveSubscription();
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível processar a assinatura.');
      }
    } catch (error) {
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
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
      backgroundColor: colors.card,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
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
      gap: 16,
      marginBottom: 32,
    },
    planCard: {
      position: 'relative',
    },
    planCardRecommended: {
      borderColor: colors.primary,
      borderWidth: 2,
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
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Planos Premium</Text>
      </View>

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

        {/* Plans */}
        <View style={styles.plansContainer}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card
              key={plan.id}
              style={[
                styles.planCard,
                plan.id === 'yearly' && styles.planCardRecommended
              ]}
            >
              {plan.id === 'yearly' && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMENDADO</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.priceValue}>{plan.price}</Text>
                  <Text style={styles.pricePeriod}>
                    {plan.period === 'monthly' ? '/mês' : '/ano'}
                  </Text>
                  {plan.savings && (
                    <View style={styles.savings}>
                      <Text style={styles.savingsText}>{plan.savings}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      {getFeatureIcon(index)}
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Button
                title={activeSubscription ? 'Assinatura Ativa' : 'Assinar Agora'}
                onPress={() => handleSubscribe(plan)}
                disabled={!!activeSubscription || isLoading}
                style={styles.subscribeButton}
                variant={plan.id === 'yearly' ? 'default' : 'outline'}
              />
            </Card>
          ))}
        </View>

        {/* Restore Purchases */}
        <Button
          title="Restaurar Compras"
          onPress={handleRestorePurchases}
          variant="outline"
          style={styles.restoreButton}
          disabled={isLoading}
        />

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
    </View>
  );
}