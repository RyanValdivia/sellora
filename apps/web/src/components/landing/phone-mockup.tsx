import { Logo } from "@sellora/ui/brand/logo";
import { t } from "@sellora/shared/i18n";
import { cn } from "@sellora/ui/utils";

const TOTAL = 6;
const FILLED = 5;

/** Celular dibujado en CSS: pantalla de bloqueo con un aviso de proximidad y la tarjeta. */
export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label={t("landing.hero.mockup.ariaLabel")}
      className={cn("relative mx-auto w-[18.5rem] animate-float sm:w-[20rem]", className)}
    >
      <div className="relative rounded-[3rem] bg-brand-plum p-3 shadow-pop ring-1 ring-white/10">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-[#3b2160] via-[#5a2f6b] to-[#c4553b]">
          <div className="absolute top-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

          <div className="pt-14 text-center text-white">
            <p className="text-sm font-medium opacity-80">{t("landing.hero.mockup.date")}</p>
            <p className="font-heading text-6xl font-semibold tracking-tight">
              {t("landing.hero.mockup.time")}
            </p>
          </div>

          <div className="mx-3 mt-6 animate-notif rounded-3xl bg-white/85 p-3 text-brand-plum shadow-soft backdrop-blur">
            <div className="flex items-center gap-2">
              <Logo variant="icon" decorative className="size-5" />
              <span className="text-xs font-semibold">{t("landing.hero.mockup.business")}</span>
              <span className="ml-auto text-[10px] opacity-60">{t("landing.hero.mockup.now")}</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug">{t("landing.hero.mockup.notification")}</p>
          </div>

          <div className="absolute inset-x-3 bottom-4 rounded-3xl bg-brand-cream p-4 text-brand-plum shadow-pop">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold">{t("landing.hero.mockup.business")}</span>
              <span className="text-[10px] font-medium tracking-wide uppercase opacity-60">
                {t("landing.hero.mockup.cardLabel")}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {Array.from({ length: TOTAL }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "grid aspect-square place-items-center rounded-full border-2 border-dashed border-brand-plum/30 text-xs",
                    i < FILLED &&
                      "animate-stamp border-solid border-brand-tangerine bg-brand-tangerine text-brand-plum",
                  )}
                  style={i < FILLED ? { animationDelay: `${0.9 + i * 0.12}s` } : undefined}
                >
                  {i < FILLED ? "★" : ""}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-end justify-between text-xs">
              <span className="font-semibold">{t("landing.hero.mockup.cardProgress")}</span>
              <span className="opacity-70">🥐 {t("landing.hero.mockup.cardReward")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
