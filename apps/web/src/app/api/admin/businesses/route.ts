import { count, desc, eq } from "drizzle-orm";
import type { AdminBusinessDto } from "@sellora/shared/api/contracts";
import { requireSuperadmin } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

/** Todos los negocios con sus tarjetas y personal. Solo superadmin. */
export async function GET(request: Request) {
  const guard = await requireSuperadmin(request);
  if ("response" in guard) return guard.response;

  const db = await dbPromise;
  const { business, pass, businessMember } = schema;
  const rows = await db.select().from(business).orderBy(desc(business.createdAt));
  const passCounts = await db.select({ id: pass.businessId, n: count() }).from(pass).groupBy(pass.businessId);
  const staffCounts = await db
    .select({ id: businessMember.businessId, n: count() })
    .from(businessMember)
    .where(eq(businessMember.role, "staff"))
    .groupBy(businessMember.businessId);

  const passesBy = new Map(passCounts.map((r) => [r.id, r.n]));
  const staffBy = new Map(staffCounts.map((r) => [r.id, r.n]));
  const businesses: AdminBusinessDto[] = rows.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    plan: b.plan,
    active: b.active,
    createdAt: b.createdAt.toISOString(),
    passes: passesBy.get(b.id) ?? 0,
    staff: staffBy.get(b.id) ?? 0,
  }));
  return Response.json({ businesses });
}
