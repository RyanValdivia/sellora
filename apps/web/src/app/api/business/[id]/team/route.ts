import { and, eq, gt, isNull } from "drizzle-orm";
import config from "@sellora/shared/config";
import type { TeamResponse } from "@sellora/shared/api/contracts";
import { requireMember } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

export async function GET(request: Request, ctx: RouteContext<"/api/business/[id]/team">) {
  const { id } = await ctx.params;
  const guard = await requireMember(request, id, { ownerOnly: true });
  if ("response" in guard) return guard.response;

  const db = await dbPromise;
  const { business, businessMember, invitation, user } = schema;
  const [biz] = await db.select({ plan: business.plan }).from(business).where(eq(business.id, id));
  const members = await db
    .select({ userId: user.id, name: user.name, email: user.email, role: businessMember.role })
    .from(businessMember)
    .innerJoin(user, eq(user.id, businessMember.userId))
    .where(eq(businessMember.businessId, id));
  const invitations = await db
    .select({ id: invitation.id, role: invitation.role, expiresAt: invitation.expiresAt })
    .from(invitation)
    .where(
      and(eq(invitation.businessId, id), isNull(invitation.usedAt), gt(invitation.expiresAt, new Date())),
    );

  const body: TeamResponse = {
    members,
    invitations: invitations.map((i) => ({ ...i, expiresAt: i.expiresAt.toISOString() })),
    maxStaff: config.plans[biz?.plan ?? "free"].maxStaff,
  };
  return Response.json(body);
}
