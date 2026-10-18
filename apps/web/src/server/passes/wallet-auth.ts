import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { env } from "../../lib/env";
import { dbPromise, schema } from "../db";

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Token del pase en la cabecera `Authorization: ApplePass <token>` que manda Wallet. */
export function applePassToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("ApplePass ") ? header.slice("ApplePass ".length).trim() : null;
}

export const isOurPassType = (passTypeId: string) => passTypeId === env.APPLE_PASS_TYPE_ID;

/** Devuelve el pase si el token de la petición coincide; null si no. */
export async function authorizedPass(request: Request, serial: string) {
  const token = applePassToken(request);
  if (!token) return null;
  const db = await dbPromise;
  const [row] = await db.select().from(schema.pass).where(eq(schema.pass.serial, serial));
  return row && safeEqual(row.authToken, token) ? row : null;
}
