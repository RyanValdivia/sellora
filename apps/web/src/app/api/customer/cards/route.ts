import { addCustomerCardInput } from "@sellora/shared/api/contracts";
import { fail, notFound, parseBody, requireCustomer } from "@/server/api";
import { getCustomerCard, listCustomerCards } from "@/server/passes/customer";
import { createPass } from "@/server/passes/service";
import { clientIp, rateLimit } from "@/server/rate-limit";

export async function GET(request: Request) {
  const guard = await requireCustomer(request);
  if ("response" in guard) return guard.response;
  return Response.json({ cards: await listCustomerCards(guard.customerId) });
}

/** Guarda en la app la tarjeta de un negocio. Si ya la tiene, devuelve la misma. */
export async function POST(request: Request) {
  const guard = await requireCustomer(request);
  if ("response" in guard) return guard.response;
  if (!rateLimit(`customer-card:${guard.customerId}:${clientIp(request)}`, 20, 60 * 60 * 1000)) {
    return fail(429, "rate_limited", "Demasiados intentos. Prueba de nuevo en unos minutos.");
  }

  const body = await parseBody(request, addCustomerCardInput);
  if ("response" in body) return body.response;

  const created = await createPass(body.data.slug, guard.customerId);
  if (!created.ok) {
    return created.reason === "not_found"
      ? notFound()
      : fail(409, "plan_limit", "Este negocio llegó al máximo de tarjetas de su plan.");
  }
  const card = await getCustomerCard(guard.customerId, created.serial);
  return Response.json({ card }, { status: created.created ? 201 : 200 });
}
