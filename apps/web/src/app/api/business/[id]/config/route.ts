import { eq } from "drizzle-orm";
import { updateConfigInput } from "@sellora/shared/api/contracts";
import { notFound, parseBody, requireMember } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

export async function GET(request: Request, ctx: RouteContext<"/api/business/[id]/config">) {
  const { id } = await ctx.params;
  const guard = await requireMember(request, id);
  if ("response" in guard) return guard.response;

  const db = await dbPromise;
  const [row] = await db.select().from(schema.business).where(eq(schema.business.id, id));
  if (!row) return notFound();
  return Response.json({ config: row.config, plan: row.plan, role: guard.membership.role });
}

/** Solo el dueño edita la tarjeta. */
export async function PUT(request: Request, ctx: RouteContext<"/api/business/[id]/config">) {
  const { id } = await ctx.params;
  const guard = await requireMember(request, id, { ownerOnly: true });
  if ("response" in guard) return guard.response;

  const body = await parseBody(request, updateConfigInput);
  if ("response" in body) return body.response;

  const db = await dbPromise;
  const { business } = schema;
  const [row] = await db.select({ id: business.id }).from(business).where(eq(business.id, id));
  if (!row) return notFound();

  await db
    .update(business)
    .set({ config: body.data, name: body.data.identity.name })
    .where(eq(business.id, id));
  return Response.json({ config: body.data });
}
