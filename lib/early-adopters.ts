/**
 * Early Adopter System
 *
 * Primeiros 1000 clientes: R$9,90/mês ou R$99/ano — para sempre (desde que mantenham ativa).
 * Após os 1000: R$15/mês ou R$120/ano.
 */

import { supabase } from './supabase';

// Cache em memória para evitar bater no banco toda vez que a tela de planos abre.
// TTL de 5 minutos — suficiente para o realtime fazer o trabalho pesado.
let _earlyAdopterCache: { status: EarlyAdopterStatus; expiresAt: number } | null = null;
const EARLY_ADOPTER_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

// Configuração dos preços
export const PRICING = {
  MONTHLY: {
    earlyAdopter: 9.90,  // Primeiros 1000 usuários — para sempre
    regular: 25.00,      // Após os 1000 primeiros
  },
  YEARLY: {
    earlyAdopter: 99.00, // Primeiros 1000 usuários — para sempre
    regular: 199.00,     // Após os 1000 primeiros
  },
  TOTAL_EARLY_ADOPTER_SLOTS: 1000,
  INITIAL_FAKE_COUNT: 20, // Contador mínimo exibido enquanto o banco carrega
};

export interface EarlyAdopterStatus {
  totalSlots: number;
  currentCount: number;
  slotsRemaining: number;
  isAvailable: boolean;
}

export interface UserSubscriptionInfo {
  isEarlyAdopter: boolean;
  discountPercentage: number;
  originalPrice: number;
  discountedPrice: number;
}

/**
 * Verifica se ainda há vagas para early adopters.
 * Cache de memória de 5 minutos — o Realtime em planos.tsx mantém o contador
 * atualizado em tempo real sem precisar rebater no banco a cada foco de tela.
 */
export async function checkEarlyAdopterAvailability(): Promise<EarlyAdopterStatus | null> {
  // Retorna do cache se ainda válido
  if (_earlyAdopterCache && Date.now() < _earlyAdopterCache.expiresAt) {
    return _earlyAdopterCache.status;
  }

  try {
    // Tenta via RPC primeiro
    const { data, error } = await supabase
      .rpc('get_early_adopter_status');

    if (!error && data && data.length > 0) {
      _earlyAdopterCache = { status: data[0], expiresAt: Date.now() + EARLY_ADOPTER_CACHE_TTL_MS };
      return data[0];
    }

    // Fallback: lê direto da tabela se a RPC falhar (ex: timeout no Free tier)
    const { data: configData, error: configError } = await supabase
      .from('early_adopter_config')
      .select('total_slots, current_count')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (configError || !configData) {
      console.error('Erro ao verificar vagas early adopter:', configError);
      return null;
    }

    const slotsRemaining = configData.total_slots - configData.current_count;
    const status: EarlyAdopterStatus = {
      totalSlots: configData.total_slots,
      currentCount: configData.current_count,
      slotsRemaining,
      isAvailable: slotsRemaining > 0,
    };
    _earlyAdopterCache = { status, expiresAt: Date.now() + EARLY_ADOPTER_CACHE_TTL_MS };
    return status;
  } catch (error) {
    console.error('Erro ao verificar early adopter:', error);
    return null;
  }
}

/**
 * Invalida o cache de early adopter (chamado pelo Realtime quando o banco atualiza).
 */
export function invalidateEarlyAdopterCache(): void {
  _earlyAdopterCache = null;
}

/**
 * Reivindica um slot de early adopter (deve ser chamado ao processar compra)
 */
export async function claimEarlyAdopterSlot(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('claim_early_adopter_slot');

    if (error) {
      console.error('Erro ao reivindicar slot early adopter:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Erro ao reivindicar early adopter:', error);
    return false;
  }
}

/**
 * Calcula o preço com aumento de 90% após early adopters
 */
export function calculateRegularPrice(earlyAdopterPrice: number, increasePercentage: number = PRICING.INCREASE_PERCENTAGE): number {
  return Math.round(earlyAdopterPrice * (100 + increasePercentage) / 100 * 100) / 100;
}

/**
 * Obtém o preço correto baseado no status de early adopter
 */
export function getPriceForUser(productId: string, isEarlyAdopter: boolean): number {
  if (productId.includes('monthly')) {
    return isEarlyAdopter ? PRICING.MONTHLY.earlyAdopter : PRICING.MONTHLY.regular;
  } else if (productId.includes('yearly')) {
    return isEarlyAdopter ? PRICING.YEARLY.earlyAdopter : PRICING.YEARLY.regular;
  }
  return 0;
}

/**
 * Formata preço em Real brasileiro
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

/**
 * Obtém informações de assinatura do usuário (incluindo status early adopter)
 */
export async function getUserSubscriptionInfo(userId: string): Promise<UserSubscriptionInfo | null> {
  try {
    const { data, error } = await supabase
      .from('iap_status')
      .select('is_early_adopter, discount_percentage, original_price, discounted_price')
      .eq('user_id', userId)
      .eq('is_premium', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      isEarlyAdopter: data.is_early_adopter || false,
      discountPercentage: data.discount_percentage || 0,
      originalPrice: data.original_price || 0,
      discountedPrice: data.discounted_price || 0,
    };
  } catch (error) {
    console.error('Erro ao obter info de assinatura:', error);
    return null;
  }
}

/**
 * Verifica se o usuário já é um early adopter
 */
export async function isUserEarlyAdopter(userId: string): Promise<boolean> {
  const info = await getUserSubscriptionInfo(userId);
  return info?.isEarlyAdopter || false;
}

/**
 * Verifica se o usuário foi um early adopter mas cancelou a assinatura.
 * Nesses casos, não deve mais ter direito ao preço de lançamento.
 */
export async function checkUserIsFormerEarlyAdopter(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('iap_status')
      .select('is_early_adopter, is_premium')
      .eq('user_id', user.id)
      .maybeSingle();

    // Tinha vaga de early adopter mas a assinatura não está mais ativa
    return data?.is_early_adopter === true && data?.is_premium === false;
  } catch {
    return false;
  }
}

/**
 * Retorna mensagem de disponibilidade para UI
 */
export function getAvailabilityMessage(status: EarlyAdopterStatus | null): string {
  if (!status || !status.isAvailable) {
    return 'Vagas encerradas — preço regular ativo';
  }

  const remaining = status.slotsRemaining;
  const current = status.currentCount;

  if (remaining <= 10) {
    return `⚡ ÚLTIMAS ${remaining} VAGAS com preço de lançamento para sempre!`;
  } else if (remaining <= 100) {
    return `🔥 Apenas ${remaining} vagas restantes — garanta R$9,90/mês para sempre!`;
  } else {
    return `🎉 ${current}/${status.totalSlots} early adopters — garanta seu preço fixo para sempre!`;
  }
}

/**
 * Retorna informações completas para exibição na UI
 */
export interface PricingDisplayInfo {
  originalPrice: number;
  currentPrice: number;
  discountPercentage: number;
  isEarlyAdopterPrice: boolean;
  availabilityMessage: string;
  slotsRemaining: number;
  showUrgency: boolean;
}

export async function getPricingDisplayInfo(productId: string): Promise<PricingDisplayInfo> {
  const status = await checkEarlyAdopterAvailability();
  const isMonthly = productId.includes('monthly');

  const earlyAdopterPrice = isMonthly ? PRICING.MONTHLY.earlyAdopter : PRICING.YEARLY.earlyAdopter;
  const regularPrice = isMonthly ? PRICING.MONTHLY.regular : PRICING.YEARLY.regular;

  const isAvailable = status?.isAvailable || false;
  const currentPrice = isAvailable ? earlyAdopterPrice : regularPrice;
  const slotsRemaining = status?.slotsRemaining || 0;

  return {
    originalPrice: regularPrice,
    currentPrice,
    discountPercentage: isAvailable ? PRICING.INCREASE_PERCENTAGE : 0,
    isEarlyAdopterPrice: isAvailable,
    availabilityMessage: getAvailabilityMessage(status),
    slotsRemaining,
    showUrgency: slotsRemaining <= 50,
  };
}
