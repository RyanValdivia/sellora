import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Rich } from "@sellora/ui/brand/rich";
import { buttonVariants } from "@sellora/ui/components/button";
import { t } from "@sellora/shared/i18n";
import { cn } from "@sellora/ui/utils";
import { PhoneMockup } from "./phone-mockup";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-24 -right-24 -z-10 size-96 rounded-full bg-brand-butter/50 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-24 -z-10 size-96 rounded-full bg-brand-teal/25 blur-3xl"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm font-medium shadow-soft">
            <span aria-hidden className="size-2 rounded-full bg-brand-teal" />
            {t("landing.hero.eyebrow")}
          </p>
          <h1 className="mt-6 text-5xl leading-[1.02] font-extrabold sm:text-6xl lg:text-7xl">
            <Rich text={t("landing.hero.title")} />
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t("landing.hero.subtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/registro"
              className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-6 text-base")}
            >
              {t("common.createCard")}
              <ArrowRightIcon className="size-4" />
            </Link>
            <a
              href="#como-funciona"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full px-6 text-base",
              )}
            >
              {t("common.howItWorks")}
            </a>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">{t("landing.hero.note")}</p>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}
