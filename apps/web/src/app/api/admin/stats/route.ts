import { count, eq } from "drizzle-orm";
import type { AdminStats } from "@sellora/shared/api/contracts";
import { requireSuperadmin } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

export async function GET(request: Request) {
  const guard = await requireSuperadmin(request);
  if ("response" in guard) return guard.response;

  const db = await dbPromise;
  const { business, pass, stampEvent } = schema;
  const [{ total }] = await db.select({ total: count() }).from(business);
  const [{ active }] = await db.select({ active: count() }).from(business).where(eq(business.active, true));
  const [{ passes }] = await db.select({ passes: count() }).from(pass);
  const [{ stamps }] = await db
    .select({ stamps: count() })
    .from(stampEvent)
    .where(eq(stampEvent.type, "stamp"));

  const stats: AdminStats = { businesses: total, activeBusinesses: active, passes, stamps };
  return Response.json(stats);
}
