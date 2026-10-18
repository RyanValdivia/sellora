import { CtaBand } from "@/components/landing/cta-band";
import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Kinds } from "@/components/landing/kinds";
import { PrivacySection } from "@/components/landing/privacy";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { t } from "@sellora/shared/i18n";

export default function HomePage() {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("common.skipToContent")}
      </a>
      <SiteHeader />
      <main id="contenido">
        <Hero />
        <Kinds />
        <HowItWorks />
        <PrivacySection />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
