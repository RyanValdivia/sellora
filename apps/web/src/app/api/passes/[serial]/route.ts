import { loadPassForStaff } from "@/server/api";
import { toCardDto } from "@/server/passes/stamping";

/** Estado de una tarjeta para caja: solo personal del negocio al que pertenece. */
export async function GET(request: Request, ctx: RouteContext<"/api/passes/[serial]">) {
  const loaded = await loadPassForStaff(request, (await ctx.params).serial);
  if ("response" in loaded) return loaded.response;
  return Response.json({ card: toCardDto(loaded.found) });
}
