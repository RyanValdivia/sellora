import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal como #FF6B35");

export const BUSINESS_CATEGORIES = [
  "cafeteria",
  "panaderia",
  "polleria",
  "barberia",
  "bodega",
  "heladeria",
  "otro",
] as const;

export const STAMP_ICONS = ["star", "coffee", "bread", "scissors", "chicken", "icecream", "heart"] as const;

const message = z.string().trim().min(1).max(160);

export const businessConfigSchema = z.object({
  identity: z.object({
    name: z.string().trim().min(2).max(60),
    category: z.enum(BUSINESS_CATEGORIES).default("otro"),
    tagline: z.string().trim().max(80).default(""),
    phone: z.string().trim().max(30).default(""),
  }),
  rules: z.object({
    stampsRequired: z.number().int().min(2).max(20).default(6),
    reward: z.string().trim().min(2).max(60).default("Un premio de la casa"),
    maxStampsPerDay: z.number().int().min(1).max(10).default(1),
    minMinutesBetweenStamps: z.number().int().min(0).max(1440).default(0),
    expiresAfterDays: z.number().int().min(7).max(1095).nullable().default(null),
  }),
  messages: z.object({
    welcome: message.default("¡Bienvenido a {negocio}! Junta {sellos_total} sellos y llévate {premio}."),
    stampAdded: message.default(
      "Ahora tienes {sellos_actuales} de {sellos_total} sellos. Te faltan {sellos_faltantes}.",
    ),
    rewardReady: message.default("¡Completaste tu tarjeta, {nombre}! Canjea {premio} en {negocio}."),
    redeemed: message.default("Canjeaste: {premio}. ¡Vuelve pronto a {negocio}!"),
    nearby: message.default("Estás cerca de {negocio}. Te faltan {sellos_faltantes} sellos para {premio}."),
  }),
  passDesign: z.object({
    backgroundColor: hex.default("#2A1740"),
    foregroundColor: hex.default("#FFF6EA"),
    labelColor: hex.default("#FFD166"),
    stampIcon: z.enum(STAMP_ICONS).default("star"),
  }),
  landing: z.object({
    headline: z.string().trim().max(80).default("Tu tarjeta de sellos, siempre contigo"),
    body: z.string().trim().max(240).default("Guárdala en tu celular y suma un sello en cada visita."),
    ctaLabel: z.string().trim().max(30).default("Guardar mi tarjeta"),
  }),
});

export type BusinessConfig = z.infer<typeof businessConfigSchema>;
export type BusinessRules = BusinessConfig["rules"];

/** Config inicial de un negocio nuevo: todo con valores por defecto. */
export function defaultBusinessConfig(name: string): BusinessConfig {
  return businessConfigSchema.parse({
    identity: { name },
    rules: {},
    messages: {},
    passDesign: {},
    landing: {},
  });
}
