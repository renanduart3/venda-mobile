import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const PREMIUM_KEY = 'is_premium_v1';
const EXPIRY_DATE_KEY = 'premium_expiry_date';
const PLATFORM_KEY = 'premium_platform';
const PRODUCT_ID_KEY = 'premium_product_id';

export interface PremiumStatus {
  isPremium: boolean;
  hasLifetimeAccess?: boolean;
  expiryDate?: string;
  platform?: 'android' | 'ios';
  productId?: string;
}

const LAST_DB_CHECK_KEY = 'premium_db_check_ms';

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
): Promise<{ success: boolean; error?: string; status?: PremiumStatus }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    // Simple fallback: if no auth or no backend configured, trust store restore locally
    if (!user || !supabaseUrl) {
      // set a conservative expiry based on product
      const now = new Date();
      const addDays = productId?.toLowerCase().includes('year') ? 365 : 31;
      const expiry = new Date(now.getTime() + addDays * 24 * 60 * 60 * 1000).toISOString();
      await enablePremium(expiry, platform, productId);
      return {
        success: true,
        status: {
          isPremium: true,
          expiryDate: expiry,
          platform,
          productId,
        },
      };
    }

    const apiUrl = `${supabaseUrl}/functions/v1/validate-iap`;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey || '',
      },
      body: JSON.stringify({
        platform,
        purchaseToken,
        productId,
        userId: user.id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Validation failed: ${errorText}` };
    }

    const result = await response.json();

    if (result.is_premium) {
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
      await disablePremium();
      return {
        success: false,
        error: result.error || 'Subscription is not active',
      };
    }
  } catch (e) {
    console.error('Error validating subscription', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function checkSubscriptionFromDatabase(): Promise<{ success: boolean; status?: PremiumStatus }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false };
    }

    const { data, error } = await supabase
      .from('iap_status')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription from database', error);
      return { success: false };
    }

    if (data && (data.is_premium || data.has_lifetime_access)) {
      const expiryDate = data.expiry_date;
      const hasLifetime = !!data.has_lifetime_access;

      // Se tiver acesso vitalício, ignorar expiração
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
