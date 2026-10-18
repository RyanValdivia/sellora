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
