import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PurchaseFailureReason } from './iap';

// Google Play Billing SKUs (substitua pelos seus SKUs reais)
export const SUBSCRIPTION_SKUS = {
  MONTHLY: 'premium_monthly_plan',
  YEARLY: 'premium_yearly_plan',
} as const;

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: 'monthly' | 'yearly';
  sku: string;
  description: string;
  features: string[];
  savings?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    price: 'R$ 9,90',
    period: 'monthly',
    sku: SUBSCRIPTION_SKUS.MONTHLY,
    description: 'Proteção total dos seus dados',
    features: [
      'Backup manual dos dados (exportação)',
      'Restauração de dados (importação)',
      'Relatórios detalhados em PDF',
      'Relatórios de inteligência de negócio',
    ],
  },
  {
    id: 'yearly',
    name: 'Plano Anual',
    price: 'R$ 99,90',
    period: 'yearly',
    sku: SUBSCRIPTION_SKUS.YEARLY,
    description: 'Melhor custo-benefício',
    features: [
      'Backup manual dos dados (exportação)',
      'Restauração de dados (importação)',
      'Relatórios detalhados em PDF',
      'Relatórios de inteligência de negócio',
    ],
    savings: 'Economize R$ 19,10',
  },
];

export interface BillingResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  cancelled?: boolean;
  reason?: PurchaseFailureReason;
}

class SubscriptionManager {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        console.log('Google Play Billing só funciona no Android');
        return false;
      }

      // Aqui você implementaria a inicialização real do Google Play Billing
      // Por enquanto, simulamos a inicialização
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Erro ao inicializar billing:', error);
      return false;
    }
  }

  async purchaseSubscription(plan: SubscriptionPlan): Promise<BillingResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'Não foi possível inicializar o sistema de pagamentos'
          };
        }
      }

      // Chamar o IAP real
      const { purchaseSubscription } = await import('./iap');
      const result = await purchaseSubscription(plan.sku);

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.cancelled ? undefined : (result.error || 'Erro na compra'),
          cancelled: result.cancelled,
          reason: result.reason,
        };
      }
    } catch (error) {
      console.error('Erro na compra:', error);
      return {
        success: false,
        error: 'Erro ao processar pagamento'
      };
    }
  }

  async getActiveSubscription(): Promise<any | null> {
    try {
      const { isPremium, getPremiumStatus } = await import('./premium');
      const premiumActive = await isPremium(true);

      if (!premiumActive) {
        await AsyncStorage.removeItem('active_subscription');
        return null;
      }

      const premiumStatus = await getPremiumStatus();
      const normalizedProductId = premiumStatus.productId?.toLowerCase() || '';
      const planId = normalizedProductId.includes('month')
        ? 'monthly'
        : (normalizedProductId.includes('year') || normalizedProductId.includes('annual'))
          ? 'yearly'
          : undefined;

      return {
        isActive: true,
        planId,
        sku: premiumStatus.productId,
        platform: premiumStatus.platform,
        hasLifetimeAccess: premiumStatus.hasLifetimeAccess,
        expiryDate: premiumStatus.expiryDate,
      };
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      return null;
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      // Aqui você implementaria o cancelamento real
      Alert.alert(
        'Cancelar Assinatura',
        'Para cancelar sua assinatura, acesse o Google Play Store > Assinaturas',
        [{ text: 'OK' }]
      );
      return true;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      // Aqui você implementaria a restauração real
      const subscription = await this.getActiveSubscription();

      if (subscription && subscription.isActive) {
        Alert.alert('Assinatura Restaurada', 'Sua assinatura foi restaurada com sucesso!');
        return true;
      } else {
        Alert.alert('Nenhuma Assinatura', 'Não foi encontrada nenhuma assinatura ativa.');
        return false;
      }
    } catch (error) {
      console.error('Erro ao restaurar compras:', error);
      return false;
    }
  }
}

export const subscriptionManager = new SubscriptionManager();
