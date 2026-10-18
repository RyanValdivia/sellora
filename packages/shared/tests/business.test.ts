import { describe, expect, it } from "vitest";
import { businessConfigSchema, defaultBusinessConfig } from "../src/business/config.ts";
import { findUnknownVariables, renderMessage, varsFromCard } from "../src/business/messages.ts";
import { applyRedeem, applyStamp, type CardState } from "../src/business/stamps.ts";

const rules = defaultBusinessConfig("Panadería Alba").rules;
const now = new Date("2026-10-17T15:00:00Z");
const fresh: CardState = {
  stamps: 0,
  redemptions: 0,
  rewardReady: false,
  lastStampAt: null,
  expiresAt: null,
};

describe("mensajes", () => {
  const vars = varsFromCard({
    stamps: 5,
    stampsRequired: 6,
    reward: "Café gratis",
    businessName: "Alba",
    holderName: "Rosa",
  });

  it("sustituye todas las variables", () => {
    const tpl =
      "{nombre}, tienes {sellos_actuales}/{sellos_total}. Faltan {sellos_faltantes} para {premio} en {negocio}";
    expect(renderMessage(tpl, vars)).toBe("Rosa, tienes 5/6. Faltan 1 para Café gratis en Alba");
  });
  it("deja intactas las variables desconocidas", () => {
    expect(renderMessage("Hola {desconocida}", vars)).toBe("Hola {desconocida}");
    expect(findUnknownVariables("{premio} {foo} {bar} {foo}")).toEqual(["foo", "bar"]);
  });
  it("sin nombre no deja espacios sueltos antes de la puntuación", () => {
    const sinNombre = varsFromCard({ stamps: 6, stampsRequired: 6, reward: "Pan", businessName: "Alba" });
    expect(renderMessage("Listo {nombre}! Canjea {premio}", sinNombre)).toBe("Listo! Canjea Pan");
  });
  it("no deja faltantes negativos", () => {
    expect(
      varsFromCard({ stamps: 9, stampsRequired: 6, reward: "x", businessName: "y" }).sellos_faltantes,
    ).toBe(0);
  });
});

describe("config del negocio", () => {
  it("la config por defecto es válida y completa", () => {
    const cfg = defaultBusinessConfig("Alba");
    expect(businessConfigSchema.safeParse(cfg).success).toBe(true);
    expect(cfg.rules.stampsRequired).toBe(6);
  });
  it("rechaza colores y sellos fuera de rango", () => {
    const cfg = defaultBusinessConfig("Alba");
    const badColor = { ...cfg, passDesign: { ...cfg.passDesign, labelColor: "rojo" } };
    const badStamps = { ...cfg, rules: { ...cfg.rules, stampsRequired: 1 } };
    expect(businessConfigSchema.safeParse(badColor).success).toBe(false);
    expect(businessConfigSchema.safeParse(badStamps).success).toBe(false);
  });
});

describe("reglas de sellos", () => {
  it("suma un sello", () => {
    const r = applyStamp(fresh, rules, 0, now);
    expect(r.ok && r.card.stamps).toBe(1);
  });
  it("al llegar al máximo deja el premio listo y bloquea más sellos", () => {
    const almost: CardState = { ...fresh, stamps: rules.stampsRequired - 1 };
    const r = applyStamp(almost, rules, 0, now);
    expect(r.ok && r.completed && r.card.rewardReady).toBe(true);
    if (r.ok) expect(applyStamp(r.card, rules, 0, now)).toEqual({ ok: false, reason: "reward_pending" });
  });
  it("respeta el límite diario", () => {
    expect(applyStamp(fresh, { ...rules, maxStampsPerDay: 2 }, 2, now)).toEqual({
      ok: false,
      reason: "daily_limit",
    });
    expect(applyStamp(fresh, { ...rules, maxStampsPerDay: 2 }, 1, now).ok).toBe(true);
  });
  it("respeta el tiempo mínimo entre sellos e indica cuándo reintentar", () => {
    const card = { ...fresh, stamps: 1, lastStampAt: new Date("2026-10-17T14:30:00Z") };
    const r = applyStamp(card, { ...rules, minMinutesBetweenStamps: 60 }, 0, now);
    expect(r).toEqual({ ok: false, reason: "too_soon", retryAt: new Date("2026-10-17T15:30:00Z") });
  });
  it("rechaza tarjetas caducadas y renueva la caducidad al sellar", () => {
    const expired = { ...fresh, expiresAt: new Date("2026-10-01T00:00:00Z") };
    expect(applyStamp(expired, rules, 0, now)).toEqual({ ok: false, reason: "expired" });
    const r = applyStamp(fresh, { ...rules, expiresAfterDays: 30 }, 0, now);
    expect(r.ok && r.card.expiresAt?.toISOString()).toBe("2026-11-16T15:00:00.000Z");
  });
  it("canjea solo con premio listo y conserva el sobrante", () => {
    expect(applyRedeem(fresh, rules, now)).toEqual({ ok: false, reason: "reward_not_ready" });
    const ready: CardState = { ...fresh, stamps: rules.stampsRequired + 2, rewardReady: true };
    const r = applyRedeem(ready, rules, now);
    expect(r.ok && r.card).toMatchObject({ stamps: 2, redemptions: 1, rewardReady: false });
  });
});
