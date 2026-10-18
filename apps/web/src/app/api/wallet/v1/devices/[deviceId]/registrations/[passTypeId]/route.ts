import { and, eq, gt } from "drizzle-orm";
import { dbPromise, schema } from "@/server/db";
import { isOurPassType } from "@/server/passes/wallet-auth";

/**
 * Wallet pregunta qué pases de este dispositivo cambiaron desde la última vez.
 * `passesUpdatedSince` es la etiqueta (`lastUpdated`) que devolvimos en la consulta anterior.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/wallet/v1/devices/[deviceId]/registrations/[passTypeId]">,
) {
  const { deviceId, passTypeId } = await ctx.params;
  if (!isOurPassType(passTypeId)) return new Response(null, { status: 404 });

  const since = Number(new URL(request.url).searchParams.get("passesUpdatedSince") ?? 0);
  const db = await dbPromise;
  const { deviceRegistration, pass } = schema;
  const rows = await db
    .select({ serial: pass.serial, updatedAt: pass.updatedAt })
    .from(deviceRegistration)
    .innerJoin(pass, eq(pass.id, deviceRegistration.passId))
    .where(
      and(
        eq(deviceRegistration.deviceLibraryId, deviceId),
        gt(pass.updatedAt, new Date(Number.isFinite(since) ? since : 0)),
      ),
    );

  if (rows.length === 0) return new Response(null, { status: 204 });
  const lastUpdated = Math.max(...rows.map((r) => r.updatedAt.getTime()));
  return Response.json({ serialNumbers: rows.map((r) => r.serial), lastUpdated: String(lastUpdated) });
}
