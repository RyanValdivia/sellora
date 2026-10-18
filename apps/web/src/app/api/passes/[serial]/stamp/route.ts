import { loadPassForStaff } from "@/server/api";
import { actionError } from "@/server/passes/errors";
import { stampPass } from "@/server/passes/stamping";

export async function POST(request: Request, ctx: RouteContext<"/api/passes/[serial]/stamp">) {
  const loaded = await loadPassForStaff(request, (await ctx.params).serial);
  if ("response" in loaded) return loaded.response;

  const result = await stampPass(loaded.found, loaded.userId);
  if (!result.ok) return actionError(result);
  return Response.json(result.response);
}
