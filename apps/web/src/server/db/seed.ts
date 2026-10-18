/**
 * Datos de ejemplo: superadmin, "Panadería Alba" con su dueño y una ubicación.
 * Uso: pnpm db:seed (idempotente). Las credenciales son SOLO para desarrollo local.
 */
import { eq } from "drizzle-orm";
import { defaultBusinessConfig } from "@sellora/shared/business/config";
import { auth } from "../auth";
import { dbPromise, schema } from "./index";

const db = await dbPromise;
const { user, business, businessMember, location, platformSettings } = schema;

const DEV_PASSWORD = process.env.SEED_PASSWORD ?? "sellora-dev-123";

async function ensureUser(email: string, name: string, role: "superadmin" | "owner") {
  const [existing] = await db.select().from(user).where(eq(user.email, email));
  if (existing) return existing.id;
  const res = await auth.api.signUpEmail({ body: { email, password: DEV_PASSWORD, name } });
  await db.update(user).set({ role, emailVerified: true }).where(eq(user.id, res.user.id));
  return res.user.id;
}

await ensureUser("admin@sellora.test", "Admin Sellora", "superadmin");
const ownerId = await ensureUser("alba@sellora.test", "Rosa Alba", "owner");

const [existing] = await db.select().from(business).where(eq(business.slug, "panaderia-alba"));
if (!existing) {
  const config = defaultBusinessConfig("Panadería Alba");
  config.identity.category = "panaderia";
  config.identity.tagline = "Pan caliente desde las 6 a. m.";
  config.rules = { ...config.rules, stampsRequired: 6, reward: "Un café gratis", maxStampsPerDay: 1 };
  config.passDesign.stampIcon = "bread";

  const businessId = crypto.randomUUID();
  await db
    .insert(business)
    .values({ id: businessId, slug: "panaderia-alba", name: "Panadería Alba", config });
  await db.insert(businessMember).values({ userId: ownerId, businessId, role: "owner" });
  await db.insert(location).values({
    id: crypto.randomUUID(),
    businessId,
    label: "Local principal",
    address: "Av. Larco 345, Miraflores, Lima",
    lat: -12.1219,
    lng: -77.0297,
    alertText: "Estás al lado 🥐 Pasa por tu sello.",
  });
}

await db
  .insert(platformSettings)
  .values({ key: "maintenance", value: { enabled: false } })
  .onConflictDoNothing();

console.log("Seed listo.");
console.log("  superadmin: admin@sellora.test");
console.log("  dueño:      alba@sellora.test");
console.log(`  contraseña: ${DEV_PASSWORD}  (solo desarrollo)`);
process.exit(0);
