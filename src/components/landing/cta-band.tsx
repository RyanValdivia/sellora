import Link from "next/link";
import { Rich } from "@/components/brand/rich";
import { buttonVariants } from "@/components/ui/button";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <Reveal>
        <div className="rounded-[2.5rem] bg-brand-tangerine px-8 py-14 text-center text-brand-plum shadow-pop sm:px-16 [&_em]:text-brand-plum">
          <h2 className="mx-auto max-w-3xl text-4xl font-extrabold sm:text-5xl">
            <Rich text={t("landing.cta.title")} />
          </h2>
          <p className="mt-4 text-lg">{t("landing.cta.body")}</p>
          <Link
            href="/registro"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-8 h-12 rounded-full bg-brand-plum px-8 text-base text-brand-cream hover:bg-brand-plum/90",
            )}
          >
            {t("common.createCard")}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
