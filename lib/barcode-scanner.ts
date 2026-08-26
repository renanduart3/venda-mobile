import { NativeModules, Platform } from 'react-native';

type NativeBarcodeScanner = {
  openScanner(): Promise<string | null>;
};

const { BarcodeScannerModule } = NativeModules as {
  BarcodeScannerModule?: NativeBarcodeScanner;
};

export async function scanBarcode(): Promise<string | null> {
  if (Platform.OS !== 'android') {
    throw new Error('Scanner disponível apenas no Android.');
  }

  if (!BarcodeScannerModule) {
    throw new Error('Módulo nativo de scanner não encontrado.');
  }

  return BarcodeScannerModule.openScanner();
}
