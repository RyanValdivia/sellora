import { eq } from "drizzle-orm";
import { createBusinessInput, slugify, type BusinessSummary } from "@sellora/shared/api/contracts";
import { defaultBusinessConfig } from "@sellora/shared/business/config";
import { fail, getSession, parseBody, unauthorized } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

/** Negocios del usuario con sesión. */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return unauthorized();

  const db = await dbPromise;
  const { business, businessMember } = schema;
  const rows = await db
    .select({
      id: business.id,
      slug: business.slug,
      name: business.name,
      plan: business.plan,
      role: businessMember.role,
    })
    .from(businessMember)
    .innerJoin(business, eq(business.id, businessMember.businessId))
    .where(eq(businessMember.userId, session.user.id));

  return Response.json({ businesses: rows satisfies BusinessSummary[] });
}

/** Crea un negocio nuevo con la config por defecto; quien lo crea queda como dueño. */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) return unauthorized();

  const body = await parseBody(request, createBusinessInput);
  if ("response" in body) return body.response;

  const db = await dbPromise;
  const { business, businessMember } = schema;

  const base = slugify(body.data.name) || "negocio";
  let slug = base;
  for (let i = 2; ; i++) {
    const [taken] = await db.select({ id: business.id }).from(business).where(eq(business.slug, slug));
    if (!taken) break;
    if (i > 50) return fail(409, "slug_taken", "No pudimos generar una dirección única. Prueba otro nombre.");
    slug = `${base}-${i}`;
  }

  const id = crypto.randomUUID();
  await db.insert(business).values({
    id,
    slug,
    name: body.data.name,
    config: defaultBusinessConfig(body.data.name),
  });
  await db.insert(businessMember).values({ userId: session.user.id, businessId: id, role: "owner" });

  return Response.json(
    { business: { id, slug, name: body.data.name, plan: "free", role: "owner" } },
    { status: 201 },
  );
}
