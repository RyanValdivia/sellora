/**
 * Contenido del QR de la tarjeta. Lleva solo el número de serie (público) con un prefijo para
 * reconocer códigos ajenos. El authToken del pase NUNCA va en el QR.
 */
const PREFIX = "sellora:";
const SERIAL_RE = /^[A-Za-z0-9_-]{16,64}$/;

export function encodeCardQr(serial: string): string {
  return `${PREFIX}${serial}`;
}

/** Devuelve el serial si el texto leído es un QR de tarjeta Sellora; si no, null. */
export function decodeCardQr(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith(PREFIX)) return null;
  const serial = trimmed.slice(PREFIX.length);
  return SERIAL_RE.test(serial) ? serial : null;
}
