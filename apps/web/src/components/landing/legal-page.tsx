import Link from "next/link";
import config from "@sellora/shared/config";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/landing/site-footer";
import { t, tr } from "@sellora/shared/i18n";

type Section = { title: string; body: string[] };

/** Página legal genérica: el contenido sale del diccionario (legal.privacy / legal.terms). */
export function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const base = `legal.${doc}`;
  const vars = { email: config.contact.email };
  const sections = tr<Section[]>(`${base}.sections`);
  const fill = (s: string) => s.replaceAll("{email}", vars.email).replaceAll("{brand}", config.brand.name);
  const updated = new Intl.DateTimeFormat(config.locale.default, {
    dateStyle: "long",
    timeZone: config.locale.timeZone,
  }).format(new Date(`${config.legal.updatedAt}T12:00:00Z`));

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label={t("common.backHome")}>
            <Logo className="h-8" />
          </Link>
          <Link href="/" className="text-sm font-medium hover:underline">
            {t("common.backHome")}
          </Link>
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{t(`${base}.title` as "legal.privacy.title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t(`${base}.intro` as "legal.privacy.intro")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("legal.updated", { date: updated })}</p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-2xl font-bold">{fill(s.title)}</h2>
              {s.body.map((p) => (
                <p key={p} className="mt-3 leading-relaxed">
                  {fill(p)}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-2xl border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
          {t("legal.draftNotice")}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
