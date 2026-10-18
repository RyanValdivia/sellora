import { and, eq } from "drizzle-orm";
import { locationInput } from "@sellora/shared/api/contracts";
import { notFound, parseBody, requireMember } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

type Ctx = RouteContext<"/api/business/[id]/locations/[locationId]">;

export async function PUT(request: Request, ctx: Ctx) {
  const { id, locationId } = await ctx.params;
  const guard = await requireMember(request, id, { ownerOnly: true });
  if ("response" in guard) return guard.response;

  const body = await parseBody(request, locationInput);
  if ("response" in body) return body.response;

  const db = await dbPromise;
  const { location } = schema;
  // El filtro por businessId impide editar ubicaciones de otro negocio con un id ajeno.
  const [row] = await db
    .select({ id: location.id, position: location.position })
    .from(location)
    .where(and(eq(location.id, locationId), eq(location.businessId, id)));
  if (!row) return notFound();

  await db.update(location).set(body.data).where(eq(location.id, locationId));
  return Response.json({ location: { id: locationId, position: row.position, ...body.data } });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const { id, locationId } = await ctx.params;
  const guard = await requireMember(request, id, { ownerOnly: true });
  if ("response" in guard) return guard.response;

  const db = await dbPromise;
  const { location } = schema;
  const [row] = await db
    .select({ id: location.id })
    .from(location)
    .where(and(eq(location.id, locationId), eq(location.businessId, id)));
  if (!row) return notFound();

  await db.delete(location).where(eq(location.id, locationId));
  return new Response(null, { status: 204 });
}
