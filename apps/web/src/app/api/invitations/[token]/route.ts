import { and, eq, gt, isNull } from "drizzle-orm";
import { notFound } from "@/server/api";
import { dbPromise, schema } from "@/server/db";
import { hashToken } from "@/server/invitations";

/** Datos mínimos para mostrar la invitación: a qué negocio se invita. */
export async function GET(_request: Request, ctx: RouteContext<"/api/invitations/[token]">) {
  const { token } = await ctx.params;
  const db = await dbPromise;
  const { invitation, business } = schema;
  const [row] = await db
    .select({ businessName: business.name })
    .from(invitation)
    .innerJoin(business, eq(business.id, invitation.businessId))
    .where(
      and(
        eq(invitation.tokenHash, hashToken(token)),
        isNull(invitation.usedAt),
        gt(invitation.expiresAt, new Date()),
      ),
    );
  return row ? Response.json(row) : notFound();
}
