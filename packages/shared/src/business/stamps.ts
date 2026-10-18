import type { BusinessRules } from "./config.ts";

export interface CardState {
  stamps: number;
  redemptions: number;
  rewardReady: boolean;
  lastStampAt: Date | null;
  expiresAt: Date | null;
}

export type StampDenial = "expired" | "reward_pending" | "daily_limit" | "too_soon";
export type RedeemDenial = "reward_not_ready" | "expired";

export type StampResult =
  { ok: true; card: CardState; completed: boolean } | { ok: false; reason: StampDenial; retryAt?: Date };

export type RedeemResult = { ok: true; card: CardState } | { ok: false; reason: RedeemDenial };

const DAY_MS = 86_400_000;

function nextExpiry(rules: BusinessRules, now: Date): Date | null {
  return rules.expiresAfterDays === null ? null : new Date(now.getTime() + rules.expiresAfterDays * DAY_MS);
}

/**
 * Intenta sumar un sello.
 * @param stampsToday sellos ya dados hoy (día calendario del negocio), calculado por quien llama.
 */
export function applyStamp(
  card: CardState,
  rules: BusinessRules,
  stampsToday: number,
  now: Date,
): StampResult {
  if (card.expiresAt && card.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  if (card.rewardReady) return { ok: false, reason: "reward_pending" };
  if (stampsToday >= rules.maxStampsPerDay) return { ok: false, reason: "daily_limit" };

  if (card.lastStampAt && rules.minMinutesBetweenStamps > 0) {
    const retryAt = new Date(card.lastStampAt.getTime() + rules.minMinutesBetweenStamps * 60_000);
    if (retryAt.getTime() > now.getTime()) return { ok: false, reason: "too_soon", retryAt };
  }

  const stamps = card.stamps + 1;
  const completed = stamps >= rules.stampsRequired;
  return {
    ok: true,
    completed,
    card: { ...card, stamps, rewardReady: completed, lastStampAt: now, expiresAt: nextExpiry(rules, now) },
  };
}

/** Canjea el premio: descuenta los sellos del ciclo y conserva el sobrante. */
export function applyRedeem(card: CardState, rules: BusinessRules, now: Date): RedeemResult {
  if (card.expiresAt && card.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  if (!card.rewardReady) return { ok: false, reason: "reward_not_ready" };
  const stamps = Math.max(card.stamps - rules.stampsRequired, 0);
  return {
    ok: true,
    card: {
      ...card,
      stamps,
      redemptions: card.redemptions + 1,
      rewardReady: stamps >= rules.stampsRequired,
      expiresAt: nextExpiry(rules, now),
    },
  };
}
