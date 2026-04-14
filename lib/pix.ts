// ─── PIX helpers — padrão EMV / Banco Central do Brasil ──────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

const PIX_QR_CACHE_KEY = '@pix_qr_cache';

export function emv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
}

export function crc16(str: string): string {
  let crc = 0xffff;
  for (const char of str) {
    crc ^= char.charCodeAt(0) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera o payload PIX (EMV).
 * Se `amount` não for informado (ou for 0), gera um QR estático sem valor —
 * o pagador digita o valor no app do banco. Ideal para reuso entre vendas.
 */
export function generatePixPayload(
  pixKey: string,
  merchantName: string,
  amount?: number,
): string {
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .substring(0, 25)
    .trim() || 'LOJA';

  const mai = emv('26', emv('00', 'br.gov.bcb.pix') + emv('01', pixKey));

  const fields: string[] = [
    emv('00', '01'),
    mai,
    emv('52', '0000'),
    emv('53', '986'),
  ];

  if (amount && amount > 0) {
    fields.push(emv('54', amount.toFixed(2)));
  }

  fields.push(
    emv('58', 'BR'),
    emv('59', cleanName),
    emv('60', 'BRASIL'),
    emv('62', emv('05', '***')),
    '6304',
  );

  const payload = fields.join('');
  return payload + crc16(payload);
}

/** Lê as chaves PIX dos settings da loja (retorna array vazio se não configurado). */
export function parsePixKeys(rawValue: any): string[] {
  try {
    const arr: string[] = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    return (arr ?? []).filter((k: string) => typeof k === 'string' && k.trim().length > 0);
  } catch {
    return [];
  }
}

// ─── Cache persistente de QR codes por chave ─────────────────────────────────
// Um QR estático por chave PIX. Só é regenerado se a chave mudar.

async function loadCache(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(PIX_QR_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveCache(cache: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(PIX_QR_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

/**
 * Retorna o payload QR para a chave PIX, usando cache persistente.
 * Gera e armazena automaticamente se ainda não existir.
 */
export async function getOrGeneratePixQR(
  pixKey: string,
  merchantName: string,
): Promise<string> {
  const cache = await loadCache();
  if (cache[pixKey]) return cache[pixKey];

  const payload = generatePixPayload(pixKey, merchantName);
  cache[pixKey] = payload;
  await saveCache(cache);
  return payload;
}

/**
 * Invalida o cache de uma ou mais chaves PIX.
 * Chamado quando o usuário altera/remove uma chave nas configurações.
 * Se `keys` não for informado, limpa todo o cache.
 */
export async function invalidatePixQRCache(keys?: string[]): Promise<void> {
  if (!keys) {
    await AsyncStorage.removeItem(PIX_QR_CACHE_KEY);
    return;
  }
  const cache = await loadCache();
  keys.forEach(k => delete cache[k]);
  await saveCache(cache);
}
