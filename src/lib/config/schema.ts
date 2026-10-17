import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hex de 6 dígitos, p. ej. #FF6B35");
const path = z.string().startsWith("/");

const planLimits = z.object({
  maxLocations: z.number().int().positive(),
  maxStaff: z.number().int().positive(),
  maxPasses: z.number().int().positive(),
});

export const platformConfigSchema = z.object({
  brand: z.object({
    name: z.string().min(1),
    /** Texto en minúsculas que se dibuja en el logo. */
    wordmark: z.string().min(1),
    tagline: z.string().min(1),
    description: z.string().min(1),
    logo: z.object({
      full: path,
      icon: path,
      monoLight: path,
      monoDark: path,
    }),
  }),
  /**
   * Colores para contextos que no leen CSS (pases, imagen OG, manifest).
   * La UI usa los tokens de globals.css; un test comprueba que ambos coinciden.
   */
  palette: z.object({
    cream: hex,
    plum: hex,
    tangerine: hex,
    teal: hex,
    butter: hex,
  }),
  /** Nombres informativos: next/font necesita literales y se cargan en src/app/fonts.ts. */
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
    accent: z.string(),
  }),
  locale: z.object({
    default: z.string(),
    supported: z.array(z.string()).min(1),
    currency: z.string().length(3),
    timeZone: z.string(),
  }),
  plans: z.record(z.string(), planLimits),
  legal: z.object({
    companyName: z.string(),
    privacyPath: path,
    termsPath: path,
    /** Fecha ISO (AAAA-MM-DD) de la última revisión de los textos legales. */
    updatedAt: z.iso.date(),
  }),
  contact: z.object({
    email: z.email(),
  }),
  features: z.object({
    googleWallet: z.boolean(),
    campaigns: z.boolean(),
    multiLocation: z.boolean(),
    publicSignup: z.boolean(),
  }),
  wallet: z.object({
    /** iOS permite como máximo 10 ubicaciones relevantes por pase. */
    maxRelevantLocations: z.number().int().min(1).max(10),
  }),
});

export type PlatformConfig = z.infer<typeof platformConfigSchema>;

export function defineConfig(config: PlatformConfig): PlatformConfig {
  return platformConfigSchema.parse(config);
}
