import { mkdirSync } from "node:fs";
import path from "node:path";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { env } from "../../lib/env";
import * as sqliteSchema from "./schema.sqlite";
import * as pgSchema from "./schema.pg";

export type Db = BetterSQLite3Database<typeof sqliteSchema>;
export const isPostgres = /^postgres(ql)?:\/\//.test(env.DATABASE_URL);

/** Tablas del esquema activo. Mismo tipo para ambos dialectos (el paridad se prueba en tests). */
export const schema = (isPostgres ? pgSchema : sqliteSchema) as typeof sqliteSchema;

async function connect(): Promise<Db> {
  if (isPostgres) {
    const [{ drizzle }, { Pool }] = await Promise.all([import("drizzle-orm/node-postgres"), import("pg")]);
    return drizzle(new Pool({ connectionString: env.DATABASE_URL }), { schema: pgSchema }) as unknown as Db;
  }
  const [{ drizzle }, { default: Database }] = await Promise.all([
    import("drizzle-orm/better-sqlite3"),
    import("better-sqlite3"),
  ]);
  const file = path.resolve(env.DATABASE_URL.replace(/^file:/, ""));
  mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema: sqliteSchema });
}

/**
 * Cliente único (se reutiliza entre recargas en desarrollo).
 * Usa siempre `await` en las consultas y no uses transacciones con callbacks async:
 * better-sqlite3 es síncrono y Postgres no.
 */
const globalForDb = globalThis as unknown as { __selloraDb?: Promise<Db> };
export const dbPromise: Promise<Db> = (globalForDb.__selloraDb ??= connect());
