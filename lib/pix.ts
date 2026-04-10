// ─── PIX helpers — padrão EMV / Banco Central do Brasil ──────────────────────

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

export function generatePixPayload(
  pixKey: string,
  amount: number,
  merchantName: string,
): string {
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .substring(0, 25)
    .trim() || 'LOJA';

  const amountStr = amount.toFixed(2);
  const mai = emv('26', emv('00', 'br.gov.bcb.pix') + emv('01', pixKey));

  const payload = [
    emv('00', '01'),
    mai,
    emv('52', '0000'),
    emv('53', '986'),
    emv('54', amountStr),
    emv('58', 'BR'),
    emv('59', cleanName),
    emv('60', 'BRASIL'),
    emv('62', emv('05', '***')),
    '6304',
  ].join('');

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
