import { Platform, Alert } from 'react-native';
import { validateSubscription } from './premium';

// TODO: Instalar react-native-iap quando necessário
// import RNIap, {
//   purchaseUpdatedListener,
//   purchaseErrorListener,
//   type Product,
//   type Purchase,
//   type SubscriptionPurchase,
//   finishTransaction,
//   getProducts as getIAPProducts,
//   getSubscriptions,
//   requestPurchase,
//   requestSubscription,
//   initConnection,
//   endConnection as endIAPConnection,
//   getAvailablePurchases,
// } from 'react-native-iap';

// SKUs reais do Google Play Console
export const PRODUCT_IDS = {
  MONTHLY: 'premium_monthly_plan',
  ANNUAL: 'premium_yearly_plan',
};

// IDs dos produtos para react-native-iap
const SKUS = Platform.select({
  ios: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL],
  android: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL],
}) as string[];

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  currency: string;
  type: 'subs';
}

export interface Purchase {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseToken: string;
}

let iapAvailable = false;
let purchaseUpdateSubscription: any = null;
let purchaseErrorSubscription: any = null;

export async function initializeIAP(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      console.log('IAP not available on web');
      return false;
    }

    // Simular inicialização do IAP para teste
    console.log('IAP initialized for testing');
    iapAvailable = true;
    return true;
  } catch (error) {
    console.error('Error initializing IAP:', error);
    return false;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    if (!iapAvailable) {
      console.log('IAP not initialized');
      return [];
    }

    // Simular produtos para teste
    console.log('Getting products for testing');
    return [
      {
        productId: PRODUCT_IDS.MONTHLY,
        title: 'Plano Premium Mensal',
        description: 'Acesso a todos os recursos premium por 1 mês',
        price: '9.99',
        localizedPrice: 'R$ 9,99',
        currency: 'BRL',
        type: 'subs' as const,
      },
      {
        productId: PRODUCT_IDS.ANNUAL,
        title: 'Plano Premium Anual',
        description: 'Acesso a todos os recursos premium por 1 ano',
        price: '99.99',
        localizedPrice: 'R$ 99,99',
        currency: 'BRL',
        type: 'subs' as const,
      },
    ];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

export async function purchaseSubscription(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!iapAvailable) {
      return { success: false, error: 'IAP not available' };
    }

    if (Platform.OS === 'web') {
      return { success: false, error: 'Purchases not available on web' };
    }

    // Simular compra para teste - vai abrir o Google Pay
    console.log(`Attempting to purchase: ${productId}`);
    
    // Simular abertura do Google Pay
    Alert.alert(
      'Google Pay',
      `Tentando comprar: ${productId}\n\nIsso abriria o Google Pay em produção.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Simular Sucesso', 
          onPress: () => {
            // Simular sucesso da compra
            console.log('Purchase simulated successfully');
          }
        }
      ]
    );
    
    return { success: false, error: 'Simulação - Google Pay seria aberto aqui' };
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; error?: string; restored: number }> {
  try {
    if (!iapAvailable) {
      return { success: false, error: 'IAP not available', restored: 0 };
    }

    if (Platform.OS === 'web') {
      return { success: false, error: 'Restore not available on web', restored: 0 };
    }

    // TODO: Implementar com react-native-iap quando instalado
    console.log('restorePurchases temporarily disabled - install react-native-iap to enable');
    return { success: false, error: 'IAP temporarily disabled - install react-native-iap to enable', restored: 0 };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      restored: 0,
    };
  }
}

export async function endConnection(): Promise<void> {
  try {
    if (iapAvailable) {
      // TODO: Implementar com react-native-iap quando instalado
      console.log('endConnection temporarily disabled - install react-native-iap to enable');
      iapAvailable = false;
    }
  } catch (error) {
    console.error('Error ending IAP connection:', error);
  }
}
