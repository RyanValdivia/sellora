import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { defaultBusinessConfig } from "@sellora/shared/business/config";
import { decodeCardQr } from "@sellora/shared/business/qr";
import { buildPkpass, hexToRgb, messageFor, type PassContext } from "../src/server/passes/build";
import { stripLayout, stripSvg } from "../src/server/passes/images";

function context(
  overrides: Partial<PassContext["pass"]> = {},
  locations = 1,
  event: PassContext["event"] = "welcome",
): PassContext {
  const config = defaultBusinessConfig("Panadería Alba");
  config.rules.reward = "Un café gratis";
  return {
    business: { name: "Panadería Alba", config },
    locations: Array.from({ length: locations }, (_, i) => ({
      label: `Local ${i}`,
      lat: -12.12 + i * 0.001,
      lng: -77.03,
      alertText: i === 0 ? "Pasa por tu sello, {nombre}" : null,
    })),
    pass: {
      serial: "k3J9sd8fH2lQw0Zx_a-B4cD",
      authToken: "secret-auth-token-aaaaaaaaaaaaaaa",
      stamps: 0,
      rewardReady: false,
      holderName: "Rosa",
      expiresAt: null,
      ...overrides,
    },
    event,
  };
}

async function open(ctx: PassContext) {
  const { buffer, mode } = await buildPkpass(ctx);
  const zip = await JSZip.loadAsync(buffer);
  const json = JSON.parse(await zip.file("pass.json")!.async("string"));
  return { zip, json, mode, names: Object.keys(zip.files) };
}

describe("generación del .pkpass", () => {
  it("incluye lo que Wallet exige y marca el modo vista previa sin certificados", async () => {
    const { json, mode, names } = await open(context());
    expect(mode).toBe("preview");
    for (const f of [
      "pass.json",
      "manifest.json",
      "signature",
      "icon.png",
      "icon@2x.png",
      "strip.png",
      "logo.png",
    ]) {
      expect(names).toContain(f);
    }
    expect(json.storeCard).toBeDefined();
    expect(json.serialNumber).toBe("k3J9sd8fH2lQw0Zx_a-B4cD");
    expect(json.webServiceURL).toMatch(/\/api\/wallet$/);
    expect(json.authenticationToken).toBe("secret-auth-token-aaaaaaaaaaaaaaa");
    expect(json.backgroundColor).toBe("rgb(42, 23, 64)");
  });

  it("el QR lleva solo el serial y nunca el authToken", async () => {
    const { json } = await open(context());
    const qr = json.barcodes[0];
    expect(qr.format).toBe("PKBarcodeFormatQR");
    expect(decodeCardQr(qr.message)).toBe("k3J9sd8fH2lQw0Zx_a-B4cD");
    expect(JSON.stringify(json.barcodes)).not.toContain("secret-auth-token");
  });

  it("las ubicaciones usan el texto del negocio con variables y se limitan a 10", async () => {
    const { json } = await open(context({}, 14));
    expect(json.locations).toHaveLength(10);
    expect(json.locations[0].relevantText).toBe("Pasa por tu sello, Rosa");
    expect(json.locations[1].relevantText).toContain("Estás cerca de Panadería Alba");
  });

  it("sin ubicaciones no escribe el campo locations", async () => {
    const { json } = await open(context({}, 0));
    expect(json.locations).toBeUndefined();
  });

  it("el cambio de estado queda en un campo con changeMessage para la pantalla de bloqueo", async () => {
    const { json } = await open(context({ stamps: 5 }, 1, "stamp"));
    const last = json.storeCard.backFields.find((f: { key: string }) => f.key === "lastMessage");
    expect(last.changeMessage).toBe("%@");
    expect(last.value).toBe("Ahora tienes 5 de 6 sellos. Te faltan 1.");
    expect(json.storeCard.headerFields[0].value).toBe("5/6");
  });

  it("al completar la tarjeta se usa el mensaje de premio listo", () => {
    expect(messageFor(context({ stamps: 6, rewardReady: true }, 1, "stamp"))).toBe(
      "¡Completaste tu tarjeta, Rosa! Canjea Un café gratis en Panadería Alba.",
    );
  });
});

describe("imágenes del pase", () => {
  it("convierte hex a rgb()", () => {
    expect(hexToRgb("#FF6B35")).toBe("rgb(255, 107, 53)");
  });
  it("reparte los sellos en filas según el total", () => {
    expect(stripLayout(5)).toEqual({ rows: 1, cols: 5 });
    expect(stripLayout(10)).toEqual({ rows: 2, cols: 5 });
    expect(stripLayout(20)).toEqual({ rows: 3, cols: 7 });
  });
  it("dibuja un círculo por sello y una marca por cada sello dado", () => {
    const design = defaultBusinessConfig("Local").passDesign;
    const svg = stripSvg(design, 6, 2);
    expect(svg.match(/<circle/g)).toHaveLength(6);
    expect(svg.match(/<path/g)).toHaveLength(2);
  });
});
