import { and, desc, eq } from "drizzle-orm";
import type { CustomerCardDto } from "@sellora/shared/api/contracts";
import { dbPromise, schema } from "../db";
import { toCardDto } from "./stamping";

type Row = { pass: typeof schema.pass.$inferSelect; business: typeof schema.business.$inferSelect };

function toDto({ pass, business }: Row): CustomerCardDto {
  return {
    card: toCardDto({
      pass,
      business: { id: business.id, name: business.name, config: business.config },
    }),
    slug: business.slug,
    identity: { name: business.name },
    passDesign: business.config.passDesign,
  };
}

export async function listCustomerCards(customerId: string): Promise<CustomerCardDto[]> {
  const db = await dbPromise;
  const { pass, business } = schema;
  const rows = await db
    .select({ pass, business })
    .from(pass)
    .innerJoin(business, eq(business.id, pass.businessId))
    .where(eq(pass.customerId, customerId))
    .orderBy(desc(pass.updatedAt));
  return rows.map(toDto);
}

/** Una tarjeta, solo si pertenece a ese cliente. */
export async function getCustomerCard(customerId: string, serial: string): Promise<CustomerCardDto | null> {
  const db = await dbPromise;
  const { pass, business } = schema;
  const [row] = await db
    .select({ pass, business })
    .from(pass)
    .innerJoin(business, eq(business.id, pass.businessId))
    .where(and(eq(pass.serial, serial), eq(pass.customerId, customerId)));
  return row ? toDto(row) : null;
}
