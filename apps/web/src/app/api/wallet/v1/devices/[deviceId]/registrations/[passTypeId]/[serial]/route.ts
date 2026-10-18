import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { dbPromise, schema } from "@/server/db";
import { authorizedPass, isOurPassType } from "@/server/passes/wallet-auth";

type Ctx = RouteContext<"/api/wallet/v1/devices/[deviceId]/registrations/[passTypeId]/[serial]">;

const body = z.object({ pushToken: z.string().min(1).max(512) });

/** Wallet registra un dispositivo para recibir actualizaciones de este pase. */
export async function POST(request: Request, ctx: Ctx) {
  const { deviceId, passTypeId, serial } = await ctx.params;
  if (!isOurPassType(passTypeId)) return new Response(null, { status: 404 });
  const pass = await authorizedPass(request, serial);
  if (!pass) return new Response(null, { status: 401 });

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });

  const db = await dbPromise;
  const { deviceRegistration } = schema;
  const where = and(eq(deviceRegistration.passId, pass.id), eq(deviceRegistration.deviceLibraryId, deviceId));
  const [existing] = await db.select({ id: deviceRegistration.id }).from(deviceRegistration).where(where);

  if (existing) {
    // Wallet puede rotar el token de push: lo mantenemos al día.
    await db.update(deviceRegistration).set({ pushToken: parsed.data.pushToken }).where(where);
    return new Response(null, { status: 200 });
  }
  await db.insert(deviceRegistration).values({
    id: crypto.randomUUID(),
    passId: pass.id,
    deviceLibraryId: deviceId,
    pushToken: parsed.data.pushToken,
  });
  return new Response(null, { status: 201 });
}

/** El usuario quitó el pase de Wallet: dejamos de enviarle pushes. */
export async function DELETE(request: Request, ctx: Ctx) {
  const { deviceId, passTypeId, serial } = await ctx.params;
  if (!isOurPassType(passTypeId)) return new Response(null, { status: 404 });
  const pass = await authorizedPass(request, serial);
  if (!pass) return new Response(null, { status: 401 });

  const db = await dbPromise;
  const { deviceRegistration } = schema;
  await db
    .delete(deviceRegistration)
    .where(and(eq(deviceRegistration.passId, pass.id), eq(deviceRegistration.deviceLibraryId, deviceId)));
  return new Response(null, { status: 200 });
}
