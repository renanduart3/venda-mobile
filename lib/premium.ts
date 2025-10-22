import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const PREMIUM_KEY = 'is_premium_v1';
const EXPIRY_DATE_KEY = 'premium_expiry_date';
const PLATFORM_KEY = 'premium_platform';
const PRODUCT_ID_KEY = 'premium_product_id';

export interface PremiumStatus {
  isPremium: boolean;
  expiryDate?: string;
  platform?: 'android' | 'ios';
  productId?: string;
}

// Cache para evitar múltiplas chamadas
let premiumCache: boolean | null = null;

export async function isPremium(): Promise<boolean> {
  try {
    // Verificar status real do premium
    const v = await AsyncStorage.getItem(PREMIUM_KEY);
    if (v === '1') {
      const expiryDate = await AsyncStorage.getItem(EXPIRY_DATE_KEY);
      if (expiryDate) {
        const expiry = new Date(expiryDate);
        const now = new Date();
        if (expiry <= now) {
          await disablePremium();
          return false;
        }
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error reading premium flag', e);
    return false;
  }
}

export async function getPremiumStatus(): Promise<PremiumStatus> {
  try {
    const isPremiumFlag = await AsyncStorage.getItem(PREMIUM_KEY);
    const expiryDate = await AsyncStorage.getItem(EXPIRY_DATE_KEY);
    const platform = await AsyncStorage.getItem(PLATFORM_KEY);
    const productId = await AsyncStorage.getItem(PRODUCT_ID_KEY);

    if (isPremiumFlag === '1' && expiryDate) {
      const expiry = new Date(expiryDate);
      const now = new Date();
      if (expiry <= now) {
        await disablePremium();
        return { isPremium: false };
      }
    }

    return {
      isPremium: isPremiumFlag === '1',
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
  productId?: string
) {
  try {
    await AsyncStorage.setItem(PREMIUM_KEY, '1');
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

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return { success: false, error: 'Supabase URL not configured' };
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

    if (data && data.is_premium) {
      const expiryDate = data.expiry_date;
      if (expiryDate) {
        const expiry = new Date(expiryDate);
        const now = new Date();
        if (expiry <= now) {
          await disablePremium();
          return { success: true, status: { isPremium: false } };
        }
      }

      await enablePremium(data.expiry_date, data.platform, data.product_id);
      return {
        success: true,
        status: {
          isPremium: true,
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
