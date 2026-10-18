import { CheckCircle2, Circle, type LucideIcon, MapPin, QrCode, ScanLine, WalletCards } from "lucide-react";
import { Link, useOutletContext } from "react-router";
import type { BusinessSummary } from "@sellora/shared/api/contracts";
import { t, type DictionaryKey } from "@sellora/shared/i18n";
import { useAuth } from "@/lib/auth";
import { useLocations } from "@/lib/business";

interface Step {
  to: string;
  key: DictionaryKey;
  icon: LucideIcon;
  done: boolean;
  ownerOnly: boolean;
}

export function HomePage() {
  const { business } = useOutletContext<{ business: BusinessSummary }>();
  const { state } = useAuth();
  const locations = useLocations(business.role === "owner" ? business.id : undefined);
  const name = state.status === "authenticated" ? state.user.name.split(" ")[0] : "";

  const steps: Step[] = [
    { to: "/tarjeta", key: "app.home.steps.card", icon: WalletCards, done: true, ownerOnly: true },
    {
      to: "/locales",
      key: "app.home.steps.locations",
      icon: MapPin,
      done: (locations.data?.length ?? 0) > 0,
      ownerOnly: true,
    },
    { to: "/compartir", key: "app.home.steps.share", icon: QrCode, done: false, ownerOnly: true },
    { to: "/caja", key: "app.home.steps.caja", icon: ScanLine, done: false, ownerOnly: false },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t("app.home.greeting", { name })}</h1>
        <p className="mt-1 text-muted-foreground">{t("app.home.subtitle")}</p>
      </div>
      <ol className="flex flex-col gap-3">
        {steps
          .filter((s) => business.role === "owner" || !s.ownerOnly)
          .map(({ to, key, icon: Icon, done }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <Icon className="size-6 shrink-0 text-ink-accent" aria-hidden />
                <span className="flex-1 font-medium">{t(key)}</span>
                {done ? (
                  <CheckCircle2 className="size-5 text-secondary" aria-label={t("app.home.done")} />
                ) : (
                  <Circle className="size-5 text-muted-foreground" aria-label={t("app.home.todo")} />
                )}
              </Link>
            </li>
          ))}
      </ol>
    </div>
  );
}
