import { z } from "zod";

/**
 * Variables de entorno validadas al arrancar (capa 2).
 * Se amplía en cada hito; ver .env.example para la descripción de cada una.
 */
const schema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  /** file:./data/sellora.db (SQLite) o postgres://... (Postgres). Decide el driver. */
  DATABASE_URL: z
    .string()
    .regex(/^(file:|postgres(ql)?:\/\/)/, "Debe empezar con file: o postgres://")
    .default("file:./data/sellora.db"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "Usa al menos 32 caracteres (openssl rand -base64 32)")
    .default("dev-only-secret-change-me-dev-only-secret-change-me"),
  /** Orígenes extra que pueden llamar a la API (la app Vite/Capacitor), separados por comas. */
  TRUSTED_ORIGINS: z
    .string()
    .default("http://localhost:5173,capacitor://localhost,https://localhost,http://localhost")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Variables de entorno inválidas:\n${issues}\nRevisa tu .env contra .env.example.`);
}

// `next build` también corre con NODE_ENV=production, pero aún no sirve tráfico: el secreto se exige al arrancar.
const building = process.env.NEXT_PHASE === "phase-production-build";
if (
  !building &&
  process.env.NODE_ENV === "production" &&
  parsed.data.BETTER_AUTH_SECRET.startsWith("dev-only")
) {
  throw new Error("Define BETTER_AUTH_SECRET con un valor propio antes de ir a producción.");
}

export const env: Env = parsed.data;
