import { NativeModules, Platform } from 'react-native';

type NativeBarcodeScanner = {
  openScanner(productsJson: string | null): Promise<
    Array<{
      barcode: string | null;
      quantity: number;
      notFound: boolean;
    }> | null
  >;
};

const { BarcodeScannerModule } = NativeModules as {
  BarcodeScannerModule?: NativeBarcodeScanner;
};

export interface ScanResult {
  barcode: string;
  quantity: number;
  notFound: boolean;
}

/**
 * Opens the native barcode scanner activity.
 *
 * When `products` is provided (sale mode), the scanner runs in multi-item mode:
 * the user can scan multiple barcodes and confirm each one. Returns a list of
 * all confirmed items when the user taps "Ir para o carrinho".
 *
 * When `products` is omitted (single-scan mode, e.g. product registration),
 * the scanner closes after the first confirmation and returns a single-item array.
 *
 * @param products Optional list of products (barcode + name) for the scanner to display product info.
 * @returns Array of ScanResult or null if the user cancelled without scanning anything.
 */
export async function scanBarcode(
  products?: Array<{ barcode?: string; name: string }>
): Promise<ScanResult[] | null> {
  if (Platform.OS !== 'android') {
    throw new Error('Scanner disponível apenas no Android.');
  }

  if (!BarcodeScannerModule) {
    throw new Error('Módulo nativo de scanner não encontrado.');
  }

  const productsJson = products
    ? JSON.stringify(
        products
          .filter(p => p.barcode && p.barcode.trim())
          .map(p => ({ barcode: p.barcode!.trim(), name: p.name }))
      )
    : null;

  const results = await BarcodeScannerModule.openScanner(productsJson);
  if (!results || results.length === 0) return null;

  return results
    .filter(r => r.barcode && r.barcode.trim())
    .map(r => ({
      barcode: r.barcode!.trim(),
      quantity: r.quantity ?? 1,
      notFound: r.notFound ?? false,
    }));
}
