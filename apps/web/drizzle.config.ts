import { defineConfig } from "drizzle-kit";

/** pnpm db:generate usa los dos dialectos; este archivo es el de SQLite (local). Ver drizzle.pg.config.ts. */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.sqlite.ts",
  out: "./drizzle/sqlite",
});
