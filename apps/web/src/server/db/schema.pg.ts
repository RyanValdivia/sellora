/**
 * Esquema Postgres (producción). Debe ser idéntico en tablas y columnas a schema.sqlite.ts:
 * lo comprueba tests/schema-parity.test.ts. Si cambias uno, cambia el otro y genera ambas migraciones
 * (pnpm db:generate).
 */
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { BusinessConfig } from "@sellora/shared/business/config";

const id = () => text("id").primaryKey();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date());

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Better Auth ────────────────────────────────────────────────────────────
export const user = pgTable("user", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["superadmin", "owner", "staff"] })
    .notNull()
    .default("owner"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const session = pgTable(
  "session",
  {
    id: id(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
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

export const account = pgTable(
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
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ── Negocios ───────────────────────────────────────────────────────────────
export const business = pgTable("business", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  plan: text("plan", { enum: ["free", "pro"] })
    .notNull()
    .default("free"),
  active: boolean("active").notNull().default(true),
  config: jsonb("config").$type<BusinessConfig>().notNull(),
  createdAt: createdAt(),
});

export const businessMember = pgTable(
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

export const invitation = pgTable("invitation", {
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
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const location = pgTable(
  "location",
  {
    id: id(),
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    address: text("address").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    alertText: text("alert_text"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("location_business_idx").on(t.businessId)],
);

export const asset = pgTable(
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
export const customer = pgTable("customer", {
  id: id(),
  displayName: text("display_name"),
  createdAt: createdAt(),
});

export const pass = pgTable(
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
    rewardReady: boolean("reward_ready").notNull().default(false),
    lastStampAt: timestamp("last_stamp_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("pass_business_idx").on(t.businessId),
    uniqueIndex("pass_business_customer_uq").on(t.businessId, t.customerId),
  ],
);

export const stampEvent = pgTable(
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

export const deviceRegistration = pgTable(
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

export const pushDevice = pgTable("push_device", {
  id: id(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  customerId: text("customer_id").references(() => customer.id, { onDelete: "cascade" }),
  platform: text("platform", { enum: ["ios", "android"] }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: createdAt(),
});
