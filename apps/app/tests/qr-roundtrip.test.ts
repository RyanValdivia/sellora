import jsQR from "jsqr";
import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { decodeCardQr, encodeCardQr } from "@sellora/shared/business/qr";
import { slugFromLink } from "@sellora/shared/api/contracts";

/** Dibuja el QR en píxeles RGBA, como lo vería la cámara (módulos escalados y margen blanco). */
function render(text: string, scale = 8, border = 4) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const size = (n + border * 2) * scale;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!qr.modules.get(y, x)) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = ((y + border) * scale + dy) * size + (x + border) * scale + dx;
          data[px * 4] = data[px * 4 + 1] = data[px * 4 + 2] = 0;
        }
      }
    }
  }
  return { data, size };
}

describe("lectura de QR (escáner del navegador y del WebView)", () => {
  it("el QR de una tarjeta se lee y se decodifica al mismo serial", () => {
    const serial = "k3J9sd8fH2lQw0Zx_a-B4cD";
    const { data, size } = render(encodeCardQr(serial));
    const read = jsQR(data, size, size);
    expect(read?.data).toBe(`sellora:${serial}`);
    expect(decodeCardQr(read!.data)).toBe(serial);
  });

  it("el QR del mostrador (enlace del negocio) se lee y da el slug", () => {
    const { data, size } = render("https://tarjetas.ejemplo.pe/b/panaderia-alba");
    const read = jsQR(data, size, size);
    expect(slugFromLink(read!.data)).toBe("panaderia-alba");
  });

  it("un QR ajeno se lee pero no cuenta como tarjeta", () => {
    const { data, size } = render("https://otra-web.com/promo");
    const read = jsQR(data, size, size);
    expect(read?.data).toBe("https://otra-web.com/promo");
    expect(decodeCardQr(read!.data)).toBeNull();
    expect(slugFromLink(read!.data)).toBeNull();
  });
});
