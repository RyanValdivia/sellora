/** Contratos de la API compartidos por el servidor (apps/web) y las apps (apps/app). */
import { z } from "zod";
import { businessConfigSchema } from "../business/config.ts";

export const createBusinessInput = z.object({
  name: z.string().trim().min(2).max(60),
});
export type CreateBusinessInput = z.infer<typeof createBusinessInput>;

export const updateConfigInput = businessConfigSchema;
export type UpdateConfigInput = z.infer<typeof updateConfigInput>;

export const locationInput = z.object({
  label: z.string().trim().min(1).max(60),
  address: z.string().trim().min(3).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  alertText: z.string().trim().max(160).nullable().default(null),
});
export type LocationInput = z.infer<typeof locationInput>;

export interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  plan: "free" | "pro";
  role: "owner" | "staff";
}

export interface LocationDto extends LocationInput {
  id: string;
  position: number;
}

/** Lo que ve cualquiera en /b/[slug]. Nunca incluye datos de clientes. */
export interface PublicBusiness {
  slug: string;
  name: string;
  config: Pick<z.infer<typeof businessConfigSchema>, "identity" | "passDesign" | "landing"> & {
    rules: Pick<z.infer<typeof businessConfigSchema>["rules"], "stampsRequired" | "reward">;
  };
  locations: { label: string; address: string }[];
}

export interface ApiError {
  error: { code: string; message: string; issues?: { path: string; message: string }[] };
}

/** Convierte un slug legible desde un nombre: "Panadería Alba" → "panaderia-alba". */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Estado de una tarjeta tal como lo ve caja o la app del cliente. */
export interface CardDto {
  serial: string;
  businessName: string;
  holderName: string | null;
  stamps: number;
  stampsRequired: number;
  reward: string;
  rewardReady: boolean;
  redemptions: number;
  lastStampAt: string | null;
  expiresAt: string | null;
}

export type CardDenial =
  "expired" | "reward_pending" | "daily_limit" | "too_soon" | "reward_not_ready" | "conflict";

export interface CardActionResponse {
  card: CardDto;
  /** Verdadero si este sello completó la tarjeta. */
  completed: boolean;
  /** Mensaje que recibirá el cliente (ya con variables). Caja lo muestra como confirmación. */
  message: string;
}

export const acceptInvitationInput = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email(),
  password: z.string().min(8).max(128),
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationInput>;

export interface TeamMemberDto {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "staff";
}

export interface InvitationDto {
  id: string;
  role: "owner" | "staff";
  expiresAt: string;
}

export const addCustomerCardInput = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
});

export const renameHolderInput = z.object({ holderName: z.string().trim().max(40).nullable() });

export const pushTokenInput = z.object({
  token: z.string().min(10).max(4096),
  platform: z.enum(["ios", "android"]),
});

/** Tarjeta de un cliente con lo necesario para dibujarla en la app. */
export interface CustomerCardDto {
  card: CardDto;
  slug: string;
  identity: { name: string };
  passDesign: {
    backgroundColor: string;
    foregroundColor: string;
    labelColor: string;
    stampIcon: "star" | "coffee" | "bread" | "scissors" | "chicken" | "icecream" | "heart";
  };
}

/** Extrae el slug de un enlace /b/slug (el del QR o la etiqueta NFC) o de un slug suelto. */
export function slugFromLink(text: string): string | null {
  const trimmed = text.trim();
  const match = /\/b\/([a-z0-9-]+)\/?(?:[?#].*)?$/.exec(trimmed);
  const slug = match ? match[1]! : trimmed;
  return /^[a-z0-9-]{1,60}$/.test(slug) ? slug : null;
}

export const adminBusinessPatch = z.object({
  active: z.boolean().optional(),
  plan: z.enum(["free", "pro"]).optional(),
});

export const platformSettingsInput = z.object({
  /** Si es falso, solo el superadmin puede crear negocios nuevos. */
  signupsOpen: z.boolean(),
});
export type PlatformSettings = z.infer<typeof platformSettingsInput>;

export interface AdminBusinessDto {
  id: string;
  slug: string;
  name: string;
  plan: "free" | "pro";
  active: boolean;
  createdAt: string;
  passes: number;
  staff: number;
}

export interface AdminStats {
  businesses: number;
  activeBusinesses: number;
  passes: number;
  stamps: number;
}

export interface TeamResponse {
  members: TeamMemberDto[];
  invitations: InvitationDto[];
  maxStaff: number;
}
