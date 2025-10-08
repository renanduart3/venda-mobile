
import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import { validateSubscription } from './premium';

// Define os IDs de produto para iOS e Android
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

// Reexporta as interfaces da biblioteca para uso no aplicativo
export type Product = InAppPurchases.IAPItem;
export type Purchase = InAppPurchases.InAppPurchase;

let iapAvailable = false;

// 1. Inicializa a conexão com a loja de aplicativos
export async function initializeIAP(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      console.log('IAP não está disponível na web.');
      return false;
    }
    
    await InAppPurchases.connectAsync();
    iapAvailable = true;
    console.log('Conexão com IAP estabelecida.');
    return true;

  } catch (error) {
    console.error('Erro ao inicializar IAP:', error);
    return false;
  }
}

// 2. Busca os produtos cadastrados na loja
export async function getProducts(): Promise<Product[]> {
  try {
    if (!iapAvailable) {
      console.log('IAP não inicializado para buscar produtos.');
      return [];
    }
    const productIds = Platform.select({
      ios: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL],
      android: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL],
    }) || [];
    
    const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('Produtos buscados com sucesso:', results);
      return results || [];
    }
    console.error('Erro ao buscar produtos. Código:', responseCode);
    return [];

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

// 3. Inicia o fluxo de compra
export async function purchaseSubscription(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!iapAvailable) {
      return { success: false, error: 'IAP não disponível' };
    }

    // Configura um listener para receber o resultado da compra
    InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        for (const purchase of results || []) {
          if (!purchase.acknowledged) {
            console.log(`Processando compra para ${purchase.productId}`);

            const platform = Platform.OS as 'android' | 'ios';
            // Para o Android, usamos o purchaseToken. Para iOS, o transactionReceipt.
            const token = platform === 'android' ? purchase.purchaseToken : purchase.transactionReceipt;

            if (token) {
              const validationResult = await validateSubscription(platform, token, purchase.productId);
              
              if (validationResult.success) {
                console.log('Compra validada e finalizada com sucesso.');
                await InAppPurchases.finishTransactionAsync(purchase, true);
              } else {
                console.error('Falha na validação do recibo:', validationResult.error);
                await InAppPurchases.finishTransactionAsync(purchase, false);
              }
            } else {
                console.error('Token de compra não encontrado.');
                await InAppPurchases.finishTransactionAsync(purchase, false);
            }
          }
        }
      }
    });

    console.log(`Iniciando compra para o produto: ${productId}`);
    await InAppPurchases.purchaseItemAsync(productId);

    // O resultado final será tratado pelo listener
    return { success: true };

  } catch (error: any) {
    console.error('Erro ao iniciar a compra:', error);
    if (error.code === 'E_USER_CANCELLED') {
      return { success: false, error: 'Compra cancelada pelo usuário.' };
    }    
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

// 4. Restaura compras anteriores
export async function restorePurchases(): Promise<{ success: boolean; error?: string; restored: number }> {
  try {
    if (!iapAvailable) {
      return { success: false, error: 'IAP não disponível', restored: 0 };
    }
    
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        for (const purchase of results) {
            const platform = Platform.OS as 'android' | 'ios';
            const token = platform === 'android' ? purchase.purchaseToken : purchase.transactionReceipt;
            if (token) {
                 // Valida cada compra restaurada com o backend
                await validateSubscription(platform, token, purchase.productId);
            }
        }
        return { success: true, restored: results.length };
    }
    return { success: false, error: 'Nenhuma compra encontrada para restaurar', restored: 0 };

  } catch (error: any) {
    console.error('Erro ao restaurar compras:', error);
    return { success: false, error: error.message, restored: 0 };
  }
}

// 5. Encerra a conexão
export async function endConnection(): Promise<void> {
  try {
    if (iapAvailable) {
      await InAppPurchases.disconnectAsync();
      iapAvailable = false;
      console.log('Conexão com IAP encerrada.');
    }
  } catch (error) {
    console.error('Erro ao encerrar a conexão IAP:', error);
  }
}
