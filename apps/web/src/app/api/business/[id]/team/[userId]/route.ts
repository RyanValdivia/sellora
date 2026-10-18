import { and, eq } from "drizzle-orm";
import { fail, notFound, requireMember } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

/** Quita a una persona de caja del negocio (no a los dueños). Ya no podrá sellar. */
export async function DELETE(request: Request, ctx: RouteContext<"/api/business/[id]/team/[userId]">) {
  const { id, userId } = await ctx.params;
  const guard = await requireMember(request, id, { ownerOnly: true });
  if ("response" in guard) return guard.response;

  const db = await dbPromise;
  const { businessMember } = schema;
  const [row] = await db
    .select({ role: businessMember.role })
    .from(businessMember)
    .where(and(eq(businessMember.businessId, id), eq(businessMember.userId, userId)));
  if (!row) return notFound();
  if (row.role === "owner") return fail(409, "owner", "No se puede quitar al dueño del negocio.");

  await db
    .delete(businessMember)
    .where(and(eq(businessMember.businessId, id), eq(businessMember.userId, userId)));
  return new Response(null, { status: 204 });
}
