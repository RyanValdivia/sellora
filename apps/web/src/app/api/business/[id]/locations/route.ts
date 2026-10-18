import { asc, count, eq } from "drizzle-orm";
import config from "@sellora/shared/config";
import { locationInput, type LocationDto } from "@sellora/shared/api/contracts";
import { fail, parseBody, requireMember } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

export async function GET(request: Request, ctx: RouteContext<"/api/business/[id]/locations">) {
  const { id } = await ctx.params;
  const guard = await requireMember(request, id);
  if ("response" in guard) return guard.response;

  const db = await dbPromise;
  const { location } = schema;
  const rows = await db
    .select()
    .from(location)
    .where(eq(location.businessId, id))
    .orderBy(asc(location.position));
  const locations: LocationDto[] = rows.map((r) => ({
    id: r.id,
    label: r.label,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    alertText: r.alertText,
    position: r.position,
  }));
  return Response.json({ locations });
}

export async function POST(request: Request, ctx: RouteContext<"/api/business/[id]/locations">) {
  const { id } = await ctx.params;
  const guard = await requireMember(request, id, { ownerOnly: true });
  if ("response" in guard) return guard.response;

  const body = await parseBody(request, locationInput);
  if ("response" in body) return body.response;

  const db = await dbPromise;
  const { location, business } = schema;
  const [biz] = await db.select({ plan: business.plan }).from(business).where(eq(business.id, id));
  const limit = config.plans[biz?.plan ?? "free"].maxLocations;
  const [{ total }] = await db.select({ total: count() }).from(location).where(eq(location.businessId, id));
  if (total >= limit) {
    return fail(402, "plan_limit", `Tu plan permite hasta ${limit} ubicaciones.`);
  }
  // Apple Wallet muestra como máximo 10 ubicaciones relevantes por pase.
  if (total >= config.wallet.maxRelevantLocations) {
    return fail(
      409,
      "wallet_limit",
      `Un pase admite hasta ${config.wallet.maxRelevantLocations} ubicaciones.`,
    );
  }

  const locId = crypto.randomUUID();
  await db.insert(location).values({ id: locId, businessId: id, position: total, ...body.data });
  return Response.json(
    { location: { id: locId, position: total, ...body.data } satisfies LocationDto },
    { status: 201 },
  );
}
