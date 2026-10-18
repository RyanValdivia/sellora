import Link from "next/link";
import config from "@sellora/shared/config";
import { Logo } from "@/components/brand/logo";
import { t } from "@sellora/shared/i18n";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo className="h-8" />
          <p className="mt-3 font-serif text-lg text-muted-foreground italic">{config.brand.tagline}</p>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href={config.legal.privacyPath} className="hover:underline">
            {t("common.privacy")}
          </Link>
          <Link href={config.legal.termsPath} className="hover:underline">
            {t("common.terms")}
          </Link>
          <a href={`mailto:${config.contact.email}`} className="hover:underline">
            {t("common.contact")}
          </a>
        </nav>
        <p className="text-sm text-muted-foreground">
          {t("landing.footer.rights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
