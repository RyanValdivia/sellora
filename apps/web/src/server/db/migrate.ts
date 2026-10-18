/** Aplica las migraciones del dialecto activo según DATABASE_URL. Uso: pnpm db:migrate */
import { dbPromise, isPostgres } from "./index";

const db = await dbPromise;

if (isPostgres) {
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  await migrate(db as never, { migrationsFolder: "./drizzle/pg" });
} else {
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: "./drizzle/sqlite" });
}

console.log(`Migraciones aplicadas (${isPostgres ? "Postgres" : "SQLite"}).`);
process.exit(0);
