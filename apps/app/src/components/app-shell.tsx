import {
  Home,
  LogOut,
  MapPin,
  MessageSquareText,
  QrCode,
  ScanLine,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Navigate, Outlet } from "react-router";
import { Logo } from "@sellora/ui/brand/logo";
import { Button } from "@sellora/ui/components/button";
import { cn } from "@sellora/ui/utils";
import { t, type DictionaryKey } from "@sellora/shared/i18n";
import { useAuth } from "@/lib/auth";
import { useActiveBusiness } from "@/lib/business";
import { Onboarding } from "@/pages/onboarding";

const TABS: { to: string; key: DictionaryKey; icon: LucideIcon; ownerOnly?: boolean }[] = [
  { to: "/", key: "app.nav.home", icon: Home },
  { to: "/tarjeta", key: "app.nav.card", icon: WalletCards, ownerOnly: true },
  { to: "/mensajes", key: "app.nav.messages", icon: MessageSquareText, ownerOnly: true },
  { to: "/locales", key: "app.nav.locations", icon: MapPin, ownerOnly: true },
  { to: "/compartir", key: "app.nav.share", icon: QrCode, ownerOnly: true },
  { to: "/caja", key: "app.nav.caja", icon: ScanLine },
];

export function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center text-muted-foreground" role="status">
      {t("app.loading")}
    </div>
  );
}

/** Marco de la app con sesión: barra superior y navegación inferior. */
export function AppShell() {
  const { state, signOut } = useAuth();
  const { business, isPending, isError, refetch } = useActiveBusiness();

  if (state.status === "loading") return <Loading />;
  if (state.status === "anonymous") return <Navigate to="/entrar" replace />;
  if (isPending) return <Loading />;
  if (isError) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <Button onClick={() => void refetch()}>{t("app.retry")}</Button>
      </div>
    );
  }
  if (!business) return state.user.role === "superadmin" ? <Navigate to="/admin" replace /> : <Onboarding />;

  const isOwner = business.role === "owner";
  const tabs = TABS.filter((tab) => isOwner || !tab.ownerOnly);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Logo variant="icon" className="h-8" decorative />
          <span className="truncate font-heading font-semibold">{business.name}</span>
        </div>
        <Button variant="ghost" size="icon" aria-label={t("app.auth.logout")} onClick={() => void signOut()}>
          <LogOut className="size-5" />
        </Button>
      </header>

      <main id="main" className="flex-1 px-4 pt-5 pb-28">
        <Outlet context={{ business }} />
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-3xl justify-around px-1">
          {tabs.map(({ to, key, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium",
                    isActive ? "text-ink-accent" : "text-muted-foreground",
                  )
                }
              >
                <Icon className="size-5" aria-hidden />
                {t(key)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
