import { describe, expect, it } from "vitest";
import { addCustomerCardInput, slugFromLink } from "../src/api/contracts.ts";

describe("slugFromLink", () => {
  it("lee el slug del enlace del QR o de la etiqueta NFC", () => {
    expect(slugFromLink("https://tarjetas.sellora.app/b/panaderia-alba")).toBe("panaderia-alba");
    expect(slugFromLink("http://localhost:3000/b/panaderia-alba/")).toBe("panaderia-alba");
    expect(slugFromLink("  https://x.pe/b/cafe-luz?utm=nfc#top ")).toBe("cafe-luz");
  });
  it("acepta un slug suelto", () => {
    expect(slugFromLink("barberia-don-pepe")).toBe("barberia-don-pepe");
  });
  it("rechaza lo que no es un slug", () => {
    expect(slugFromLink("")).toBeNull();
    expect(slugFromLink("https://ejemplo.com/otra/ruta")).toBeNull();
    expect(slugFromLink("Con Espacios")).toBeNull();
    expect(slugFromLink("../../etc/passwd")).toBeNull();
  });
});

describe("addCustomerCardInput", () => {
  it("solo acepta slugs válidos", () => {
    expect(addCustomerCardInput.safeParse({ slug: "panaderia-alba" }).success).toBe(true);
    expect(addCustomerCardInput.safeParse({ slug: "Panadería" }).success).toBe(false);
    expect(addCustomerCardInput.safeParse({}).success).toBe(false);
  });
});
