import { and, count, eq, gt, isNull } from "drizzle-orm";
import config from "@sellora/shared/config";
import { env } from "@/lib/env";
import { fail, requireMember } from "@/server/api";
import { dbPromise, schema } from "@/server/db";
import { INVITATION_TTL_MS, hashToken, newInvitationToken } from "@/server/invitations";

/** El dueño genera un enlace de invitación para una persona de caja. Vale 7 días y se usa una vez. */
export async function POST(request: Request, ctx: RouteContext<"/api/business/[id]/invitations">) {
  const { id } = await ctx.params;
  const guard = await requireMember(request, id, { ownerOnly: true });
  if ("response" in guard) return guard.response;

  const db = await dbPromise;
  const { business, businessMember, invitation } = schema;
  const [biz] = await db.select({ plan: business.plan }).from(business).where(eq(business.id, id));
  if (!biz) return fail(404, "not_found", "No encontramos el negocio.");

  const [{ staff }] = await db
    .select({ staff: count() })
    .from(businessMember)
    .where(and(eq(businessMember.businessId, id), eq(businessMember.role, "staff")));
  const [{ pending }] = await db
    .select({ pending: count() })
    .from(invitation)
    .where(
      and(eq(invitation.businessId, id), isNull(invitation.usedAt), gt(invitation.expiresAt, new Date())),
    );
  const max = config.plans[biz.plan].maxStaff;
  if (staff + pending >= max)
    return fail(402, "plan_limit", `Tu plan permite hasta ${max} personas de caja.`);

  const token = newInvitationToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  await db.insert(invitation).values({
    id: crypto.randomUUID(),
    businessId: id,
    createdBy: guard.membership.userId,
    tokenHash: hashToken(token),
    role: "staff",
    expiresAt,
  });

  // El token en claro solo existe en esta respuesta.
  return Response.json(
    { link: `${env.APP_URL}/i/${token}`, expiresAt: expiresAt.toISOString() },
    { status: 201 },
  );
}
