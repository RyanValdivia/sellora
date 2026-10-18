import { and, asc, eq } from "drizzle-orm";
import { Smartphone, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import config from "@sellora/shared/config";
import { PassPreview } from "@sellora/ui/brand/pass-preview";
import { buttonVariants } from "@sellora/ui/components/button";
import { cn } from "@sellora/ui/utils";
import { t } from "@sellora/shared/i18n";
import { dbPromise, schema } from "@/server/db";
import { walletMode } from "@/server/passes/certificates";

type Props = PageProps<"/b/[slug]">;

async function load(slug: string) {
  const db = await dbPromise;
  const { business, location } = schema;
  const [biz] = await db
    .select()
    .from(business)
    .where(and(eq(business.slug, slug), eq(business.active, true)));
  if (!biz) return null;
  const locations = await db
    .select({ label: location.label, address: location.address })
    .from(location)
    .where(eq(location.businessId, biz.id))
    .orderBy(asc(location.position));
  return { biz, locations };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug);
  return data ? { title: data.biz.name, description: data.biz.config.landing.body } : {};
}

/** Landing pública del negocio: aquí llega el cliente al escanear el QR o tocar la etiqueta NFC. */
export default async function BusinessLanding({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { biz, locations } = data;
  const { landing, passDesign, identity, rules } = biz.config;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">{identity.tagline || biz.name}</p>
        <h1 className="text-3xl font-extrabold">{landing.headline}</h1>
        <p className="text-muted-foreground">{landing.body}</p>
      </header>

      <PassPreview config={{ identity, passDesign, rules }} stamps={Math.min(2, rules.stampsRequired)} />

      <section className="flex flex-col gap-3">
        <a
          href={`/api/b/${slug}/pkpass`}
          className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full text-base")}
        >
          <Wallet aria-hidden /> {t("card.addToApple")}
        </a>
        <p className="flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
          <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("card.androidSoon")}
        </p>
        {walletMode === "preview" && process.env.NODE_ENV !== "production" ? (
          <p role="note" className="rounded-xl bg-muted p-3 text-center text-xs">
            {t("card.previewNotice")}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-semibold">{t("card.howTitle")}</h2>
        <p className="text-muted-foreground">
          {t("card.howBody", { total: rules.stampsRequired, reward: rules.reward })}
        </p>
      </section>

      {locations.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold">{t("card.locationsTitle")}</h2>
          <ul className="flex flex-col gap-2">
            {locations.map((l) => (
              <li key={l.label + l.address} className="rounded-xl border border-border bg-card p-3 text-sm">
                <span className="font-medium">{l.label}</span>
                <span className="block text-muted-foreground">{l.address}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="text-center text-sm">
        <Link href="/privacidad" className="text-ink-accent underline underline-offset-4">
          {t("card.privacy")}
        </Link>
      </footer>
    </main>
  );
}
