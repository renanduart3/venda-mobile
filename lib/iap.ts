import { Platform } from 'react-native';
import { validateSubscription } from './premium';

export const PRODUCT_IDS = {
  MONTHLY: Platform.select({
    ios: 'premium_monthly',
    android: 'premium_monthly',
  }) as string,
  ANNUAL: Platform.select({
    ios: 'premium_annual',
    android: 'premium_annual',
  }) as string,
};

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

export async function initializeIAP(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      console.log('IAP not available on web');
      return false;
    }

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

    return [
      {
        productId: PRODUCT_IDS.MONTHLY,
        title: 'Premium Mensal',
        description: 'Acesso completo a todos os recursos premium por 1 mês',
        price: '9.90',
        localizedPrice: 'R$ 9,90',
        currency: 'BRL',
        type: 'subs',
      },
      {
        productId: PRODUCT_IDS.ANNUAL,
        title: 'Premium Anual',
        description: 'Acesso completo a todos os recursos premium por 1 ano',
        price: '99.90',
        localizedPrice: 'R$ 99,90',
        currency: 'BRL',
        type: 'subs',
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

    const platform = Platform.OS as 'android' | 'ios';
    const mockPurchaseToken = `mock_token_${Date.now()}_${productId}`;

    const result = await validateSubscription(platform, mockPurchaseToken, productId);

    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Purchase validation failed' };
    }
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

    return { success: true, restored: 0 };
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
      iapAvailable = false;
    }
  } catch (error) {
    console.error('Error ending IAP connection:', error);
  }
}
