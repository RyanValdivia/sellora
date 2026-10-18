import { and, eq } from "drizzle-orm";
import { renameHolderInput } from "@sellora/shared/api/contracts";
import { notFound, parseBody, requireCustomer } from "@/server/api";
import { dbPromise, schema } from "@/server/db";
import { getCustomerCard } from "@/server/passes/customer";
import { notifyPassUpdated } from "@/server/passes/push";

export async function GET(request: Request, ctx: RouteContext<"/api/customer/cards/[serial]">) {
  const guard = await requireCustomer(request);
  if ("response" in guard) return guard.response;
  const card = await getCustomerCard(guard.customerId, (await ctx.params).serial);
  return card ? Response.json({ card }) : notFound();
}

/** El cliente puede ponerle su nombre a la tarjeta (opcional): se usa en {nombre} de los mensajes. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/customer/cards/[serial]">) {
  const guard = await requireCustomer(request);
  if ("response" in guard) return guard.response;
  const { serial } = await ctx.params;

  const body = await parseBody(request, renameHolderInput);
  if ("response" in body) return body.response;

  const db = await dbPromise;
  const { pass } = schema;
  const updated = await db
    .update(pass)
    .set({ holderName: body.data.holderName || null, updatedAt: new Date() })
    .where(and(eq(pass.serial, serial), eq(pass.customerId, guard.customerId)))
    .returning({ id: pass.id });
  if (updated.length === 0) return notFound();

  void notifyPassUpdated(serial);
  return Response.json({ card: await getCustomerCard(guard.customerId, serial) });
}
