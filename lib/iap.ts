import { Platform } from 'react-native';
// IMPORTANT: Avoid static importing react-native-iap.
// In Expo Go (no native nitro modules), requiring RN IAP will throw
// "Failed to get NitroModules" at module evaluation time. We dynamically
// require it only when NitroModules are available.
// Use loose runtime-only types to avoid importing from react-native-iap at module scope
type IAPProduct = any;
type Purchase = any;
type SubscriptionPurchase = any;
import { validateSubscription } from './premium';

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

export interface PurchaseResult {
  success: boolean;
  error?: string;
}

let iapAvailable = false;
// Use loose types to avoid importing functions/types at module scope
let purchaseUpdateSubscription: { remove?: () => void } | null = null;
let purchaseErrorSubscription: { remove?: () => void } | null = null;
const purchaseResultQueue: Array<(result: PurchaseResult) => void> = [];

// Cache for the dynamically loaded module
let RNIap: any | null = null;

function hasNitroModules(): boolean {
  // react-native-nitro-modules registers global NitroModules in new arch builds
  return typeof (globalThis as any).NitroModules !== 'undefined';
}

function tryLoadIap(): any | null {
  if (!hasNitroModules()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-iap');
    return mod;
  } catch (_e) {
    return null;
  }
}

function mapProduct(product: IAPProduct): Product {
  return {
    productId: (product as any).productId,
    title: product.title ?? '',
    description: product.description ?? '',
    price: String((product as any).price ?? ''),
    localizedPrice: String(((product as any).localizedPrice ?? (product as any).price) ?? ''),
    currency: product.currency ?? '',
    type: 'subs',
  };
}

function resolveNextPurchase(result: PurchaseResult) {
  const resolver = purchaseResultQueue.shift();
  if (resolver) {
    resolver(result);
  }
}

async function processPurchase(
  purchase: Purchase | SubscriptionPurchase,
  source: 'purchase' | 'restore'
): Promise<PurchaseResult> {
  try {
    const transactionReceipt = purchase.transactionReceipt;
    const productId = Array.isArray(purchase.productId)
      ? purchase.productId[0]
      : purchase.productId;

    if (!transactionReceipt) {
      throw new Error('Missing transaction receipt');
    }

    if (!productId) {
      throw new Error('Missing product identifier');
    }

  await RNIap!.finishTransaction({ purchase, isConsumable: false });

    const platform: 'android' | 'ios' = Platform.OS === 'ios' ? 'ios' : 'android';
    const subscriptionPurchase = purchase as SubscriptionPurchase;
    const purchaseToken =
      platform === 'ios'
        ? transactionReceipt
        : subscriptionPurchase.purchaseToken;

    if (!purchaseToken) {
      throw new Error('Missing purchase token');
    }

    const validation = await validateSubscription(platform, purchaseToken, productId);

    if (!validation.success) {
      throw new Error(validation.error || 'Subscription validation failed');
    }

    return { success: true };
  } catch (error) {
    console.error(`Error processing ${source} purchase:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function initializeIAP(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('IAP not available on web');
    return false;
  }

  try {
    RNIap = tryLoadIap();
    if (!RNIap) {
      console.warn('IAP disabled: NitroModules not available (likely running in Expo Go).');
      iapAvailable = false;
      return false;
    }

    const {
      initConnection,
      flushFailedPurchasesCachedAsPendingAndroid,
      clearTransactionIOS,
      purchaseUpdatedListener,
      purchaseErrorListener,
      finishTransaction,
    } = RNIap;

    const connected = await initConnection();

    if (!connected) {
      console.warn('Failed to initialize IAP connection');
      return false;
    }

    if (Platform.OS === 'android') {
      await flushFailedPurchasesCachedAsPendingAndroid?.();
    } else if (Platform.OS === 'ios') {
      await clearTransactionIOS?.();
    }

    purchaseUpdateSubscription?.remove?.();
    purchaseErrorSubscription?.remove?.();

    purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: any) => {
      const result = await processPurchase(purchase as any, 'purchase');
      if (!result.success) {
        resolveNextPurchase(result);
      } else {
        resolveNextPurchase({ success: true });
      }
    });

    purchaseErrorSubscription = purchaseErrorListener((error: any) => {
      console.error('Purchase error:', error);
      resolveNextPurchase({
        success: false,
        error: error.message,
      });
    });

    iapAvailable = true;
    return true;
  } catch (error) {
    console.error('Error initializing IAP:', error);
    iapAvailable = false;
    return false;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    if (!iapAvailable) {
      console.log('IAP not initialized');
      return [];
    }

    const { getSubscriptions } = RNIap!;
    const products = await getSubscriptions({ skus: SKUS });
    return products.map(mapProduct);
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

export async function purchaseSubscription(productId: string): Promise<PurchaseResult> {
  if (!iapAvailable) {
    return { success: false, error: 'IAP not available' };
  }

  if (Platform.OS === 'web') {
    return { success: false, error: 'Purchases not available on web' };
  }

  return new Promise(async (resolve) => {
    purchaseResultQueue.push(resolve);

    try {
      const { requestSubscription } = RNIap!;
      await requestSubscription({ sku: productId });
    } catch (error) {
      purchaseResultQueue.pop();
      console.error('Error requesting subscription:', error);
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

export async function restorePurchases(): Promise<{ success: boolean; error?: string; restored: number }> {
  if (!iapAvailable) {
    return { success: false, error: 'IAP not available', restored: 0 };
  }

  if (Platform.OS === 'web') {
    return { success: false, error: 'Restore not available on web', restored: 0 };
  }

  try {
    const { getAvailablePurchases, finishTransaction } = RNIap!;
    const purchases = await getAvailablePurchases();
    let restored = 0;
    let lastError: string | undefined;

    for (const purchase of purchases) {
      const result = await processPurchase(purchase as any, 'restore');
      if (result.success) {
        restored += 1;
      } else {
        lastError = result.error;
      }
    }

    if (restored > 0) {
      return { success: true, restored };
    }

    return {
      success: false,
      restored: 0,
      error: lastError || 'No purchases available to restore',
    };
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
    purchaseUpdateSubscription?.remove?.();
    purchaseErrorSubscription?.remove?.();
    purchaseUpdateSubscription = null;
    purchaseErrorSubscription = null;

    if (iapAvailable && RNIap) {
      const { endConnection } = RNIap;
      await endConnection?.();
    }
  } catch (error) {
    console.error('Error ending IAP connection:', error);
  } finally {
    iapAvailable = false;
  }
}
