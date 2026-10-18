import { eq } from "drizzle-orm";
import { adminBusinessPatch } from "@sellora/shared/api/contracts";
import { notFound, parseBody, requireSuperadmin } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

/** Activa o desactiva un negocio y cambia su plan. Un negocio inactivo deja de emitir tarjetas nuevas. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/businesses/[id]">) {
  const guard = await requireSuperadmin(request);
  if ("response" in guard) return guard.response;
  const { id } = await ctx.params;

  const body = await parseBody(request, adminBusinessPatch);
  if ("response" in body) return body.response;
  if (Object.keys(body.data).length === 0) return Response.json({ ok: true });

  const db = await dbPromise;
  const updated = await db
    .update(schema.business)
    .set(body.data)
    .where(eq(schema.business.id, id))
    .returning({ id: schema.business.id });
  return updated.length === 0 ? notFound() : Response.json({ ok: true });
}
