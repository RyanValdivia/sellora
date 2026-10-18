import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { bearer } from "better-auth/plugins";
import { env } from "../lib/env";
import { dbPromise, isPostgres } from "./db";
import * as sqliteSchema from "./db/schema.sqlite";
import * as pgSchema from "./db/schema.pg";

const db = await dbPromise;

/**
 * Better Auth con correo + contraseña. El plugin bearer devuelve el token en la cabecera
 * `set-auth-token` para que la app Vite/Capacitor lo guarde y lo envíe como `Authorization: Bearer`.
 */
export const auth = betterAuth({
  baseURL: env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.TRUSTED_ORIGINS,
  database: drizzleAdapter(db, {
    provider: isPostgres ? "pg" : "sqlite",
    schema: isPostgres ? pgSchema : sqliteSchema,
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      // El rol nunca lo elige el cliente: solo lo asigna el servidor.
      role: { type: "string", required: false, defaultValue: "owner", input: false },
    },
  },
  plugins: [bearer()],
});

export type Session = typeof auth.$Infer.Session;
