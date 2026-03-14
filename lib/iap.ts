import { Platform } from 'react-native';
// react-native-iap v14 usa named exports individuais, nao um objeto default.
// Fazemos import dinamico para nao quebrar no Expo Go (sem NitroModules).
import { enablePremium, savePendingIapValidation, validateSubscription } from './premium';
import { supabase } from './supabase';

export type PurchaseFailureReason = 'cancelled' | 'auth' | 'config' | 'validation' | 'infra';

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
  cancelled?: boolean;
  reason?: PurchaseFailureReason;
}

let iapAvailable = false;
let purchaseUpdateSubscription: { remove?: () => void } | null = null;
let purchaseErrorSubscription: { remove?: () => void } | null = null;
const purchaseResultQueue: Array<(result: PurchaseResult) => void> = [];

const RECENT_PURCHASE_EVENT_TTL_MS = 120000;
const recentPurchaseEvents = new Map<string, number>();

// Modulo carregado dinamicamente (named exports do rn-iap v14)
let iap: any = null;

// Cache de produtos buscados — evita re-fetch na hora da compra
const productCache = new Map<string, any>();

function logIap(level: 'log' | 'warn' | 'error', reason: 'lifecycle' | PurchaseFailureReason, message: string, details?: unknown) {
  const prefix = `[IAP][${reason.toUpperCase()}] ${message}`;
  const writer = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (details !== undefined) {
    writer(prefix, details);
    return;
  }
  writer(prefix);
}

function getIapErrorMessage(error: any): string {
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return 'Unknown error';
}

async function getAuthSnapshotForIap() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    return {
      hasSession: !!session,
      accessTokenLen: session?.access_token?.length,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      expiresAt: session?.expires_at,
    };
  } catch (error) {
    return {
      hasSession: false,
      authSnapshotError: error instanceof Error ? error.message : 'unknown',
    };
  }
}

function tryLoadIap(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-iap');
    // Valida que o modulo tem as funcoes essenciais do v14
    if (mod && typeof mod.initConnection === 'function') {
      return mod;
    }
    logIap('warn', 'config', 'Modulo IAP carregado sem initConnection.', Object.keys(mod || {}).slice(0, 10));
    return null;
  } catch (e) {
    logIap('warn', 'config', 'react-native-iap nao disponivel.', e);
    return null;
  }
}

function resolveNextPurchase(result: PurchaseResult) {
  const resolver = purchaseResultQueue.shift();
  if (resolver) resolver(result);
}

function buildPurchaseEventKey(purchase: any): string {
  const productId = Array.isArray(purchase?.productId)
    ? purchase.productId[0]
    : (purchase?.productId ?? purchase?.id ?? 'unknown-product');

  const platform: 'android' | 'ios' = Platform.OS === 'ios' ? 'ios' : 'android';
  const rawToken = platform === 'ios'
    ? (purchase?.transactionReceipt ?? purchase?.transactionId)
    : (purchase?.purchaseToken ?? purchase?.transactionId);

  const token = typeof rawToken === 'string' ? rawToken : String(rawToken ?? 'no-token');
  return `${platform}:${productId}:${token}`;
}

function shouldSkipDuplicatePurchaseEvent(purchase: any): boolean {
  const now = Date.now();

  // Cleanup opportunistic to avoid unbounded growth.
  for (const [key, seenAt] of recentPurchaseEvents.entries()) {
    if (now - seenAt > RECENT_PURCHASE_EVENT_TTL_MS) {
      recentPurchaseEvents.delete(key);
    }
  }

  const eventKey = buildPurchaseEventKey(purchase);
  const seenAt = recentPurchaseEvents.get(eventKey);
  if (seenAt && now - seenAt <= RECENT_PURCHASE_EVENT_TTL_MS) {
    return true;
  }

  recentPurchaseEvents.set(eventKey, now);
  return false;
}

function isPurchaseCancelled(error: any): boolean {
  const code = String(error?.code ?? '').toLowerCase();
  const message = String(error?.message ?? '').toLowerCase();

  return (
    code === 'user-cancelled' ||
    code === 'user_cancelled' ||
    code === 'e_user_cancelled' ||
    message.includes('user cancelled')
  );
}

function classifyIapError(error: any): PurchaseFailureReason {
  if (isPurchaseCancelled(error)) {
    return 'cancelled';
  }

  const code = String(error?.code ?? '').toLowerCase();
  const message = String(error?.message ?? '').toLowerCase();

  const configCodes = new Set([
    'billing-unavailable',
    'item-unavailable',
    'developer-error',
    'feature-not-supported',
    'e_billing_unavailable',
    'e_item_unavailable',
    'e_developer_error',
    'e_feature_not_supported',
  ]);

  const infraCodes = new Set([
    'service-error',
    'service-disconnected',
    'network-error',
    'timeout',
    'e_service_error',
    'e_service_disconnected',
    'e_network_error',
  ]);

  if (configCodes.has(code) || message.includes('billing unavailable') || message.includes('item unavailable')) {
    return 'config';
  }

  if (infraCodes.has(code) || message.includes('network') || message.includes('timeout') || message.includes('service disconnected')) {
    return 'infra';
  }

  return 'validation';
}

function buildPurchaseFailure(reason: PurchaseFailureReason, error?: string): PurchaseResult {
  return {
    success: false,
    cancelled: reason === 'cancelled',
    reason,
    error: reason === 'cancelled' ? undefined : error,
  };
}

function removePendingPurchaseResolver(resolver: (result: PurchaseResult) => void) {
  const lastResolver = purchaseResultQueue[purchaseResultQueue.length - 1];
  if (lastResolver === resolver) {
    purchaseResultQueue.pop();
  }
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
    if (!validation.success) {
      const reason = validation.reason === 'auth' ? 'auth' : 'infra';
      logIap(reason === 'infra' ? 'error' : 'warn', reason, `Falha ao validar compra via loja durante ${source}.`, {
        productId,
        platform,
        error: validation.error,
      });

      // Se a loja confirmou a compra, mas o backend falhou por infra,
      // liberamos premium localmente para nao bloquear usuario pagante.
      if (reason === 'infra') {
        const normalizedProductId = String(productId).toLowerCase();
        const isLifetimeProduct = normalizedProductId.includes('lifetime') || normalizedProductId.includes('vitalicio');
        const fallbackDays = isLifetimeProduct
          ? 3650
          : (normalizedProductId.includes('year') || normalizedProductId.includes('annual') ? 366 : 31);
        const fallbackExpiry = new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000).toISOString();

        await savePendingIapValidation(platform, purchaseToken, productId);
        await enablePremium(fallbackExpiry, platform, productId, isLifetimeProduct);
        logIap('warn', 'infra', `Premium liberado via fallback local durante ${source}.`, {
          productId,
          platform,
          fallbackExpiry,
        });
        return { success: true };
      }

      return buildPurchaseFailure(reason, validation.error || 'Subscription validation failed');
    }
    if (!validation.status?.isPremium) {
      logIap('warn', 'validation', `Compra recebida, mas assinatura nao esta ativa na loja durante ${source}.`, {
        productId,
        platform,
        error: validation.error,
      });
      return buildPurchaseFailure('validation', validation.error || 'Subscription is not active');
    }

    logIap('log', 'lifecycle', `Compra validada com sucesso durante ${source}.`, { productId, platform });
    return { success: true };
  } catch (error) {
    const reason = classifyIapError(error);
    logIap(reason === 'infra' ? 'error' : 'warn', reason, `Erro inesperado ao processar ${source}.`, error);
    return buildPurchaseFailure(reason, getIapErrorMessage(error));
  }
}

export async function initializeIAP(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    iap = tryLoadIap();
    if (!iap) {
      logIap('warn', 'config', 'Modulo IAP indisponivel. Possivelmente Expo Go ou build sem New Arch.');
      iapAvailable = false;
      return false;
    }

    // v14: initConnection e named export
    const connected = await iap.initConnection();
    logIap('log', 'lifecycle', 'initConnection executado.', { connected });

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
      if (shouldSkipDuplicatePurchaseEvent(purchase)) {
        logIap('warn', 'lifecycle', 'purchaseUpdated duplicado ignorado.', {
          productId: purchase?.productId,
        });
        return;
      }

      const authSnapshot = await getAuthSnapshotForIap();
      logIap('log', 'lifecycle', 'Snapshot de auth no purchaseUpdated.', authSnapshot);

      logIap('log', 'lifecycle', 'purchaseUpdated recebido.', { productId: purchase?.productId });
      const result = await processPurchase(purchase, 'purchase');
      resolveNextPurchase(result);
    });

    purchaseErrorSubscription = iap.purchaseErrorListener((error: any) => {
      if (isPurchaseCancelled(error)) {
        logIap('log', 'cancelled', 'Fluxo de compra cancelado pelo usuario.');
        resolveNextPurchase(buildPurchaseFailure('cancelled'));
        return;
      }

      const reason = classifyIapError(error);
      logIap(reason === 'infra' ? 'error' : 'warn', reason, 'Listener de erro da loja retornou falha.', error);
      resolveNextPurchase(buildPurchaseFailure(reason, getIapErrorMessage(error)));
    });

    iapAvailable = true;
    logIap('log', 'lifecycle', 'IAP inicializado com sucesso.');

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
          logIap('log', 'lifecycle', `Produto cacheado: ${pid}.`, { offerCount: offerDetails?.length });
          if (offerDetails?.length > 0) {
            logIap('log', 'lifecycle', `offerToken carregado para ${pid}.`, offerDetails[0].offerToken?.substring(0, 30));
          } else {
            logIap('warn', 'config', `Produto ${pid} sem offerToken.`);
          }
        });
      }
    } catch (cacheError) {
      logIap('warn', 'infra', 'Erro no pre-fetch de produtos.', cacheError);
    }

    return true;
  } catch (error) {
    logIap('error', 'infra', 'Falha ao inicializar IAP.', error);
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
      logIap('warn', 'config', 'fetchProducts/getSubscriptions nao encontrado.');
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
    logIap('error', 'infra', 'Erro ao carregar produtos da loja.', error);
    return [];
  }
}

export async function purchaseSubscription(productId: string): Promise<PurchaseResult> {
  if (!iapAvailable || !iap) {
    return buildPurchaseFailure('config', 'IAP not available');
  }

  if (Platform.OS === 'web') {
    return buildPurchaseFailure('config', 'Purchases not available on web');
  }

  return new Promise(async (resolve) => {
    purchaseResultQueue.push(resolve);

    try {
      const requestFn = iap.requestPurchase;

      if (!requestFn) {
        removePendingPurchaseResolver(resolve);
        logIap('warn', 'config', 'requestPurchase nao encontrado no modulo IAP.');
        resolve(buildPurchaseFailure('config', 'requestPurchase nao disponivel nesta versao do IAP'));
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
            logIap('log', 'lifecycle', 'offerToken obtido para compra.', offerToken?.substring(0, 30));
          } else {
            logIap('warn', 'config', 'offerToken nao encontrado para o produto.', { productId, product });
          }
        } catch (fetchError) {
          logIap('warn', 'infra', 'Erro ao obter offerToken.', fetchError);
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
          logIap('warn', 'config', 'Compra Android sem offerToken; a loja pode rejeitar o fluxo.', { productId });
        }
      } else {
        purchaseConfig.request.apple = {
          sku: productId,
          andDangerouslyFinishTransactionAutomatically: false,
        };
      }

      logIap('log', 'lifecycle', 'Chamando requestPurchase.', purchaseConfig);
      await requestFn(purchaseConfig);
    } catch (error) {
      removePendingPurchaseResolver(resolve);

      if (isPurchaseCancelled(error)) {
        logIap('log', 'cancelled', 'Request de compra cancelado pelo usuario.');
        resolve(buildPurchaseFailure('cancelled'));
        return;
      }

      const reason = classifyIapError(error);
      logIap(reason === 'infra' ? 'error' : 'warn', reason, 'Falha ao iniciar requestPurchase.', error);
      resolve(buildPurchaseFailure(reason, getIapErrorMessage(error)));
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
    logIap('error', 'infra', 'Erro ao restaurar compras.', error);
    return {
      success: false,
      error: getIapErrorMessage(error),
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
    logIap('warn', 'infra', 'Erro ao encerrar conexao IAP.', error);
  } finally {
    iapAvailable = false;
  }
}
