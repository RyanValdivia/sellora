import { asc, and, eq } from "drizzle-orm";
import type { PublicBusiness } from "@sellora/shared/api/contracts";
import { notFound } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

/** Datos públicos para /b/[slug]. Solo expone lo necesario para mostrar la tarjeta. */
export async function GET(_request: Request, ctx: RouteContext<"/api/public/business/[slug]">) {
  const { slug } = await ctx.params;
  const db = await dbPromise;
  const { business, location } = schema;

  const [biz] = await db
    .select()
    .from(business)
    .where(and(eq(business.slug, slug), eq(business.active, true)));
  if (!biz) return notFound();

  const locs = await db
    .select()
    .from(location)
    .where(eq(location.businessId, biz.id))
    .orderBy(asc(location.position));
  const { identity, passDesign, landing, rules } = biz.config;

  const body: PublicBusiness = {
    slug: biz.slug,
    name: biz.name,
    config: {
      identity,
      passDesign,
      landing,
      rules: { stampsRequired: rules.stampsRequired, reward: rules.reward },
    },
    locations: locs.map((l) => ({ label: l.label, address: l.address })),
  };
  return Response.json(body);
}
