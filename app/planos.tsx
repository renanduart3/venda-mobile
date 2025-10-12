import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { 
  ArrowLeft,
  Crown,
  Check,
  X,
  Calendar,
  CreditCard
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';
import { isPremium, enablePremium, disablePremium } from '@/lib/premium';

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: 'Sempre',
    description: 'Funcionalidades básicas',
    features: [
      'Até 100 produtos',
      'Vendas básicas',
      'Clientes básicos',
      'Relatórios simples'
    ],
    popular: false,
    current: true
  },
  {
    id: 'monthly',
    name: 'Premium Mensal',
    price: 'R$ 29,90',
    period: 'por mês',
    description: 'Todas as funcionalidades',
    features: [
      'Produtos ilimitados',
      'Relatórios avançados',
      'Análise de clientes RFV',
      'Exportação PDF/Excel',
      'Sincronização em nuvem',
      'Suporte prioritário'
    ],
    popular: true,
    current: false
  },
  {
    id: 'yearly',
    name: 'Premium Anual',
    price: 'R$ 299,90',
    period: 'por ano',
    description: 'Melhor custo-benefício',
    features: [
      'Produtos ilimitados',
      'Relatórios avançados',
      'Análise de clientes RFV',
      'Exportação PDF/Excel',
      'Sincronização em nuvem',
      'Suporte prioritário',
      '2 meses grátis'
    ],
    popular: false,
    current: false
  }
];

export default function Planos() {
  const { colors } = useTheme();
  const [premium, setPremium] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    try {
      const isPremiumUser = await isPremium();
      setPremium(isPremiumUser);
    } catch (error) {
      console.error('Erro carregando status premium:', error);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      Alert.alert('Plano Gratuito', 'Você já está no plano gratuito.');
      return;
    }
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    
    try {
      // Simular processo de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular sucesso do pagamento
      const success = Math.random() > 0.1; // 90% de chance de sucesso
      
      if (success) {
        await enablePremium();
        setPremium(true);
        Alert.alert(
          'Assinatura Ativada!',
          'Seu plano premium foi ativado com sucesso. Aproveite todas as funcionalidades!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Erro no Pagamento', 'Não foi possível processar o pagamento. Tente novamente.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro durante o processo. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    
    try {
      await disablePremium();
      setPremium(false);
      Alert.alert(
        'Assinatura Cancelada',
        'Sua assinatura premium foi cancelada. Você continuará com acesso até o final do período atual.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível cancelar a assinatura. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setShowCancelModal(false);
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
    currentPlan: {
      marginBottom: 24,
    },
    currentPlanCard: {
      backgroundColor: premium ? colors.primary + '20' : colors.surface,
      borderColor: premium ? colors.primary : colors.border,
      borderWidth: 2,
    },
    currentPlanText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    currentPlanStatus: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: premium ? colors.primary : colors.textSecondary,
    },
    plansContainer: {
      gap: 16,
    },
    planCard: {
      position: 'relative',
    },
    popularBadge: {
      position: 'absolute',
      top: -8,
      right: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 1,
    },
    popularBadgeText: {
      fontSize: 12,
      fontFamily: 'Inter-Bold',
      color: colors.white,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    planName: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    planPrice: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    planPeriod: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    planDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 16,
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
      marginRight: 8,
    },
    featureText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      flex: 1,
    },
    selectButton: {
      marginTop: 16,
    },
    selectButtonActive: {
      backgroundColor: colors.primary,
    },
    selectButtonText: {
      color: colors.white,
    },
    selectButtonTextActive: {
      color: colors.white,
    },
    cancelButton: {
      backgroundColor: colors.error,
      marginTop: 20,
    },
    cancelButtonText: {
      color: colors.white,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 8,
    },
    modalDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 20,
      lineHeight: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
    },
  });

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
        {/* Current Plan Status */}
        <View style={styles.currentPlan}>
          <Card style={styles.currentPlanCard}>
            <Text style={styles.currentPlanText}>
              {premium ? 'Plano Atual: Premium' : 'Plano Atual: Gratuito'}
            </Text>
            <Text style={styles.currentPlanStatus}>
              {premium 
                ? 'Você tem acesso a todas as funcionalidades premium'
                : 'Upgrade para premium e desbloqueie funcionalidades avançadas'
              }
            </Text>
            {premium && (
              <Button
                title="Cancelar Assinatura"
                onPress={() => setShowCancelModal(true)}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
            )}
          </Card>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <Card key={plan.id} style={styles.planCard}>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MAIS POPULAR</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
              
              <Text style={styles.planDescription}>{plan.description}</Text>
              
              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check 
                      size={16} 
                      color={colors.success} 
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              
              <Button
                title={plan.id === 'free' ? 'Plano Atual' : 'Selecionar Plano'}
                onPress={() => handleSelectPlan(plan.id)}
                style={[
                  styles.selectButton,
                  selectedPlan === plan.id && styles.selectButtonActive
                ]}
                textStyle={[
                  selectedPlan === plan.id && styles.selectButtonTextActive
                ]}
                disabled={plan.id === 'free' || isProcessing}
              />
            </Card>
          ))}
        </View>

        {/* Subscribe Button */}
        {selectedPlan && selectedPlan !== 'free' && (
          <Button
            title={isProcessing ? "Processando..." : "Assinar com Google Pay"}
            onPress={handleSubscribe}
            disabled={isProcessing}
            style={{ marginTop: 20 }}
          />
        )}
      </ScrollView>

      {/* Cancel Subscription Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancelar Assinatura</Text>
            <Text style={styles.modalDescription}>
              Tem certeza que deseja cancelar sua assinatura premium? 
              Você perderá acesso a todas as funcionalidades premium.
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setShowCancelModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Sim, Cancelar"
                onPress={handleCancelSubscription}
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                textStyle={{ color: colors.white }}
                disabled={isProcessing}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
