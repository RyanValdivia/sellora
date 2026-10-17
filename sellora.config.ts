import { defineConfig } from "./src/lib/config/schema.ts";

/**
 * Valores por defecto de la plataforma (capa 1).
 * El superadmin puede sobreescribir algunos desde el panel (se guardan en BD)
 * y cada negocio personaliza su tarjeta desde el dashboard.
 */
export default defineConfig({
  brand: {
    name: "Sellora",
    wordmark: "sellora",
    tagline: "Tu barrio, a un sello de distancia.",
    description:
      "Tarjetas de fidelidad digitales para negocios de barrio. Viven en el Wallet del celular de tu cliente y le avisan cuando pasa cerca.",
    logo: {
      full: "/brand/sellora-full.svg",
      icon: "/brand/sellora-icon.svg",
      monoLight: "/brand/sellora-mono-light.svg",
      monoDark: "/brand/sellora-mono-dark.svg",
    },
  },
  palette: {
    cream: "#FFF6EA",
    plum: "#2A1740",
    tangerine: "#FF6B35",
    teal: "#2EC4B6",
    butter: "#FFD166",
  },
  fonts: {
    heading: "Bricolage Grotesque",
    body: "DM Sans",
    accent: "Instrument Serif",
  },
  locale: {
    default: "es-PE",
    supported: ["es-PE"],
    currency: "PEN",
    timeZone: "America/Lima",
  },
  plans: {
    free: { maxLocations: 1, maxStaff: 2, maxPasses: 200 },
    pro: { maxLocations: 5, maxStaff: 10, maxPasses: 5000 },
  },
  legal: {
    companyName: "Sellora",
    privacyPath: "/privacidad",
    termsPath: "/terminos",
    updatedAt: "2026-10-17",
  },
  contact: {
    email: "hola@sellora.app",
  },
  features: {
    googleWallet: false,
    campaigns: false,
    multiLocation: true,
    publicSignup: true,
  },
  wallet: {
    maxRelevantLocations: 10,
  },
});
