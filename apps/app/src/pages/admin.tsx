import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LogOut } from "lucide-react";
import { Navigate } from "react-router";
import { toast } from "sonner";
import { Logo } from "@sellora/ui/brand/logo";
import { Button } from "@sellora/ui/components/button";
import { Label } from "@sellora/ui/components/label";
import { Switch } from "@sellora/ui/components/switch";
import type { AdminBusinessDto, AdminStats, PlatformSettings } from "@sellora/shared/api/contracts";
import { t } from "@sellora/shared/i18n";
import { API_URL, PUBLIC_URL, api, json } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/app-shell";

/** Panel de la plataforma: solo para el superadmin. */
export function AdminPage() {
  const { state, signOut } = useAuth();
  const qc = useQueryClient();
  const enabled = state.status === "authenticated" && state.user.role === "superadmin";

  const stats = useQuery({
    queryKey: ["admin", "stats"],
    enabled,
    queryFn: () => api<AdminStats>("/api/admin/stats"),
  });
  const settings = useQuery({
    queryKey: ["admin", "settings"],
    enabled,
    queryFn: () => api<{ settings: PlatformSettings }>("/api/admin/settings").then((r) => r.settings),
  });
  const businesses = useQuery({
    queryKey: ["admin", "businesses"],
    enabled,
    queryFn: () => api<{ businesses: AdminBusinessDto[] }>("/api/admin/businesses").then((r) => r.businesses),
  });

  const patch = useMutation({
    mutationFn: ({ id, ...body }: { id: string; active?: boolean; plan?: "free" | "pro" }) =>
      api(`/api/admin/businesses/${id}`, { method: "PATCH", ...json(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e) => toast.error(e.message),
  });
  const saveSettings = useMutation({
    mutationFn: (value: PlatformSettings) => api("/api/admin/settings", { method: "PUT", ...json(value) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
    onError: (e) => toast.error(e.message),
  });

  if (state.status === "loading") return <Loading />;
  if (state.status === "anonymous") return <Navigate to="/entrar" replace />;
  if (state.user.role !== "superadmin") return <Navigate to="/" replace />;

  const cards: [string, number | undefined][] = [
    [t("admin.stats.businesses"), stats.data?.businesses],
    [t("admin.stats.active"), stats.data?.activeBusinesses],
    [t("admin.stats.passes"), stats.data?.passes],
    [t("admin.stats.stamps"), stats.data?.stamps],
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo variant="icon" className="h-8" decorative />
          <h1 className="font-heading text-xl font-extrabold">{t("admin.title")}</h1>
        </div>
        <Button variant="ghost" size="icon" aria-label={t("admin.logout")} onClick={() => void signOut()}>
          <LogOut className="size-5" />
        </Button>
      </header>

      <section aria-label="Resumen" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-heading text-3xl font-extrabold tabular-nums">{value ?? "–"}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading text-lg font-semibold">{t("admin.settingsTitle")}</h2>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="signups">{t("admin.signupsOpen")}</Label>
          <Switch
            id="signups"
            checked={settings.data?.signupsOpen ?? true}
            disabled={settings.isPending || saveSettings.isPending}
            onCheckedChange={(open) => saveSettings.mutate({ signupsOpen: open })}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">{t("admin.businessesTitle")}</h2>
        {businesses.isPending ? <p role="status">{t("app.loading")}</p> : null}
        <ul className="flex flex-col gap-3">
          {businesses.data?.map((b) => (
            <li key={b.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.passes", { n: b.passes })} · {t("admin.staff", { n: b.staff })}
                  </p>
                </div>
                <a
                  href={`${PUBLIC_URL || API_URL}/b/${b.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${t("admin.open")}: ${b.name}`}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2" role="group" aria-label={t("admin.plan")}>
                  {(["free", "pro"] as const).map((plan) => (
                    <Button
                      key={plan}
                      size="sm"
                      variant={b.plan === plan ? "default" : "outline"}
                      className="rounded-full"
                      aria-pressed={b.plan === plan}
                      onClick={() => b.plan !== plan && patch.mutate({ id: b.id, plan })}
                    >
                      {t(plan === "free" ? "admin.free" : "admin.pro")}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{b.active ? t("admin.active") : t("admin.inactive")}</span>
                  <Switch
                    aria-label={t("admin.toggleActive", { name: b.name })}
                    checked={b.active}
                    onCheckedChange={(active) => patch.mutate({ id: b.id, active })}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
