import { Rich } from "@sellora/ui/brand/rich";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@sellora/ui/components/accordion";
import { t, tr } from "@sellora/shared/i18n";
import { Reveal } from "./reveal";

export function Faq() {
  const items = tr<{ q: string; a: string }[]>("landing.faq.items");
  return (
    <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
      <Reveal>
        <p className="text-sm font-semibold tracking-widest text-ink-accent uppercase">
          {t("landing.faq.eyebrow")}
        </p>
        <h2 className="mt-3 text-4xl font-bold sm:text-5xl">
          <Rich text={t("landing.faq.title")} />
        </h2>
      </Reveal>
      <Accordion className="mt-10 space-y-3">
        {items.map((item) => (
          <AccordionItem
            key={item.q}
            value={item.q}
            className="rounded-2xl border border-border bg-card px-5 shadow-soft"
          >
            <AccordionTrigger className="text-left text-lg font-semibold">{item.q}</AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
