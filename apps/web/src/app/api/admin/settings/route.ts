import { platformSettingsInput } from "@sellora/shared/api/contracts";
import { parseBody, requireSuperadmin } from "@/server/api";
import { getPlatformSettings, savePlatformSettings } from "@/server/settings";

export async function GET(request: Request) {
  const guard = await requireSuperadmin(request);
  if ("response" in guard) return guard.response;
  return Response.json({ settings: await getPlatformSettings() });
}

export async function PUT(request: Request) {
  const guard = await requireSuperadmin(request);
  if ("response" in guard) return guard.response;
  const body = await parseBody(request, platformSettingsInput);
  if ("response" in body) return body.response;
  await savePlatformSettings(body.data);
  return Response.json({ settings: body.data });
}
