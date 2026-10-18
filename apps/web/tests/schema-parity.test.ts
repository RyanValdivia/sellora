import { getTableConfig as getPg } from "drizzle-orm/pg-core";
import { getTableConfig as getSqlite } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";
import * as pg from "../src/server/db/schema.pg";
import * as sqlite from "../src/server/db/schema.sqlite";

function describeTables<T>(
  schema: Record<string, unknown>,
  read: (t: never) => {
    name: string;
    columns: { name: string; notNull: boolean }[];
    indexes: { config: { name: string } }[];
  },
  isTable: (v: unknown) => v is T,
) {
  return Object.values(schema)
    .filter(isTable)
    .map((t) => read(t as never))
    .map((c) => ({
      table: c.name,
      columns: c.columns.map((col) => `${col.name}${col.notNull ? "!" : "?"}`).sort(),
      indexes: c.indexes.map((i) => i.config.name).sort(),
    }))
    .sort((a, b) => a.table.localeCompare(b.table));
}

const isObj = (v: unknown): v is object => typeof v === "object" && v !== null;

describe("paridad de esquemas SQLite y Postgres", () => {
  it("tienen las mismas tablas, columnas (y nulabilidad) e índices", () => {
    const a = describeTables(sqlite, getSqlite as never, isObj as never);
    const b = describeTables(pg, getPg as never, isObj as never);
    expect(a.length).toBeGreaterThan(10);
    expect(b).toEqual(a);
  });
});
