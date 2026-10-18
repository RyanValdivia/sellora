import { and, eq, gt, isNull } from "drizzle-orm";
import { acceptInvitationInput } from "@sellora/shared/api/contracts";
import { fail, notFound, parseBody } from "@/server/api";
import { auth } from "@/server/auth";
import { dbPromise, schema } from "@/server/db";
import { hashToken } from "@/server/invitations";
import { clientIp, rateLimit } from "@/server/rate-limit";

/** Crea la cuenta de la persona de caja y la une al negocio. El enlace se consume al usarse. */
export async function POST(request: Request, ctx: RouteContext<"/api/invitations/[token]/accept">) {
  if (!rateLimit(`invite:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
    return fail(429, "rate_limited", "Demasiados intentos. Prueba de nuevo en unos minutos.");
  }
  const { token } = await ctx.params;
  const body = await parseBody(request, acceptInvitationInput);
  if ("response" in body) return body.response;

  const db = await dbPromise;
  const { invitation, businessMember, user } = schema;
  const live = and(
    eq(invitation.tokenHash, hashToken(token)),
    isNull(invitation.usedAt),
    gt(invitation.expiresAt, new Date()),
  );
  const [inv] = await db.select().from(invitation).where(live);
  if (!inv) return notFound();

  // Reclamamos el enlace antes de crear la cuenta: si dos personas lo usan a la vez, solo una gana.
  const claimed = await db
    .update(invitation)
    .set({ usedAt: new Date() })
    .where(and(eq(invitation.id, inv.id), isNull(invitation.usedAt)))
    .returning({ id: invitation.id });
  if (claimed.length === 0) return notFound();

  try {
    const created = await auth.api.signUpEmail({ body: body.data });
    // El rol lo fija el servidor: quien acepta nunca elige ser dueño ni superadmin.
    await db.update(user).set({ role: "staff", emailVerified: true }).where(eq(user.id, created.user.id));
    await db
      .insert(businessMember)
      .values({ userId: created.user.id, businessId: inv.businessId, role: inv.role });
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    // Si falló (p. ej. correo ya registrado) devolvemos el enlace para que pueda reintentar.
    await db.update(invitation).set({ usedAt: null }).where(eq(invitation.id, inv.id));
    return fail(422, "account_failed", "No pudimos crear la cuenta. ¿Ya tienes una con ese correo?");
  }
}
