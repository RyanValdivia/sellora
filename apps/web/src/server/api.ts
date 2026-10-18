import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import type { ApiError } from "@sellora/shared/api/contracts";
import { auth } from "./auth";
import { dbPromise, schema } from "./db";

export function fail(status: number, code: string, message: string, issues?: ApiError["error"]["issues"]) {
  const body: ApiError = { error: { code, message, ...(issues ? { issues } : {}) } };
  return Response.json(body, { status });
}

export const unauthorized = () => fail(401, "unauthorized", "Inicia sesión para continuar.");
export const forbidden = () => fail(403, "forbidden", "No tienes acceso a este negocio.");
export const notFound = () => fail(404, "not_found", "No encontramos lo que buscas.");

/** Valida el cuerpo JSON con zod; devuelve los datos o una respuesta 400 lista para devolver. */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  zodSchema: S,
): Promise<{ data: z.infer<S> } | { response: Response }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: fail(400, "invalid_json", "El cuerpo debe ser JSON válido.") };
  }
  const parsed = zodSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return { response: fail(400, "invalid_body", "Hay datos que corregir.", issues) };
  }
  return { data: parsed.data };
}

export async function getSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export type Membership = {
  userId: string;
  role: "owner" | "staff";
  businessId: string;
};

/**
 * Exige sesión y pertenencia al negocio. El superadmin puede entrar a cualquiera como dueño.
 * Con `ownerOnly`, el personal de caja queda fuera (editar tarjeta, ubicaciones, equipo).
 */
export async function requireMember(
  request: Request,
  businessId: string,
  opts: { ownerOnly?: boolean } = {},
): Promise<{ membership: Membership } | { response: Response }> {
  const session = await getSession(request);
  if (!session) return { response: unauthorized() };

  const db = await dbPromise;
  const { businessMember } = schema;
  const [row] = await db
    .select()
    .from(businessMember)
    .where(and(eq(businessMember.userId, session.user.id), eq(businessMember.businessId, businessId)));

  let role = row?.role;
  if (!role && (session.user as { role?: string }).role === "superadmin") role = "owner";
  if (!role) return { response: forbidden() };
  if (opts.ownerOnly && role !== "owner") return { response: forbidden() };
  return { membership: { userId: session.user.id, role, businessId } };
}

/** Solo el superadmin de la plataforma. Para el resto responde 404 y no revela que el panel existe. */
export async function requireSuperadmin(
  request: Request,
): Promise<{ userId: string } | { response: Response }> {
  const session = await getSession(request);
  if (!session) return { response: unauthorized() };
  if ((session.user as { role?: string }).role !== "superadmin") return { response: notFound() };
  return { userId: session.user.id };
}

/**
 * Carga una tarjeta para el personal. Responde igual (404) si no existe o si es de otro negocio,
 * para que un cajero no pueda averiguar qué seriales existen en otros locales.
 */
export async function loadPassForStaff(request: Request, serial: string) {
  const { findPass } = await import("./passes/stamping");
  const session = await getSession(request);
  if (!session) return { response: unauthorized() };
  const found = await findPass(serial);
  if (!found) return { response: notFound() };
  const guard = await requireMember(request, found.business.id);
  if ("response" in guard) return { response: notFound() };
  return { found, userId: guard.membership.userId };
}
