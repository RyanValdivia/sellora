import { eq } from "drizzle-orm";
import { t } from "@sellora/shared/i18n";
import { fail, notFound } from "@/server/api";
import { dbPromise, schema } from "@/server/db";
import { buildPkpass } from "@/server/passes/build";
import { createPass, loadPassContext } from "@/server/passes/service";
import { clientIp, rateLimit } from "@/server/rate-limit";

const YEAR = 60 * 60 * 24 * 365;

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

/**
 * Entrega el .pkpass del negocio. La primera vez crea la tarjeta y recuerda su serial en una cookie;
 * las siguientes devuelve la misma tarjeta para no llenar la base con duplicados.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/b/[slug]/pkpass">) {
  const { slug } = await ctx.params;
  const cookieName = `sellora_pass_${slug}`;

  let serial = readCookie(request, cookieName);
  if (serial) {
    const db = await dbPromise;
    const [known] = await db
      .select({ id: schema.pass.id })
      .from(schema.pass)
      .where(eq(schema.pass.serial, serial));
    if (!known) serial = null;
  }

  if (!serial) {
    if (!rateLimit(`pkpass:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
      return fail(429, "rate_limited", t("card.rateLimited"));
    }
    const created = await createPass(slug);
    if (!created.ok) {
      return created.reason === "not_found" ? notFound() : fail(409, "plan_limit", t("card.tooMany"));
    }
    serial = created.serial;
  }

  const context = await loadPassContext(serial, "welcome");
  if (!context) return notFound();
  const { buffer, mode } = await buildPkpass(context);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${slug}.pkpass"`,
      "Cache-Control": "no-store",
      "X-Sellora-Wallet-Mode": mode,
      "Set-Cookie": `${cookieName}=${serial}; Path=/; Max-Age=${YEAR}; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`,
    },
  });
}
