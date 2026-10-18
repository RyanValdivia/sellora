import { describe, expect, it } from "vitest";
import { createBusinessInput, locationInput, slugify } from "../src/api/contracts.ts";

describe("slugify", () => {
  it("quita tildes y símbolos", () => {
    expect(slugify("Panadería Alba")).toBe("panaderia-alba");
    expect(slugify("  ¡Café & Té «El Ñandú»!  ")).toBe("cafe-te-el-nandu");
  });
  it("limita el largo", () => {
    expect(slugify("a".repeat(100)).length).toBe(40);
  });
  it("devuelve vacío si no hay letras", () => {
    expect(slugify("¡¡¡")).toBe("");
  });
});

describe("contratos de la API", () => {
  it("rechaza nombres de negocio demasiado cortos", () => {
    expect(createBusinessInput.safeParse({ name: "A" }).success).toBe(false);
  });
  it("acota las coordenadas y completa el texto del aviso", () => {
    const base = { label: "Local", address: "Av. Larco 345", lat: -12.12, lng: -77.03 };
    expect(locationInput.safeParse({ ...base, lat: 95 }).success).toBe(false);
    const ok = locationInput.parse(base);
    expect(ok.alertText).toBeNull();
  });
});
