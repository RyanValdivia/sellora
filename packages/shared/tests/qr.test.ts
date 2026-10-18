import { describe, expect, it } from "vitest";
import { decodeCardQr, encodeCardQr } from "../src/business/qr.ts";

const serial = "k3J9sd8fH2lQw0Zx_a-B4cD";

describe("QR de la tarjeta", () => {
  it("ida y vuelta", () => {
    expect(decodeCardQr(encodeCardQr(serial))).toBe(serial);
  });
  it("tolera espacios alrededor", () => {
    expect(decodeCardQr(`  ${encodeCardQr(serial)}\n`)).toBe(serial);
  });
  it("rechaza códigos ajenos o mal formados", () => {
    expect(decodeCardQr("https://ejemplo.com")).toBeNull();
    expect(decodeCardQr("sellora:corto")).toBeNull();
    expect(decodeCardQr("sellora:" + "x".repeat(100))).toBeNull();
    expect(decodeCardQr("sellora:../../etc/passwd/xxxxxxxxxx")).toBeNull();
  });
});
