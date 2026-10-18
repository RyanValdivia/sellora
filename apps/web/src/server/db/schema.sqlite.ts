/**
 * Esquema SQLite (desarrollo local). Debe ser idéntico en tablas y columnas a schema.pg.ts:
 * lo comprueba tests/schema-parity.test.ts. Si cambias uno, cambia el otro y genera ambas migraciones
 * (pnpm db:generate).
 */
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { BusinessConfig } from "@sellora/shared/business/config";

const id = () => text("id").primaryKey();
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const platformSettings = sqliteTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Better Auth ────────────────────────────────────────────────────────────
export const user = sqliteTable("user", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["superadmin", "owner", "staff"] })
    .notNull()
    .default("owner"),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const session = sqliteTable(
  "session",
  {
    id: id(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ── Negocios ───────────────────────────────────────────────────────────────
export const business = sqliteTable("business", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  plan: text("plan", { enum: ["free", "pro"] })
    .notNull()
    .default("free"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  config: text("config", { mode: "json" }).$type<BusinessConfig>().notNull(),
  createdAt: createdAt(),
});

export const businessMember = sqliteTable(
  "business_member",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "staff"] }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.businessId] })],
);

export const invitation = sqliteTable("invitation", {
  id: id(),
  businessId: text("business_id")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  role: text("role", { enum: ["owner", "staff"] })
    .notNull()
    .default("staff"),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
});

export const location = sqliteTable(
  "location",
  {
    id: id(),
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    address: text("address").notNull(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    alertText: text("alert_text"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("location_business_idx").on(t.businessId)],
);

export const asset = sqliteTable(
  "asset",
  {
    id: id(),
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["logo", "cover", "stamp_icon"] }).notNull(),
    storageKey: text("storage_key").notNull(),
    mime: text("mime").notNull(),
  },
  (t) => [index("asset_business_idx").on(t.businessId)],
);

// ── Clientes y tarjetas ────────────────────────────────────────────────────
export const customer = sqliteTable("customer", {
  id: id(),
  displayName: text("display_name"),
  createdAt: createdAt(),
});

export const pass = sqliteTable(
  "pass",
  {
    id: id(),
    serial: text("serial").notNull().unique(),
    authToken: text("auth_token").notNull(),
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
    holderName: text("holder_name"),
    stamps: integer("stamps").notNull().default(0),
    redemptions: integer("redemptions").notNull().default(0),
    rewardReady: integer("reward_ready", { mode: "boolean" }).notNull().default(false),
    lastStampAt: integer("last_stamp_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("pass_business_idx").on(t.businessId),
    uniqueIndex("pass_business_customer_uq").on(t.businessId, t.customerId),
  ],
);

export const stampEvent = sqliteTable(
  "stamp_event",
  {
    id: id(),
    passId: text("pass_id")
      .notNull()
      .references(() => pass.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    type: text("type", { enum: ["stamp", "redeem", "adjust"] }).notNull(),
    amount: integer("amount").notNull().default(1),
    createdAt: createdAt(),
  },
  (t) => [index("stamp_event_pass_idx").on(t.passId, t.createdAt)],
);

export const deviceRegistration = sqliteTable(
  "device_registration",
  {
    id: id(),
    passId: text("pass_id")
      .notNull()
      .references(() => pass.id, { onDelete: "cascade" }),
    deviceLibraryId: text("device_library_id").notNull(),
    pushToken: text("push_token").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("device_registration_uq").on(t.deviceLibraryId, t.passId)],
);

export const pushDevice = sqliteTable("push_device", {
  id: id(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  customerId: text("customer_id").references(() => customer.id, { onDelete: "cascade" }),
  platform: text("platform", { enum: ["ios", "android"] }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: createdAt(),
});
