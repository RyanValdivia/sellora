import { z } from "zod";

/**
 * Variables de entorno validadas al arrancar (capa 2).
 * Se amplía en cada hito; ver .env.example para la descripción de cada una.
 */
const schema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Variables de entorno inválidas:\n${issues}\nRevisa tu .env contra .env.example.`);
}

export const env: Env = parsed.data;
