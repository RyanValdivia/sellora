import { buildPkpass } from "@/server/passes/build";
import { loadPassContext } from "@/server/passes/service";
import { authorizedPass, isOurPassType } from "@/server/passes/wallet-auth";

/** Wallet descarga la versión más reciente del pase. Responde 304 si no cambió. */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/wallet/v1/passes/[passTypeId]/[serial]">,
) {
  const { passTypeId, serial } = await ctx.params;
  if (!isOurPassType(passTypeId)) return new Response(null, { status: 404 });
  const pass = await authorizedPass(request, serial);
  if (!pass) return new Response(null, { status: 401 });

  // Las cabeceras HTTP tienen precisión de segundos.
  const lastModified = new Date(Math.floor(pass.updatedAt.getTime() / 1000) * 1000);
  const since = request.headers.get("if-modified-since");
  if (since && new Date(since).getTime() >= lastModified.getTime())
    return new Response(null, { status: 304 });

  const context = await loadPassContext(serial, "stamp");
  if (!context) return new Response(null, { status: 404 });
  const { buffer } = await buildPkpass(context);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Last-Modified": lastModified.toUTCString(),
      "Cache-Control": "no-store",
    },
  });
}
