import { eq } from "drizzle-orm";
import { pushTokenInput } from "@sellora/shared/api/contracts";
import { parseBody, requireCustomer } from "@/server/api";
import { dbPromise, schema } from "@/server/db";

/** La app registra su token de notificaciones (FCM o APNs) para avisar cuando cambie una tarjeta. */
export async function POST(request: Request) {
  const guard = await requireCustomer(request);
  if ("response" in guard) return guard.response;
  const body = await parseBody(request, pushTokenInput);
  if ("response" in body) return body.response;

  const db = await dbPromise;
  const { pushDevice } = schema;
  const [existing] = await db
    .select({ id: pushDevice.id })
    .from(pushDevice)
    .where(eq(pushDevice.token, body.data.token));
  if (existing) {
    // El mismo dispositivo puede cambiar de cuenta anónima (reinstalación): reasignamos el token.
    await db
      .update(pushDevice)
      .set({ customerId: guard.customerId, platform: body.data.platform })
      .where(eq(pushDevice.id, existing.id));
  } else {
    await db.insert(pushDevice).values({
      id: crypto.randomUUID(),
      customerId: guard.customerId,
      platform: body.data.platform,
      token: body.data.token,
    });
  }
  return new Response(null, { status: 204 });
}
