import { Platform } from 'react-native';
// react-native-iap v14 usa named exports individuais, nao um objeto default.
// Fazemos import dinamico para nao quebrar no Expo Go (sem NitroModules).
import { validateSubscription } from './premium';

// SKUs reais do Google Play Console
export const PRODUCT_IDS = {
  MONTHLY: 'premium_monthly_plan',
  ANNUAL: 'premium_yearly_plan',
};

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

export interface PurchaseResult {
  success: boolean;
  error?: string;
}

let iapAvailable = false;
let purchaseUpdateSubscription: { remove?: () => void } | null = null;
let purchaseErrorSubscription: { remove?: () => void } | null = null;
const purchaseResultQueue: Array<(result: PurchaseResult) => void> = [];

// Modulo carregado dinamicamente (named exports do rn-iap v14)
let iap: any = null;

// Cache de produtos buscados — evita re-fetch na hora da compra
const productCache = new Map<string, any>();

function tryLoadIap(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-iap');
    // Valida que o modulo tem as funcoes essenciais do v14
    if (mod && typeof mod.initConnection === 'function') {
      return mod;
    }
    console.warn('[IAP] Modulo carregado mas initConnection nao encontrado. Exports:', Object.keys(mod || {}).slice(0, 10));
    return null;
  } catch (e) {
    console.warn('[IAP] react-native-iap nao disponivel:', e);
    return null;
  }
}

function resolveNextPurchase(result: PurchaseResult) {
  const resolver = purchaseResultQueue.shift();
  if (resolver) resolver(result);
}

async function processPurchase(purchase: any, source: 'purchase' | 'restore'): Promise<PurchaseResult> {
  try {
    const productId = Array.isArray(purchase.productId)
      ? purchase.productId[0]
      : purchase.productId;

    if (!productId) throw new Error('Missing product identifier');

    // v14: finishTransaction e uma named export
    await iap.finishTransaction({ purchase, isConsumable: false });

    const platform: 'android' | 'ios' = Platform.OS === 'ios' ? 'ios' : 'android';
    const purchaseToken = platform === 'ios'
      ? purchase.transactionReceipt
      : purchase.purchaseToken;

    if (!purchaseToken) throw new Error('Missing purchase token');

    const validation = await validateSubscription(platform, purchaseToken, productId);
    if (!validation.success) throw new Error(validation.error || 'Subscription validation failed');

    return { success: true };
  } catch (error) {
    console.error(`[IAP] Error processing ${source} purchase:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function initializeIAP(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    iap = tryLoadIap();
    if (!iap) {
      console.warn('[IAP] Modulo nao disponivel. Possivelmente Expo Go ou build sem New Arch.');
      iapAvailable = false;
      return false;
    }

    // v14: initConnection e named export
    const connected = await iap.initConnection();
    console.log('[IAP] initConnection result:', connected);

    if (Platform.OS === 'android') {
      await iap.flushFailedPurchasesCachedAsPendingAndroid?.();
    } else if (Platform.OS === 'ios') {
      await iap.clearTransactionIOS?.();
    }

    // Limpar listeners anteriores
    purchaseUpdateSubscription?.remove?.();
    purchaseErrorSubscription?.remove?.();

    // v14: purchaseUpdatedListener e named export
    purchaseUpdateSubscription = iap.purchaseUpdatedListener(async (purchase: any) => {
      console.log('[IAP] purchaseUpdated:', purchase?.productId);
      const result = await processPurchase(purchase, 'purchase');
      resolveNextPurchase(result);
    });

    purchaseErrorSubscription = iap.purchaseErrorListener((error: any) => {
      console.error('[IAP] purchaseError:', error);
      resolveNextPurchase({ success: false, error: error.message });
    });

    iapAvailable = true;
    console.log('[IAP] Inicializado com sucesso!');

    // Pre-fetch dos produtos para cachear offerTokens (Play Billing v5+)
    // No rn-iap v14 Nitro: campo 'id' (nao 'productId'), 'subscriptionOfferDetailsAndroid'
    try {
      const fetchFn = iap.fetchProducts ?? iap.getSubscriptions;
      if (fetchFn) {
        const products = await fetchFn({ skus: SKUS, type: 'subs' });
        (products ?? []).forEach((p: any) => {
          const pid = p.id ?? p.productId;
          productCache.set(pid, p);
          const offerDetails = p.subscriptionOfferDetailsAndroid ?? p.subscriptionOfferDetails ?? p.subscriptionOffers ?? p.offers;
          console.log(`[IAP] Produto cacheado: ${pid} — offerDetails length: ${offerDetails?.length}`);
          if (offerDetails?.length > 0) {
            console.log(`[IAP] offerToken para ${pid}:`, offerDetails[0].offerToken?.substring(0, 30));
          } else {
            console.warn(`[IAP] Sem offerToken para ${pid}`);
          }
        });
      }
    } catch (cacheError) {
      console.warn('[IAP] Erro no pre-fetch de produtos (nao critico):', cacheError);
    }

    return true;
  } catch (error) {
    console.error('[IAP] Erro ao inicializar:', error);
    iapAvailable = false;
    return false;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    if (!iapAvailable || !iap) return [];

    // v14: fetchProducts (unificado) ou getSubscriptions
    const fetchFn = iap.fetchProducts ?? iap.getSubscriptions;
    if (!fetchFn) {
      console.warn('[IAP] fetchProducts/getSubscriptions nao encontrado');
      return [];
    }

    const products = await fetchFn({ skus: SKUS });
    return (products ?? []).map((product: any) => ({
      productId: product.productId,
      title: product.title ?? '',
      description: product.description ?? '',
      price: String(product.price ?? ''),
      localizedPrice: String(product.localizedPrice ?? product.price ?? ''),
      currency: product.currency ?? '',
      type: 'subs' as const,
    }));
  } catch (error) {
    console.error('[IAP] Error getting products:', error);
    return [];
  }
}

export async function purchaseSubscription(productId: string): Promise<PurchaseResult> {
  if (!iapAvailable || !iap) {
    return { success: false, error: 'IAP not available' };
  }

  if (Platform.OS === 'web') {
    return { success: false, error: 'Purchases not available on web' };
  }

  return new Promise(async (resolve) => {
    purchaseResultQueue.push(resolve);

    try {
      const requestFn = iap.requestPurchase;

      if (!requestFn) {
        purchaseResultQueue.pop();
        console.error('[IAP] requestPurchase nao encontrado');
        resolve({ success: false, error: 'requestPurchase nao disponivel nesta versao do IAP' });
        return;
      }

      let offerToken: string | undefined;

      // No Android precisamos extrair o offerToken, no iOS nao
      if (Platform.OS === 'android') {
        try {
          // Busca no cache populado no initializeIAP
          // rn-iap v14 Nitro: chave 'id', token em subscriptionOfferDetailsAndroid
          let product = productCache.get(productId);

          if (!product) {
            // Fallback: busca direta na Play Store
            const fetchFn = iap.fetchProducts ?? iap.getSubscriptions;
            if (fetchFn) {
              const products = await fetchFn({ skus: [productId], type: 'subs' });
              product = products?.find((p: any) => (p.id ?? p.productId) === productId)
                ?? products?.[0];
              if (product) productCache.set(productId, product);
            }
          }

          // Extrai offerToken — campo correto no rn-iap v14 eh subscriptionOfferDetailsAndroid
          const offerDetails =
            product?.subscriptionOfferDetailsAndroid ??
            product?.subscriptionOfferDetails ??
            product?.subscriptionOffers ??
            product?.offers;

          if (offerDetails?.length > 0) {
            offerToken = offerDetails[0].offerToken ?? offerDetails[0].token;
            console.log('[IAP] offerToken obtido:', offerToken?.substring(0, 30));
          } else {
            console.warn('[IAP] offerToken nao encontrado. Produto:', JSON.stringify(product));
          }
        } catch (fetchError) {
          console.warn('[IAP] Erro ao obter offerToken:', fetchError);
        }
      }

      // A API do rn-iap v14 unificou as plataformas. O formato exigido em requestPurchase eh:
      // requestPurchase({ type: 'subs', request: { apple: {...}, google: {...} } })

      const purchaseConfig: any = {
        type: 'subs',
        request: {}
      };

      if (Platform.OS === 'android') {
        purchaseConfig.request.google = {
          skus: [productId],
        };
        if (offerToken) {
          purchaseConfig.request.google.subscriptionOffers = [{ sku: productId, offerToken }];
        } else {
          console.warn('[IAP] Sem offerToken — a compra pode falhar no Android');
        }
      } else {
        purchaseConfig.request.apple = {
          sku: productId,
          andDangerouslyFinishTransactionAutomatically: false,
        };
      }

      console.log('[IAP] Chamando requestPurchase com:', JSON.stringify(purchaseConfig));
      await requestFn(purchaseConfig);
    } catch (error) {
      purchaseResultQueue.pop();
      console.error('[IAP] Error requesting purchase:', error);
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

export async function restorePurchases(): Promise<{ success: boolean; error?: string; restored: number }> {
  if (!iapAvailable || !iap) {
    return { success: false, error: 'IAP not available', restored: 0 };
  }

  try {
    const getAvailable = iap.getAvailablePurchases;
    if (!getAvailable) return { success: false, error: 'getAvailablePurchases nao disponivel', restored: 0 };

    const purchases = await getAvailable();
    let restored = 0;
    let lastError: string | undefined;

    for (const purchase of (purchases ?? [])) {
      const result = await processPurchase(purchase, 'restore');
      if (result.success) {
        restored += 1;
      } else {
        lastError = result.error;
      }
    }

    if (restored > 0) return { success: true, restored };
    return { success: false, restored: 0, error: lastError || 'No purchases available to restore' };
  } catch (error) {
    console.error('[IAP] Error restoring purchases:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      restored: 0,
    };
  }
}

export async function endConnection(): Promise<void> {
  try {
    purchaseUpdateSubscription?.remove?.();
    purchaseErrorSubscription?.remove?.();
    purchaseUpdateSubscription = null;
    purchaseErrorSubscription = null;

    if (iapAvailable && iap?.endConnection) {
      await iap.endConnection();
    }
  } catch (error) {
    console.error('[IAP] Error ending connection:', error);
  } finally {
    iapAvailable = false;
  }
}
