import { Preferences } from "@capacitor/preferences";
import type { ApiError } from "@sellora/shared/api/contracts";

/** URL del servidor (apps/web). En el emulador de Android, localhost del PC es 10.0.2.2. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
/** URL pública que se imprime en el QR de cada negocio. */
export const PUBLIC_URL: string = import.meta.env.VITE_PUBLIC_URL ?? API_URL;

const TOKEN_KEY = "sellora.token";
let token: string | null = null;

export async function loadToken(): Promise<string | null> {
  token = (await Preferences.get({ key: TOKEN_KEY })).value;
  return token;
}

export async function saveToken(value: string | null): Promise<void> {
  token = value;
  if (value) await Preferences.set({ key: TOKEN_KEY, value });
  else await Preferences.remove({ key: TOKEN_KEY });
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}

export async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new HttpError(0, "network", "No pudimos conectar con el servidor. Revisa tu internet.");
  }
  if (!res.ok) {
    // Nuestras rutas responden { error: { code, message } }; Better Auth responde { code, message }.
    const body = (await res.json().catch(() => null)) as
      (Partial<ApiError> & { code?: string; message?: string }) | null;
    throw new HttpError(
      res.status,
      body?.error?.code ?? body?.code ?? "unknown",
      body?.error?.message ?? body?.message ?? "Algo salió mal. Inténtalo de nuevo.",
      body?.error?.issues,
    );
  }
  return res;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await request(path, init);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });
