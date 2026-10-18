import { readFileSync } from "node:fs";
import { env } from "../../lib/env";

export interface WalletCertificates {
  wwdr: Buffer | string;
  signerCert: Buffer | string;
  signerKey: Buffer | string;
  signerKeyPassphrase?: string;
}

export type WalletMode = "signed" | "preview";

/** Hay modo firmado solo si están las tres rutas de certificados. */
export const walletMode: WalletMode =
  env.APPLE_WWDR_CERT_PATH && env.APPLE_SIGNER_CERT_PATH && env.APPLE_SIGNER_KEY_PATH ? "signed" : "preview";

let cached: Promise<WalletCertificates> | undefined;

/**
 * Certificados para firmar el pase.
 * - Modo firmado: lee los PEM indicados en el entorno.
 * - Modo vista previa: genera un certificado autofirmado. El .pkpass queda bien formado pero Apple lo
 *   rechaza (su firma no encadena con el WWDR de Apple); sirve para probar todo lo demás sin cuenta de Apple.
 */
export function loadCertificates(): Promise<WalletCertificates> {
  cached ??= walletMode === "signed" ? readCertificates() : devCertificates();
  return cached;
}

async function readCertificates(): Promise<WalletCertificates> {
  return {
    wwdr: readFileSync(env.APPLE_WWDR_CERT_PATH!),
    signerCert: readFileSync(env.APPLE_SIGNER_CERT_PATH!),
    signerKey: readFileSync(env.APPLE_SIGNER_KEY_PATH!),
    signerKeyPassphrase: env.APPLE_SIGNER_KEY_PASSPHRASE,
  };
}

async function devCertificates(): Promise<WalletCertificates> {
  const { generate } = await import("selfsigned");
  const pems = await generate([{ name: "commonName", value: "Sellora preview" }], { keySize: 2048 });
  return { wwdr: pems.cert, signerCert: pems.cert, signerKey: pems.private };
}
