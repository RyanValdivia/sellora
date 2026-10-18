import { Rich } from "@/components/brand/rich";
import { t, tr } from "@sellora/shared/i18n";
import { cn } from "@sellora/ui/utils";
import { Reveal } from "./reveal";

const tilts = ["-rotate-2", "rotate-1", "-rotate-1"];
const tints = ["bg-brand-butter", "bg-brand-teal", "bg-brand-tangerine"];

export function HowItWorks() {
  const steps = tr<{ title: string; body: string }[]>("landing.how.steps");
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <Reveal>
        <p className="text-sm font-semibold tracking-widest text-ink-accent uppercase">
          {t("landing.how.eyebrow")}
        </p>
        <h2 className="mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">
          <Rich text={t("landing.how.title")} />
        </h2>
      </Reveal>

      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * 0.1} className="h-full">
              <div
                className={cn(
                  "h-full rounded-[2rem] border border-border bg-card p-7 shadow-soft transition-transform hover:rotate-0",
                  tilts[i],
                )}
              >
                <span
                  className={cn(
                    "grid size-14 place-items-center rounded-full font-heading text-2xl font-extrabold text-brand-plum",
                    tints[i],
                  )}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 text-2xl font-bold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
