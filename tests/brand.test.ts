import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import config from "@config";
import { platformConfigSchema } from "@/lib/config/schema";
import { interpolate, t, tr } from "@/i18n";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--brand-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Falta --brand-${name} en globals.css`);
  return match[1].toLowerCase();
}

describe("marca", () => {
  it("la paleta de sellora.config.ts coincide con los tokens de globals.css", () => {
    for (const key of ["cream", "plum", "tangerine", "teal", "butter"] as const) {
      expect(config.palette[key].toLowerCase(), key).toBe(token(key));
    }
  });

  it("la configuración de plataforma es válida", () => {
    expect(platformConfigSchema.safeParse(config).success).toBe(true);
  });

  it("rechaza colores que no son hex", () => {
    const bad = { ...config, palette: { ...config.palette, cream: "crema" } };
    expect(platformConfigSchema.safeParse(bad).success).toBe(false);
  });
});

describe("i18n", () => {
  it("inyecta la marca y el lema", () => {
    expect(t("landing.footer.rights", { year: 2026 })).toContain(config.brand.name);
  });

  it("deja intactas las variables desconocidas", () => {
    expect(interpolate("Hola {nombre} de {negocio}", { nombre: "Ana" })).toBe("Hola Ana de {negocio}");
  });

  it("devuelve la clave si no existe", () => {
    // @ts-expect-error clave inexistente a propósito
    expect(t("no.existe")).toBe("no.existe");
  });

  it("expone listas del diccionario", () => {
    expect(tr<unknown[]>("landing.how.steps")).toHaveLength(3);
  });
});
