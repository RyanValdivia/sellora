import { and, eq, gt, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import { t } from "@sellora/shared/i18n";
import { Logo } from "@sellora/ui/brand/logo";
import { dbPromise, schema } from "@/server/db";
import { hashToken } from "@/server/invitations";
import { AcceptForm } from "./accept-form";

type Props = PageProps<"/i/[token]">;

export const metadata: Metadata = { title: "Invitación", robots: { index: false, follow: false } };

/** Página a la que llega la persona de caja desde el enlace que le pasó el dueño. */
export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const db = await dbPromise;
  const { invitation, business } = schema;
  const [row] = await db
    .select({ businessName: business.name })
    .from(invitation)
    .innerJoin(business, eq(business.id, invitation.businessId))
    .where(
      and(
        eq(invitation.tokenHash, hashToken(token)),
        isNull(invitation.usedAt),
        gt(invitation.expiresAt, new Date()),
      ),
    );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      <Logo className="h-9 self-start" />
      {row ? (
        <>
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold">{t("invite.title")}</h1>
            <p className="text-muted-foreground">{t("invite.subtitle", { business: row.businessName })}</p>
          </header>
          <AcceptForm token={token} />
        </>
      ) : (
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold">{t("invite.invalidTitle")}</h1>
          <p className="text-muted-foreground">{t("invite.invalidBody")}</p>
        </header>
      )}
    </main>
  );
}
