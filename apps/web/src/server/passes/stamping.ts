import { and, count, eq, gte } from "drizzle-orm";
import config from "@sellora/shared/config";
import type { CardActionResponse, CardDenial, CardDto } from "@sellora/shared/api/contracts";
import { type BusinessConfig } from "@sellora/shared/business/config";
import { eventMessage } from "@sellora/shared/business/messages";
import { applyRedeem, applyStamp, type CardState } from "@sellora/shared/business/stamps";
import { startOfDayInZone } from "@sellora/shared/business/time";
import { dbPromise, schema } from "../db";
import { notifyPassUpdated } from "./push";

export interface FoundPass {
  pass: typeof schema.pass.$inferSelect;
  business: { id: string; name: string; config: BusinessConfig };
}

export async function findPass(serial: string): Promise<FoundPass | null> {
  const db = await dbPromise;
  const { pass, business } = schema;
  const [row] = await db
    .select({ pass, business })
    .from(pass)
    .innerJoin(business, eq(business.id, pass.businessId))
    .where(eq(pass.serial, serial));
  if (!row) return null;
  return {
    pass: row.pass,
    business: { id: row.business.id, name: row.business.name, config: row.business.config },
  };
}

export function toCardDto(found: FoundPass): CardDto {
  const { pass, business } = found;
  return {
    serial: pass.serial,
    businessName: business.name,
    holderName: pass.holderName,
    stamps: pass.stamps,
    stampsRequired: business.config.rules.stampsRequired,
    reward: business.config.rules.reward,
    rewardReady: pass.rewardReady,
    redemptions: pass.redemptions,
    lastStampAt: pass.lastStampAt?.toISOString() ?? null,
    expiresAt: pass.expiresAt?.toISOString() ?? null,
  };
}

const stateOf = (p: FoundPass["pass"]): CardState => ({
  stamps: p.stamps,
  redemptions: p.redemptions,
  rewardReady: p.rewardReady,
  lastStampAt: p.lastStampAt,
  expiresAt: p.expiresAt,
});

export type ActionResult =
  { ok: true; response: CardActionResponse } | { ok: false; reason: CardDenial; retryAt?: Date };

/**
 * Guarda el nuevo estado solo si nadie más tocó la tarjeta entre la lectura y la escritura
 * (comparamos `updatedAt`). Si dos cajeros escanean a la vez, uno recibe "conflict" en vez de perder un sello.
 */
async function commit(
  found: FoundPass,
  next: CardState,
  type: "stamp" | "redeem",
  actorUserId: string,
  now: Date,
) {
  const db = await dbPromise;
  const { pass, stampEvent } = schema;
  const updated = await db
    .update(pass)
    .set({
      stamps: next.stamps,
      redemptions: next.redemptions,
      rewardReady: next.rewardReady,
      lastStampAt: next.lastStampAt,
      expiresAt: next.expiresAt,
      updatedAt: now,
    })
    .where(and(eq(pass.id, found.pass.id), eq(pass.updatedAt, found.pass.updatedAt)))
    .returning({ id: pass.id });
  if (updated.length === 0) return false;

  await db.insert(stampEvent).values({
    id: crypto.randomUUID(),
    passId: found.pass.id,
    actorUserId,
    type,
    amount: 1,
    createdAt: now,
  });
  return true;
}

function respond(
  found: FoundPass,
  next: CardState,
  event: "stamp" | "redeem",
  completed: boolean,
): CardActionResponse {
  const merged: FoundPass = { ...found, pass: { ...found.pass, ...next } };
  const { config: cfg, name } = found.business;
  return {
    card: toCardDto(merged),
    completed,
    message: eventMessage(
      cfg.messages,
      event,
      {
        stamps: next.stamps,
        stampsRequired: cfg.rules.stampsRequired,
        reward: cfg.rules.reward,
        businessName: name,
        holderName: found.pass.holderName,
      },
      next.rewardReady,
    ),
  };
}

export async function stampPass(
  found: FoundPass,
  actorUserId: string,
  now = new Date(),
): Promise<ActionResult> {
  const db = await dbPromise;
  const { stampEvent } = schema;
  const dayStart = startOfDayInZone(now, config.locale.timeZone);
  const [{ today }] = await db
    .select({ today: count() })
    .from(stampEvent)
    .where(
      and(
        eq(stampEvent.passId, found.pass.id),
        eq(stampEvent.type, "stamp"),
        gte(stampEvent.createdAt, dayStart),
      ),
    );

  const result = applyStamp(stateOf(found.pass), found.business.config.rules, today, now);
  if (!result.ok) return { ok: false, reason: result.reason, retryAt: result.retryAt };

  if (!(await commit(found, result.card, "stamp", actorUserId, now)))
    return { ok: false, reason: "conflict" };
  void notifyPassUpdated(found.pass.serial);
  return { ok: true, response: respond(found, result.card, "stamp", result.completed) };
}

export async function redeemPass(
  found: FoundPass,
  actorUserId: string,
  now = new Date(),
): Promise<ActionResult> {
  const result = applyRedeem(stateOf(found.pass), found.business.config.rules, now);
  if (!result.ok) return { ok: false, reason: result.reason };

  if (!(await commit(found, result.card, "redeem", actorUserId, now)))
    return { ok: false, reason: "conflict" };
  void notifyPassUpdated(found.pass.serial);
  return { ok: true, response: respond(found, result.card, "redeem", false) };
}
