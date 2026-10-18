import { Capacitor } from "@capacitor/core";
import {
  BarcodeFormat,
  BarcodeScanner,
  GoogleBarcodeScannerModuleInstallState,
} from "@capacitor-mlkit/barcode-scanning";
import { t } from "@sellora/shared/i18n";

export class ScanCancelled extends Error {}
/** El escáner nativo no se pudo preparar (sin Google Play Services o sin internet): usar la cámara del WebView. */
export class ScannerUnavailable extends Error {}

/** En el celular escaneamos con ML Kit (rápido, funciona con poca luz). En el navegador se usa <WebScanner />. */
export const hasNativeScanner = (): boolean => Capacitor.isNativePlatform();

/**
 * En Android el escáner de Google es un módulo que se descarga la primera vez. `install...` vuelve enseguida,
 * así que hay que esperar el evento de progreso hasta que termine.
 */
async function ensureGoogleModule(onPreparing?: () => void): Promise<void> {
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (available) return;
  onPreparing?.();

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new ScannerUnavailable(t("caja.moduleFailed"))), 90_000);
    let remove: (() => Promise<void>) | undefined;
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      void remove?.();
      if (error) reject(error);
      else resolve();
    };
    void BarcodeScanner.addListener("googleBarcodeScannerModuleInstallProgress", (event) => {
      if (event.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) finish();
      else if (
        event.state === GoogleBarcodeScannerModuleInstallState.FAILED ||
        event.state === GoogleBarcodeScannerModuleInstallState.CANCELED
      ) {
        finish(new ScannerUnavailable(t("caja.moduleFailed")));
      }
    })
      .then((handle) => {
        remove = () => handle.remove();
        return BarcodeScanner.installGoogleBarcodeScannerModule();
      })
      .catch(() => finish(new ScannerUnavailable(t("caja.moduleFailed"))));
  });
}

/** Abre el escáner nativo y devuelve el texto del primer QR leído. */
export async function scanNative(onPreparing?: () => void): Promise<string> {
  const { camera } = await BarcodeScanner.requestPermissions();
  if (camera !== "granted" && camera !== "limited") throw new Error(t("caja.permission"));

  if (Capacitor.getPlatform() === "android") await ensureGoogleModule(onPreparing);

  const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
  const value = barcodes[0]?.rawValue;
  if (!value) throw new ScanCancelled();
  return value;
}
