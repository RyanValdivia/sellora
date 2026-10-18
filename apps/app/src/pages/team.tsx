import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Share2, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useOutletContext } from "react-router";
import { toast } from "sonner";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { Button } from "@sellora/ui/components/button";
import type { BusinessSummary, TeamResponse } from "@sellora/shared/api/contracts";
import { t } from "@sellora/shared/i18n";
import { api } from "@/lib/api";

export function TeamPage() {
  const { business } = useOutletContext<{ business: BusinessSummary }>();
  const qc = useQueryClient();
  const [link, setLink] = useState<string | null>(null);

  const team = useQuery({
    queryKey: ["team", business.id],
    enabled: business.role === "owner",
    queryFn: () => api<TeamResponse>(`/api/business/${business.id}/team`),
  });
  const invite = useMutation({
    mutationFn: () => api<{ link: string }>(`/api/business/${business.id}/invitations`, { method: "POST" }),
    onSuccess: (r) => {
      setLink(r.link);
      void qc.invalidateQueries({ queryKey: ["team", business.id] });
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (userId: string) =>
      api<void>(`/api/business/${business.id}/team/${userId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team", business.id] }),
    onError: (e) => toast.error(e.message),
  });

  if (business.role !== "owner") return <p>{t("app.ownerOnly")}</p>;

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t("app.team.copied"));
    } catch {
      toast.error(link);
    }
  }

  const staff = team.data?.members.filter((m) => m.role === "staff").length ?? 0;
  const pending = team.data?.invitations.length ?? 0;
  const full = team.data ? staff + pending >= team.data.maxStaff : false;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t("app.team.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("app.team.intro")}</p>
      </div>

      {team.isPending ? <p role="status">{t("app.loading")}</p> : null}

      <section aria-label={t("app.team.members")} className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-semibold">{t("app.team.members")}</h2>
        <ul className="flex flex-col gap-2">
          {team.data?.members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {m.email} · {m.role === "owner" ? t("app.team.owner") : t("app.team.staff")}
                </p>
              </div>
              {m.role === "staff" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("app.team.remove", { name: m.name })}
                  onClick={() => remove.mutate(m.userId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {pending > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold">{t("app.team.pending")}</h2>
          <ul className="flex flex-col gap-2">
            {team.data?.invitations.map((i) => (
              <li
                key={i.id}
                className="rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground"
              >
                {t("app.team.expires", { date: new Date(i.expiresAt).toLocaleDateString("es-PE") })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {full ? (
        <p className="rounded-xl bg-muted p-3 text-sm">
          {t("app.team.limit", { max: team.data?.maxStaff ?? 0 })}
        </p>
      ) : (
        <Button size="lg" className="h-12" disabled={invite.isPending} onClick={() => invite.mutate()}>
          <UserPlus /> {t("app.team.invite")}
        </Button>
      )}

      {link ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4" role="status">
          <p className="font-medium">{t("app.team.linkReady")}</p>
          <code className="rounded-xl bg-muted px-3 py-2 text-sm break-all">{link}</code>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11" onClick={() => void copy()}>
              <Copy /> {t("app.team.copy")}
            </Button>
            {Capacitor.isNativePlatform() || "share" in navigator ? (
              <Button
                variant="outline"
                className="h-11"
                onClick={() =>
                  void (Capacitor.isNativePlatform()
                    ? Share.share({ url: link, dialogTitle: t("app.team.share") })
                    : navigator.share({ url: link }))
                }
              >
                <Share2 /> {t("app.team.share")}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
