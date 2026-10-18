import { useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { useOutletContext } from "react-router";
import { toast } from "sonner";
import config from "@sellora/shared/config";
import { Button } from "@sellora/ui/components/button";
import { Input } from "@sellora/ui/components/input";
import { Label } from "@sellora/ui/components/label";
import type { BusinessSummary } from "@sellora/shared/api/contracts";
import { t } from "@sellora/shared/i18n";
import { LocationMap } from "@/components/location-map";
import { TextField } from "@/components/fields";
import { useAddLocation, useDeleteLocation, useLocations } from "@/lib/business";
import { searchAddress, type GeocodeResult } from "@/lib/nominatim";

interface Draft {
  address: string;
  lat: number;
  lng: number;
}

export function LocationsPage() {
  const { business } = useOutletContext<{ business: BusinessSummary }>();
  const locations = useLocations(business.id);
  const add = useAddLocation(business.id);
  const remove = useDeleteLocation(business.id);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [label, setLabel] = useState("");
  const [alertText, setAlertText] = useState("");

  if (business.role !== "owner") return <p>{t("app.ownerOnly")}</p>;
  const max = config.plans[business.plan].maxLocations;

  async function search() {
    if (query.trim().length < 3) return;
    setSearching(true);
    try {
      setResults(await searchAddress(query.trim()));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function save() {
    if (!draft) return;
    try {
      await add.mutateAsync({
        label: label.trim() || "Local",
        address: draft.address,
        lat: draft.lat,
        lng: draft.lng,
        alertText: alertText.trim() || null,
      });
      setDraft(null);
      setResults(null);
      setQuery("");
      setLabel("");
      setAlertText("");
      toast.success(t("app.saved"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const full = (locations.data?.length ?? 0) >= max;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t("app.locations.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("app.locations.intro")}</p>
      </div>

      {locations.isPending ? <p role="status">{t("app.loading")}</p> : null}
      {locations.data?.length === 0 ? (
        <p className="text-muted-foreground">{t("app.locations.empty")}</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {locations.data?.map((l) => (
          <li key={l.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <MapPin className="mt-0.5 size-5 shrink-0 text-ink-accent" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{l.label}</p>
              <p className="text-sm text-muted-foreground">{l.address}</p>
              {l.alertText ? <p className="mt-1 text-sm">“{l.alertText}”</p> : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${t("app.delete")} ${l.label}`}
              onClick={() => remove.mutate(l.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      {full ? (
        <p className="rounded-xl bg-muted p-3 text-sm">{t("app.locations.limit", { max })}</p>
      ) : (
        <section
          aria-label={t("app.locations.add")}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"
        >
          <h2 className="font-heading text-lg font-semibold">{t("app.locations.add")}</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address-search">{t("app.locations.search")}</Label>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void search();
              }}
            >
              <Input
                id="address-search"
                className="h-11"
                value={query}
                placeholder={t("app.locations.searchHint")}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" className="h-11" disabled={searching}>
                {t("app.locations.searchButton")}
              </Button>
            </form>
          </div>

          {results?.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("app.locations.noResults")}</p>
          ) : null}
          {results && results.length > 0 && !draft ? (
            <ul className="flex flex-col gap-2">
              {results.map((r) => (
                <li key={`${r.lat},${r.lng}`}>
                  <Button
                    variant="outline"
                    className="h-auto w-full justify-start py-2 text-left whitespace-normal"
                    onClick={() => setDraft({ address: r.label, lat: r.lat, lng: r.lng })}
                  >
                    {r.label}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          {draft ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm">{draft.address}</p>
              <LocationMap center={draft} onPick={(p) => setDraft({ ...draft, ...p })} />
              <p className="text-xs text-muted-foreground">{t("app.locations.pickOnMap")}</p>
              <TextField
                id="loc-label"
                label={t("app.locations.label")}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <TextField
                id="loc-alert"
                label={t("app.locations.alertText")}
                hint={t("app.locations.alertHint")}
                value={alertText}
                maxLength={160}
                onChange={(e) => setAlertText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button className="h-11 flex-1" onClick={() => void save()} disabled={add.isPending}>
                  {t("app.save")}
                </Button>
                <Button variant="outline" className="h-11" onClick={() => setDraft(null)}>
                  {t("app.cancel")}
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
