import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const PREMIUM_KEY = 'is_premium_v1';
const EXPIRY_DATE_KEY = 'premium_expiry_date';
const PLATFORM_KEY = 'premium_platform';
const PRODUCT_ID_KEY = 'premium_product_id';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const LOG_FULL_CLIENT_TOKENS = process.env.EXPO_PUBLIC_IAP_LOG_FULL_TOKENS === 'true';
const AUTH_DEBUG_ENABLED =
  process.env.EXPO_PUBLIC_IAP_AUTH_DEBUG === 'true' ||
  (typeof __DEV__ !== 'undefined' && __DEV__);
const PENDING_IAP_VALIDATION_KEY = 'pending_iap_validation_v1';
const VALIDATE_IAP_AUTH_MODE_KEY = 'validate_iap_auth_mode_v1';
let refreshSessionInFlight: ReturnType<typeof supabase.auth.refreshSession> | null = null;
const inFlightSubscriptionValidations = new Map<string, Promise<PremiumValidationResult>>();

export type PremiumValidationReason = 'auth' | 'inactive' | 'infra';

export interface PremiumStatus {
  isPremium: boolean;
  hasLifetimeAccess?: boolean;
  expiryDate?: string;
  platform?: 'android' | 'ios';
  productId?: string;
}

const LAST_DB_CHECK_KEY = 'premium_db_check_ms';

export interface PremiumValidationResult {
  success: boolean;
  error?: string;
  status?: PremiumStatus;
  reason?: PremiumValidationReason;
}

function isInvalidJwtMessage(message?: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('invalid jwt') || normalized.includes('jwt expired');
}

function isSessionAuthErrorMessage(message?: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('sessão inválida') ||
    normalized.includes('sessao invalida') ||
    normalized.includes('falha ao renovar sessao') ||
    normalized.includes('usuário não autenticado') ||
    normalized.includes('usuario nao autenticado')
  );
}

function isLegacyLifetimeProductId(productId?: string | null): boolean {
  if (!productId) return false;
  const normalized = productId.toLowerCase();
  return normalized.includes('lifetime') || normalized.includes('vitalicio');
}

function isManualGrantToken(purchaseToken?: string | null): boolean {
  if (!purchaseToken) return false;
  return purchaseToken.toLowerCase().startsWith('manual_grant_');
}

function normalizeToken(token?: string | null): string {
  return (token || '').trim();
}

function isAnonKeyToken(token?: string | null): boolean {
  const normalized = normalizeToken(token);
  if (!normalized || !SUPABASE_ANON_KEY) return false;
  return normalized === SUPABASE_ANON_KEY;
}

function summarizeTokenForLog(token?: string | null): string {
  if (!token) return '<empty>';
  if (LOG_FULL_CLIENT_TOKENS) return token;

  const normalized = String(token);
  if (normalized.length <= 16) {
    return `${normalized} (len=${normalized.length})`;
  }

  return `${normalized.slice(0, 10)}...${normalized.slice(-6)} (len=${normalized.length})`;
}

function logAuthDebug(message: string, details?: unknown) {
  if (!AUTH_DEBUG_ENABLED) return;
  if (details !== undefined) {
    console.log(`[AUTH DEBUG] ${message}`, details);
    return;
  }
  console.log(`[AUTH DEBUG] ${message}`);
}

function getValidationKey(platform: 'android' | 'ios', purchaseToken: string, productId: string): string {
  return `${platform}:${productId}:${purchaseToken}`;
}

interface PendingIapValidation {
  platform: 'android' | 'ios';
  purchaseToken: string;
  productId: string;
  savedAtMs: number;
}

export async function savePendingIapValidation(
  platform: 'android' | 'ios',
  purchaseToken: string,
  productId: string
): Promise<void> {
  try {
    const payload: PendingIapValidation = {
      platform,
      purchaseToken,
      productId,
      savedAtMs: Date.now(),
    };

    await AsyncStorage.setItem(PENDING_IAP_VALIDATION_KEY, JSON.stringify(payload));
    logPremium('warn', 'cache', 'Compra pendente de sincronizacao salva localmente.', {
      platform,
      productId,
      purchaseToken: summarizeTokenForLog(purchaseToken),
    });
  } catch (error) {
    logPremium('error', 'infra', 'Falha ao salvar compra pendente para sincronizacao.', error);
  }
}

async function readPendingIapValidation(): Promise<PendingIapValidation | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_IAP_VALIDATION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PendingIapValidation;
    if (!parsed?.platform || !parsed?.purchaseToken || !parsed?.productId) {
      await AsyncStorage.removeItem(PENDING_IAP_VALIDATION_KEY);
      return null;
    }

    return parsed;
  } catch {
    await AsyncStorage.removeItem(PENDING_IAP_VALIDATION_KEY);
    return null;
  }
}

async function clearPendingIapValidation(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_IAP_VALIDATION_KEY);
}

export async function syncPendingIapValidationIfAny(): Promise<void> {
  const pending = await readPendingIapValidation();
  if (!pending) return;

  logPremium('log', 'cache', 'Tentando sincronizar compra pendente com validate-iap.', {
    platform: pending.platform,
    productId: pending.productId,
    purchaseToken: summarizeTokenForLog(pending.purchaseToken),
    ageMs: Date.now() - pending.savedAtMs,
  });

  const result = await validateSubscription(pending.platform, pending.purchaseToken, pending.productId);
  if (result.success) {
    await clearPendingIapValidation();
    logPremium('log', 'cache', 'Compra pendente sincronizada com sucesso no backend.', {
      platform: pending.platform,
      productId: pending.productId,
    });
    return;
  }

  logPremium('warn', 'infra', 'Compra pendente ainda nao sincronizou; sera tentado novamente.', {
    platform: pending.platform,
    productId: pending.productId,
    error: result.error,
  });
}

async function refreshSessionLocked(): Promise<Awaited<ReturnType<typeof supabase.auth.refreshSession>>> {
  if (refreshSessionInFlight) {
    return await refreshSessionInFlight;
  }

  const refreshPromise = supabase.auth.refreshSession();
  refreshSessionInFlight = refreshPromise;
  try {
    return await refreshPromise;
  } finally {
    if (refreshSessionInFlight === refreshPromise) {
      refreshSessionInFlight = null;
    }
  }
}

async function extractFunctionErrorMessage(error: any): Promise<string> {
  const baseMessage = error?.message || 'Falha ao validar assinatura na Edge Function.';
  const ctx = error?.context;

  if (!ctx || typeof ctx.text !== 'function') {
    return baseMessage;
  }

  try {
    const rawBody = await ctx.text();
    if (!rawBody) {
      return baseMessage;
    }

    let details = rawBody;
    try {
      const parsed = JSON.parse(rawBody);
      details = parsed?.error || parsed?.message || rawBody;
    } catch {
      // keep raw body when it is not JSON
    }

    const status = typeof ctx.status === 'number' ? `HTTP ${ctx.status}` : 'HTTP ?';
    return `${baseMessage} (${status}) ${details}`;
  } catch {
    return baseMessage;
  }
}

async function extractHttpErrorMessage(response: Response): Promise<string> {
  const baseMessage = `Falha ao validar assinatura na Edge Function. (HTTP ${response.status})`;

  try {
    const rawBody = await response.text();
    if (!rawBody) {
      return baseMessage;
    }

    try {
      const parsed = JSON.parse(rawBody);
      const details = parsed?.error || parsed?.message || rawBody;
      return `${baseMessage} ${details}`;
    } catch {
      return `${baseMessage} ${rawBody}`;
    }
  } catch {
    return baseMessage;
  }
}

type ValidateIapAuthMode = 'authorization-user-jwt' | 'authorization-anon-with-x-user-jwt';

function isValidateIapAuthMode(value?: string | null): value is ValidateIapAuthMode {
  return value === 'authorization-user-jwt' || value === 'authorization-anon-with-x-user-jwt';
}

async function getPreferredValidateIapAuthMode(): Promise<ValidateIapAuthMode> {
  try {
    const savedMode = await AsyncStorage.getItem(VALIDATE_IAP_AUTH_MODE_KEY);
    if (isValidateIapAuthMode(savedMode)) {
      return savedMode;
    }
  } catch {
    // ignore cache read failures
  }

  // Defaulting to anon+X-User-JWT avoids an extra 401 roundtrip on gateways
  // that reject user JWT in Authorization for function ingress validation.
  return 'authorization-anon-with-x-user-jwt';
}

async function savePreferredValidateIapAuthMode(mode: ValidateIapAuthMode): Promise<void> {
  try {
    await AsyncStorage.setItem(VALIDATE_IAP_AUTH_MODE_KEY, mode);
  } catch {
    // ignore cache write failures
  }
}

async function postValidateIapRequest(payload: {
  platform: 'android' | 'ios';
  purchaseToken: string;
  productId: string;
}, normalizedAccessToken: string, userIdHint: string | undefined, authMode: ValidateIapAuthMode) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY as string,
    'X-Auth-Mode': authMode,
  };

  if (authMode === 'authorization-user-jwt') {
    headers.Authorization = `Bearer ${normalizedAccessToken}`;
  } else {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    headers['X-User-JWT'] = normalizedAccessToken;
  }

  const requestBody = authMode === 'authorization-anon-with-x-user-jwt'
    ? { ...payload, sessionJwt: normalizedAccessToken }
    : payload;

  logAuthDebug('token sendo enviado', {
    authMode,
    len: normalizedAccessToken.length,
    prefix: normalizedAccessToken.slice(0, 20),
    isAnonKey: isAnonKeyToken(normalizedAccessToken),
  });

  logPremium('log', 'cache', 'Chamando validate-iap via HTTP.', {
    platform: payload.platform,
    productId: payload.productId,
    userId: userIdHint,
    authMode,
    purchaseToken: summarizeTokenForLog(payload.purchaseToken),
    accessToken: summarizeTokenForLog(normalizedAccessToken),
    tokenMatchesAnonKey: isAnonKeyToken(normalizedAccessToken),
  });

  const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-iap`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    return {
      data: undefined,
      errorMessage: await extractHttpErrorMessage(response),
    };
  }

  return {
    data: await response.json(),
    errorMessage: undefined as string | undefined,
  };
}

async function postValidateIapWithAccessToken(payload: {
  platform: 'android' | 'ios';
  purchaseToken: string;
  productId: string;
}, accessToken: string, userIdHint?: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      data: undefined,
      errorMessage: 'Supabase não configurado no app para validar assinatura.',
    };
  }

  const normalizedAccessToken = normalizeToken(accessToken);
  if (!normalizedAccessToken) {
    return {
      data: undefined,
      errorMessage: 'JWT de sessão ausente para chamar validate-iap.',
    };
  }

  if (isAnonKeyToken(normalizedAccessToken)) {
    return {
      data: undefined,
      errorMessage: 'JWT inválido para validate-iap: o token da sessão corresponde à anon key.',
    };
  }

  const preferredMode = await getPreferredValidateIapAuthMode();
  const secondaryMode: ValidateIapAuthMode = preferredMode === 'authorization-user-jwt'
    ? 'authorization-anon-with-x-user-jwt'
    : 'authorization-user-jwt';

  const attemptOrder: ValidateIapAuthMode[] = [preferredMode, secondaryMode];
  let lastAttempt: { data: any; errorMessage?: string } | null = null;

  for (const authMode of attemptOrder) {
    const attempt = await postValidateIapRequest(
      payload,
      normalizedAccessToken,
      userIdHint,
      authMode
    );

    if (!attempt.errorMessage) {
      await savePreferredValidateIapAuthMode(authMode);
      return attempt;
    }

    if (!isInvalidJwtMessage(attempt.errorMessage)) {
      return attempt;
    }

    lastAttempt = attempt;
    logPremium('warn', 'infra', `Gateway rejeitou modo ${authMode}; tentando fallback de transporte.`, {
      platform: payload.platform,
      productId: payload.productId,
      userId: userIdHint,
    });
  }

  return lastAttempt || {
    data: undefined,
    errorMessage: 'Falha desconhecida ao chamar validate-iap.',
  };
}

async function getFreshAccessContext(forceRefresh = false): Promise<{ accessToken?: string; userId?: string; errorMessage?: string }> {
  let sessionResult;

  if (forceRefresh) {
    const refreshed = await refreshSessionLocked();
    if (refreshed.error) {
      return {
        errorMessage: `Falha ao renovar sessao para chamar validate-iap: ${refreshed.error.message}`,
      };
    }
    sessionResult = refreshed.data.session;
  } else {
    const { data } = await supabase.auth.getSession();
    sessionResult = data.session;
  }

  logAuthDebug('session info', {
    forceRefresh,
    hasSession: !!sessionResult,
    accessTokenLen: sessionResult?.access_token?.length,
    userId: sessionResult?.user?.id,
    userEmail: sessionResult?.user?.email,
    expiresAt: sessionResult?.expires_at,
  });

  const accessToken = normalizeToken(sessionResult?.access_token);
  if ((!accessToken || !sessionResult?.user?.id) && !forceRefresh) {
    logPremium('warn', 'auth', 'Sessao ausente ao chamar validate-iap; tentando refresh forçado.', {
      hasSession: !!sessionResult,
      userId: sessionResult?.user?.id,
      accessToken: summarizeTokenForLog(accessToken),
    });
    return getFreshAccessContext(true);
  }

  if (!accessToken || !sessionResult?.user?.id) {
    return {
      errorMessage: 'Sessão inválida para chamar validate-iap.',
    };
  }

  if (isAnonKeyToken(accessToken)) {
    if (!forceRefresh) {
      logPremium('warn', 'auth', 'Token de sessão bate com anon key; tentando refresh forçado.', {
        userId: sessionResult.user.id,
        accessToken: summarizeTokenForLog(accessToken),
      });
      return getFreshAccessContext(true);
    }

    return {
      errorMessage: 'Sessão inválida para validate-iap: token recebido corresponde à anon key.',
    };
  }

  const expiresAt = typeof sessionResult.expires_at === 'number' ? sessionResult.expires_at : 0;
  const nowSec = Math.floor(Date.now() / 1000);
  if (!forceRefresh && expiresAt > 0 && expiresAt - nowSec <= 60) {
    return getFreshAccessContext(true);
  }

  return {
    accessToken,
    userId: sessionResult.user.id,
  };
}

async function invokeValidateIapWithRetry(payload: {
  platform: 'android' | 'ios';
  purchaseToken: string;
  productId: string;
}) {
  const invokeOnce = async (forceRefresh = false) => {
    const ctx = await getFreshAccessContext(forceRefresh);
    if (!ctx.accessToken || !ctx.userId) {
      return {
        data: undefined,
        errorMessage: ctx.errorMessage || 'Sessão inválida para chamar validate-iap.',
      };
    }

    const httpAttempt = await postValidateIapWithAccessToken(payload, ctx.accessToken, ctx.userId);
    if (!httpAttempt.errorMessage) {
      return httpAttempt;
    }

    if (!isInvalidJwtMessage(httpAttempt.errorMessage)) {
      return httpAttempt;
    }

    return httpAttempt;
  };

  const firstAttempt = await invokeOnce(false);
  if (!firstAttempt.errorMessage) {
    return firstAttempt;
  }

  if (!isInvalidJwtMessage(firstAttempt.errorMessage)) {
    return firstAttempt;
  }

  logPremium('warn', 'infra', 'JWT invalido ao chamar validate-iap; tentando refresh e retry.', {
    platform: payload.platform,
    productId: payload.productId,
  });

  return invokeOnce(true);
}

function logPremium(level: 'log' | 'warn' | 'error', reason: PremiumValidationReason | 'cache', message: string, details?: unknown) {
  const prefix = `[Premium][${reason.toUpperCase()}] ${message}`;
  const writer = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (details !== undefined) {
    writer(prefix, details);
    return;
  }
  writer(prefix);
}

export async function isPremium(forceRefresh = false): Promise<boolean> {
  try {
    const nowMs = Date.now();
    const lastCheckStr = await AsyncStorage.getItem(LAST_DB_CHECK_KEY);
    const lastCheckMs = lastCheckStr ? parseInt(lastCheckStr) : 0;

    // Timeout de 24 horas = 24 * 60 * 60 * 1000 = 86400000 ms
    const TWENTY_FOUR_HOURS = 86400000;
    const isCacheExpired = nowMs - lastCheckMs > TWENTY_FOUR_HOURS;

    // Se o TTL de 24h venceu OU o usuário forçou a atualização na tela de config
    if (isCacheExpired || forceRefresh) {
      const dbResult = await checkSubscriptionFromDatabase();

      // Se a infraestrutura falhar (timeout/DNS/offline) NÃO DESTRUA O CACHE:
      // O Supabase retorna { success: false } quando há erro de conexão (Catch block interno)
      // MAS CUIDADO: Precisamos garantir que não barramos o usuário por erro de rede.
      if (dbResult.success) {
        // Sucesso = conseguiu falar com o Supabase com 100% de clareza

        // Vamos checar agora as regras do banco puro que nos retornou
        if (dbResult.status?.isPremium === true) {
          await AsyncStorage.setItem(LAST_DB_CHECK_KEY, nowMs.toString());
          return true;
        } else if (dbResult.status?.isPremium === false) {
          await AsyncStorage.setItem(LAST_DB_CHECK_KEY, nowMs.toString());
          return false;
        }
      }
    }

    // Camada de avaliação CACHED (Entrará aqui sempre que < 24h, OU se a chamada acima deu erro de rede - Tratamento Offline)
    const isPremiumFlag = await AsyncStorage.getItem(PREMIUM_KEY);
    const hasLifetimeFlag = await AsyncStorage.getItem('has_lifetime_v1');
    const expiryDateStr = await AsyncStorage.getItem(EXPIRY_DATE_KEY);

    // Regra A: Vitalício anotado no cache local passa instantâneo
    if (hasLifetimeFlag === '1') {
      return true;
    }

    // Regra B: Assinatura temporal ativa no cache local  
    if (isPremiumFlag === '1') {
      if (!expiryDateStr) {
        // Flag premium ativa, mas data perdida. Tratado como erro fatal de memória. Rebaixa
        await disablePremium();
        return false;
      }

      const expiry = new Date(expiryDateStr);
      if (expiry > new Date()) {
        return true; // Dentro da validade local
      } else {
        // O cache expirou pela data de hoje.
        // MAS ele tentou bater no banco no bloco if anterior e... falhou (se desaguou aqui de novo).
        // Ponto de segurança (Boa fé offline): Ele foi renovado e não sincronizou? Ou ele perdeu? 
        // Confiamos cegamente no Cache e mantemos habilitado até a internet dele voltar e dbResult voltar {success: true}
        return true;
      }
    }

    return false;
  } catch (e) {
    console.error('Error centralized premium check', e);
    // Erro de runtime. Tentamos um último resgate na camada de memória.
    const isPremiumFlag = await AsyncStorage.getItem(PREMIUM_KEY);
    return isPremiumFlag === '1';
  }
}

export async function getPremiumStatus(): Promise<PremiumStatus> {
  try {
    const isPremiumFlag = await AsyncStorage.getItem(PREMIUM_KEY);
    const hasLifetimeFlag = await AsyncStorage.getItem('has_lifetime_v1');
    const expiryDate = await AsyncStorage.getItem(EXPIRY_DATE_KEY);
    const platform = await AsyncStorage.getItem(PLATFORM_KEY);
    const productId = await AsyncStorage.getItem(PRODUCT_ID_KEY);

    const hasLifetimeAccess = hasLifetimeFlag === '1';

    if (isPremiumFlag === '1' && expiryDate && !hasLifetimeAccess) {
      const expiry = new Date(expiryDate);
      const now = new Date();
      if (expiry <= now) {
        await disablePremium();
        return { isPremium: false };
      }
    }

    return {
      isPremium: isPremiumFlag === '1',
      hasLifetimeAccess,
      expiryDate: expiryDate || undefined,
      platform: (platform as 'android' | 'ios') || undefined,
      productId: productId || undefined,
    };
  } catch (e) {
    console.error('Error reading premium status', e);
    return { isPremium: false };
  }
}

export async function enablePremium(
  expiryDate?: string,
  platform?: 'android' | 'ios',
  productId?: string,
  hasLifetimeAccess?: boolean
) {
  try {
    await AsyncStorage.setItem(PREMIUM_KEY, '1');
    if (hasLifetimeAccess) {
      await AsyncStorage.setItem('has_lifetime_v1', '1');
    } else {
      await AsyncStorage.removeItem('has_lifetime_v1');
    }
    if (expiryDate) {
      await AsyncStorage.setItem(EXPIRY_DATE_KEY, expiryDate);
    }
    if (platform) {
      await AsyncStorage.setItem(PLATFORM_KEY, platform);
    }
    if (productId) {
      await AsyncStorage.setItem(PRODUCT_ID_KEY, productId);
    }
    return true;
  } catch (e) {
    console.error('Error enabling premium', e);
    return false;
  }
}

export async function disablePremium() {
  try {
    await AsyncStorage.removeItem(PREMIUM_KEY);
    await AsyncStorage.removeItem('has_lifetime_v1');
    await AsyncStorage.removeItem(EXPIRY_DATE_KEY);
    await AsyncStorage.removeItem(PLATFORM_KEY);
    await AsyncStorage.removeItem(PRODUCT_ID_KEY);
    return true;
  } catch (e) {
    console.error('Error disabling premium', e);
    return false;
  }
}

// Função de teste removida para produção

export async function validateSubscription(
  platform: 'android' | 'ios',
  purchaseToken: string,
  productId: string
): Promise<PremiumValidationResult> {
  const validationKey = getValidationKey(platform, purchaseToken, productId);
  const inFlight = inFlightSubscriptionValidations.get(validationKey);
  if (inFlight) {
    logPremium('log', 'cache', 'Reutilizando validacao em andamento para a mesma compra.', {
      platform,
      productId,
      purchaseToken: summarizeTokenForLog(purchaseToken),
    });
    return inFlight;
  }

  const validationPromise = performValidateSubscription(platform, purchaseToken, productId);
  inFlightSubscriptionValidations.set(validationKey, validationPromise);

  try {
    return await validationPromise;
  } finally {
    const activePromise = inFlightSubscriptionValidations.get(validationKey);
    if (activePromise === validationPromise) {
      inFlightSubscriptionValidations.delete(validationKey);
    }
  }
}

async function performValidateSubscription(
  platform: 'android' | 'ios',
  purchaseToken: string,
  productId: string
): Promise<PremiumValidationResult> {
  try {
    logPremium('log', 'cache', 'Iniciando validacao de assinatura.', {
      platform,
      productId,
      purchaseToken: summarizeTokenForLog(purchaseToken),
    });

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      logPremium('warn', 'auth', 'Tentativa de validar assinatura sem usuario autenticado.', { platform, productId });
      return {
        success: false,
        error: 'Usuário não autenticado para validar assinatura.',
        reason: 'auth',
      };
    }

    const { data: result, errorMessage } = await invokeValidateIapWithRetry({
      platform,
      purchaseToken,
      productId,
    });

    if (errorMessage) {
      const reason: PremiumValidationReason = isSessionAuthErrorMessage(errorMessage)
        ? 'auth'
        : 'infra';

      logPremium(reason === 'auth' ? 'warn' : 'error', reason, 'Edge Function validate-iap retornou erro.', {
        platform,
        productId,
        purchaseToken: summarizeTokenForLog(purchaseToken),
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        reason,
      };
    }

    if (!result) {
      return {
        success: false,
        error: 'Resposta vazia da Edge Function validate-iap.',
        reason: 'infra',
      };
    }

    if (result.is_premium) {
      logPremium('log', 'cache', 'Assinatura validada como ativa na loja.', {
        platform,
        productId,
        expiryDate: result.expiry_date,
      });
      await enablePremium(result.expiry_date, platform, productId);
      return {
        success: true,
        status: {
          isPremium: true,
          expiryDate: result.expiry_date,
          platform,
          productId,
        },
      };
    } else {
      logPremium('warn', 'inactive', 'Loja retornou assinatura inativa.', {
        platform,
        productId,
        error: result.error,
      });
      await disablePremium();
      return {
        success: true,
        status: {
          isPremium: false,
          expiryDate: result.expiry_date,
          platform,
          productId,
        },
        error: result.error || 'Subscription is not active',
        reason: 'inactive',
      };
    }
  } catch (e) {
    logPremium('error', 'infra', 'Falha inesperada ao validar assinatura.', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      reason: 'infra',
    };
  }
}

export async function checkSubscriptionFromDatabase(options?: { skipStoreRevalidation?: boolean }): Promise<{ success: boolean; status?: PremiumStatus }> {
  try {
    const skipStoreRevalidation = !!options?.skipStoreRevalidation;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false };
    }

    await syncPendingIapValidationIfAny();

    const { data, error } = await supabase
      .from('iap_status')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription from database', error);
      return { success: false };
    }

    const hasExplicitLifetime = !!data?.has_lifetime_access;
    const isManualLifetimeGrantRecord =
      isLegacyLifetimeProductId(data?.product_id) ||
      isManualGrantToken(data?.purchase_token);

    const hasLegacyLifetime = !hasExplicitLifetime && !!data?.is_premium && isManualLifetimeGrantRecord;
    const hasLifetimeAccess = hasExplicitLifetime || hasLegacyLifetime;

    // Lifetime access: no store re-verification needed
    if (hasLifetimeAccess) {
      if (hasLegacyLifetime) {
        logPremium('warn', 'cache', 'SKU legacy de lifetime detectado sem has_lifetime_access; tratando como vitalicio.', {
          productId: data?.product_id,
        });
      }

      await enablePremium(data.expiry_date, data.platform, data.product_id, true);
      return {
        success: true,
        status: {
          isPremium: true,
          hasLifetimeAccess: true,
          expiryDate: data.expiry_date,
          platform: data.platform,
          productId: data.product_id,
        },
      };
    }

    if (isManualLifetimeGrantRecord && !hasLifetimeAccess) {
      logPremium('warn', 'cache', 'Registro manual/lifetime detectado sem premium ativo; pulando revalidacao de loja.', {
        productId: data?.product_id,
      });
    }

    // Re-validate against Google Play / Apple using the stored purchase token.
    // This is the critical path: it ensures that cancelled or expired subscriptions
    // are detected within the 24-hour TTL window, not just trusted from the DB.
    if (!skipStoreRevalidation && !hasLifetimeAccess && !isManualLifetimeGrantRecord && data?.is_premium === true && data?.purchase_token && data?.platform && data?.product_id) {
      logPremium('log', 'cache', `Revalidando token salvo contra a loja ${data.platform}.`, {
        productId: data.product_id,
      });
      const revalidation = await validateSubscription(
        data.platform as 'android' | 'ios',
        data.purchase_token,
        data.product_id
      );

      // validateSubscription already calls enablePremium / disablePremium internally
      // and updates the DB via the Edge Function, so we just forward the result.
      if (revalidation.success) {
        return { success: true, status: revalidation.status };
      }

      // Only infrastructure errors fall through here.
      // Fall through to the DB-cached value as a graceful degradation so
      // we don't lock out paying users due to a temporary backend failure.
      logPremium('warn', 'infra', 'Falha de infraestrutura na revalidacao; usando cache do banco.', {
        platform: data.platform,
        productId: data.product_id,
        error: revalidation.error,
      });
    }

    // Fallback: trust the DB value (offline / no stored token)
    if (data && (data.is_premium || data.has_lifetime_access)) {
      const expiryDate = data.expiry_date;
      const hasLifetime = !!data.has_lifetime_access;

      if (!hasLifetime && expiryDate) {
        const expiry = new Date(expiryDate);
        const now = new Date();
        if (expiry <= now) {
          await disablePremium();
          return { success: true, status: { isPremium: false } };
        }
      }

      await enablePremium(data.expiry_date, data.platform, data.product_id, hasLifetime);
      return {
        success: true,
        status: {
          isPremium: true,
          hasLifetimeAccess: hasLifetime,
          expiryDate: data.expiry_date,
          platform: data.platform,
          productId: data.product_id,
        },
      };
    } else {
      await disablePremium();
      return { success: true, status: { isPremium: false } };
    }
  } catch (e) {
    console.error('Error checking subscription from database', e);
    return { success: false };
  }
}
