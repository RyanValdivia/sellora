import Link from "next/link";
import { CheckIcon, MapPinIcon } from "lucide-react";
import config from "@sellora/shared/config";
import { Rich } from "@/components/brand/rich";
import { t, tr } from "@sellora/shared/i18n";
import { Reveal } from "./reveal";

export function PrivacySection() {
  const points = tr<string[]>("landing.privacy.points");
  return (
    <section id="privacidad" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="grid items-center gap-10 rounded-[2.5rem] bg-brand-plum p-8 text-brand-cream shadow-pop sm:p-14 md:grid-cols-[1fr_auto]">
        <Reveal>
          <p className="text-sm font-semibold tracking-widest text-brand-butter uppercase">
            {t("landing.privacy.eyebrow")}
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-bold sm:text-5xl [&_em]:text-brand-butter">
            <Rich text={t("landing.privacy.title")} />
          </h2>
          <p className="mt-5 max-w-2xl text-lg opacity-85">{t("landing.privacy.body")}</p>
          <ul className="mt-6 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-teal text-brand-plum">
                  <CheckIcon className="size-4" strokeWidth={3} />
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <Link
            href={config.legal.privacyPath}
            className="mt-8 inline-block rounded-full border border-brand-cream/40 px-5 py-2.5 font-medium transition-colors hover:bg-brand-cream hover:text-brand-plum"
          >
            {t("landing.privacy.cta")}
          </Link>
        </Reveal>

        <div aria-hidden className="mx-auto hidden md:block">
          <div className="grid size-56 place-items-center rounded-full border-2 border-dashed border-brand-cream/30">
            <div className="grid size-36 place-items-center rounded-full bg-brand-tangerine text-brand-plum">
              <MapPinIcon className="size-16" strokeWidth={2.2} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
