import { NextResponse, type NextRequest } from "next/server";
import { env } from "./lib/env";

/**
 * CORS para la API: la app Vite/Capacitor corre en otro origen (capacitor://localhost, http://localhost:5173…)
 * y envía `Authorization: Bearer`. Solo se aceptan los orígenes de TRUSTED_ORIGINS.
 */
const allowed = new Set(env.TRUSTED_ORIGINS);

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const ok = origin !== null && allowed.has(origin);

  if (request.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (ok) setCors(res, origin);
    return res;
  }

  const res = NextResponse.next({ request: { headers: withoutStaleCookie(request) } });
  if (ok) setCors(res, origin);
  return res;
}

/**
 * El cliente HTTP nativo de Android no puede enviar Origin (es una cabecera restringida) y recuerda las cookies de
 * sesiones anteriores. Better Auth rechaza con 403 ("Missing or null Origin") cualquier ruta de autenticación que
 * llegue con cookie y sin Origin, lo que bloquea el siguiente inicio de sesión de la app.
 * Un navegador siempre manda Origin en los POST entre sitios, así que sin Origin ni Referer no hay riesgo CSRF:
 * ignoramos la cookie y la sesión viaja por el token bearer.
 */
function withoutStaleCookie(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  const isAuth = request.nextUrl.pathname.startsWith("/api/auth/");
  if (isAuth && !headers.has("origin") && !headers.has("referer")) headers.delete("cookie");
  return headers;
}

function setCors(res: NextResponse, origin: string) {
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Expose-Headers", "set-auth-token");
  res.headers.set("Vary", "Origin");
}

export const config = { matcher: "/api/:path*" };
