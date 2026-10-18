import { Capacitor } from "@capacitor/core";
import { BarcodeFormat, BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { t } from "@sellora/shared/i18n";

export class ScanCancelled extends Error {}

/** En el celular escaneamos con ML Kit (rápido, funciona con poca luz). En el navegador se usa <WebScanner />. */
export const hasNativeScanner = (): boolean => Capacitor.isNativePlatform();

/** Abre el escáner nativo y devuelve el texto del primer QR leído. */
export async function scanNative(): Promise<string> {
  const { camera } = await BarcodeScanner.requestPermissions();
  if (camera !== "granted" && camera !== "limited") throw new Error(t("caja.permission"));

  // En Android el escáner de Google es un módulo que puede faltar la primera vez.
  if (Capacitor.getPlatform() === "android") {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) await BarcodeScanner.installGoogleBarcodeScannerModule();
  }

  const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
  const value = barcodes[0]?.rawValue;
  if (!value) throw new ScanCancelled();
  return value;
}
