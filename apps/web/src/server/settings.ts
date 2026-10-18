import { eq } from "drizzle-orm";
import type { PlatformSettings } from "@sellora/shared/api/contracts";
import config from "@sellora/shared/config";
import { dbPromise, schema } from "./db";

const KEY = "platform";

/** Ajustes editables desde el panel. Si no hay fila, valen los valores de sellora.config.ts. */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const db = await dbPromise;
  const [row] = await db.select().from(schema.platformSettings).where(eq(schema.platformSettings.key, KEY));
  const stored = (row?.value ?? {}) as Partial<PlatformSettings>;
  return { signupsOpen: stored.signupsOpen ?? config.features.publicSignup };
}

export async function savePlatformSettings(value: PlatformSettings): Promise<void> {
  const db = await dbPromise;
  const { platformSettings } = schema;
  const now = new Date();
  await db
    .insert(platformSettings)
    .values({ key: KEY, value, updatedAt: now })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: now } });
}
