/**
 * Early Adopter System
 * 
 * Gerencia o programa de early adopters - primeiros 300 usuários com 90% de desconto lifetime
 */

import { supabase } from './supabase';

// Configuração dos preços
export const PRICING = {
  MONTHLY: {
    earlyAdopter: 9.90,  // Primeiros 300 usuários
    regular: 19.99,      // Após 300 usuários (aumento de 90%)
  },
  YEARLY: {
    earlyAdopter: 99.90, // Primeiros 300 usuários
    regular: 199.99,     // Após 300 usuários (aumento de 90%)
  },
  INCREASE_PERCENTAGE: 90,
  TOTAL_EARLY_ADOPTER_SLOTS: 300,
  INITIAL_FAKE_COUNT: 20, // Contador começa em 20 (fake)
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
 * Verifica se ainda há vagas para early adopters
 */
export async function checkEarlyAdopterAvailability(): Promise<EarlyAdopterStatus | null> {
  try {
    // Tenta via RPC primeiro
    const { data, error } = await supabase
      .rpc('get_early_adopter_status');

    if (!error && data && data.length > 0) {
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
    return {
      totalSlots: configData.total_slots,
      currentCount: configData.current_count,
      slotsRemaining,
      isAvailable: slotsRemaining > 0,
    };
  } catch (error) {
    console.error('Erro ao verificar early adopter:', error);
    return null;
  }
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
 * Retorna mensagem de disponibilidade para UI
 */
export function getAvailabilityMessage(status: EarlyAdopterStatus | null): string {
  if (!status || !status.isAvailable) {
    return 'Preço aumentou - Vagas encerradas';
  }

  const remaining = status.slotsRemaining;
  const current = status.currentCount;

  if (remaining <= 10) {
    return `⚡ ÚLTIMAS ${remaining} VAGAS com preço especial!`;
  } else if (remaining <= 50) {
    return `🔥 Apenas ${remaining} vagas com preço de lançamento`;
  } else {
    return `🎉 ${current}/${status.totalSlots} usuários - Garanta o preço de lançamento!`;
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
