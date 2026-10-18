import { randomBytes } from "node:crypto";
import { and, asc, count, eq } from "drizzle-orm";
import config from "@sellora/shared/config";
import { dbPromise, schema } from "../db";
import type { PassContext, PassEvent } from "./build";

export const newSerial = () => randomBytes(18).toString("base64url");
export const newAuthToken = () => randomBytes(24).toString("base64url");

export type CreatePassResult =
  { ok: true; serial: string; created: boolean } | { ok: false; reason: "not_found" | "plan_limit" };

/** Crea una tarjeta nueva para un negocio, respetando el máximo de tarjetas de su plan. */
export async function createPass(slug: string, customerId: string | null = null): Promise<CreatePassResult> {
  const db = await dbPromise;
  const { business, pass } = schema;

  const [biz] = await db
    .select({ id: business.id, plan: business.plan })
    .from(business)
    .where(and(eq(business.slug, slug), eq(business.active, true)));
  if (!biz) return { ok: false, reason: "not_found" };

  if (customerId) {
    const [existing] = await db
      .select({ serial: pass.serial })
      .from(pass)
      .where(and(eq(pass.businessId, biz.id), eq(pass.customerId, customerId)));
    if (existing) return { ok: true, serial: existing.serial, created: false };
  }

  const [{ total }] = await db.select({ total: count() }).from(pass).where(eq(pass.businessId, biz.id));
  if (total >= config.plans[biz.plan].maxPasses) return { ok: false, reason: "plan_limit" };

  const serial = newSerial();
  await db.insert(pass).values({
    id: crypto.randomUUID(),
    serial,
    authToken: newAuthToken(),
    businessId: biz.id,
    customerId,
  });
  return { ok: true, serial, created: true };
}

/** Reúne todo lo necesario para dibujar una tarjeta; null si no existe. */
export async function loadPassContext(
  serial: string,
  event: PassEvent = "stamp",
): Promise<PassContext | null> {
  const db = await dbPromise;
  const { business, location, pass } = schema;

  const [row] = await db
    .select({ pass, business })
    .from(pass)
    .innerJoin(business, eq(business.id, pass.businessId))
    .where(eq(pass.serial, serial));
  if (!row) return null;

  const locations = await db
    .select()
    .from(location)
    .where(eq(location.businessId, row.business.id))
    .orderBy(asc(location.position));

  return {
    business: { name: row.business.name, config: row.business.config },
    locations,
    pass: {
      serial: row.pass.serial,
      authToken: row.pass.authToken,
      stamps: row.pass.stamps,
      rewardReady: row.pass.rewardReady,
      holderName: row.pass.holderName,
      expiresAt: row.pass.expiresAt,
    },
    event,
  };
}
