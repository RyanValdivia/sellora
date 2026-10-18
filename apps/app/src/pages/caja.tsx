import { CheckCircle2, Gift, ScanLine, Stamp } from "lucide-react";
import { useState } from "react";
import { Button } from "@sellora/ui/components/button";
import { decodeCardQr } from "@sellora/shared/business/qr";
import { t } from "@sellora/shared/i18n";
import type { CardActionResponse, CardDto } from "@sellora/shared/api/contracts";
import { WebScanner } from "@/components/web-scanner";
import { TextField } from "@/components/fields";
import { HttpError } from "@/lib/api";
import { fetchCard, redeemCard, stampCard } from "@/lib/cards";
import { ScanCancelled, hasNativeScanner, scanNative } from "@/lib/scanner";

type View =
  | { name: "idle" }
  | { name: "camera" }
  | { name: "loading" }
  | { name: "card"; card: CardDto }
  | { name: "done"; result: CardActionResponse; kind: "stamp" | "redeem" };

function Progress({ card }: { card: CardDto }) {
  return (
    <ul className="flex flex-wrap justify-center gap-2" aria-hidden>
      {Array.from({ length: card.stampsRequired }, (_, i) => (
        <li
          key={i}
          className={
            i < card.stamps
              ? "size-7 rounded-full bg-primary"
              : "size-7 rounded-full border-2 border-muted-foreground/40"
          }
        />
      ))}
    </ul>
  );
}

/** Modo caja: escanear la tarjeta del cliente y sumar un sello o canjear el premio. */
export function CajaPage() {
  const [view, setView] = useState<View>({ name: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setError(null);
    setManual("");
    setView({ name: "idle" });
  };

  async function lookup(text: string) {
    setError(null);
    const serial = decodeCardQr(text);
    if (!serial) {
      setError(t("caja.notSellora"));
      setView({ name: "idle" });
      return;
    }
    setView({ name: "loading" });
    try {
      setView({ name: "card", card: await fetchCard(serial) });
    } catch (e) {
      setError(e instanceof HttpError && e.status === 404 ? t("caja.notFound") : (e as Error).message);
      setView({ name: "idle" });
    }
  }

  async function scan() {
    setError(null);
    if (!hasNativeScanner()) return setView({ name: "camera" });
    try {
      await lookup(await scanNative());
    } catch (e) {
      if (!(e instanceof ScanCancelled)) setError((e as Error).message);
    }
  }

  async function act(card: CardDto, kind: "stamp" | "redeem") {
    setBusy(true);
    setError(null);
    try {
      const result = await (kind === "stamp" ? stampCard(card.serial) : redeemCard(card.serial));
      navigator.vibrate?.(kind === "stamp" && result.completed ? [80, 60, 80] : 60);
      setView({ name: "done", result, kind });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">{t("caja.title")}</h1>

      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      {view.name === "idle" ? (
        <>
          <Button size="lg" className="h-20 rounded-3xl text-lg" onClick={() => void scan()}>
            <ScanLine className="size-6" /> {t("caja.scan")}
          </Button>
          <form
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(manual);
            }}
          >
            <h2 className="font-heading font-semibold">{t("caja.manualTitle")}</h2>
            <TextField
              id="manual"
              label={t("caja.manualLabel")}
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <Button type="submit" variant="outline" className="h-11" disabled={!manual.trim()}>
              {t("caja.manualButton")}
            </Button>
          </form>
        </>
      ) : null}

      {view.name === "camera" ? (
        <>
          <WebScanner
            onResult={(text) => void lookup(text)}
            onError={(message) => {
              setError(message);
              setView({ name: "idle" });
            }}
          />
          <Button variant="outline" className="h-11" onClick={reset}>
            {t("app.cancel")}
          </Button>
        </>
      ) : null}

      {view.name === "loading" ? <p role="status">{t("app.loading")}</p> : null}

      {view.name === "card" ? (
        <section className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card p-6 text-center">
          <div>
            <p className="text-sm text-muted-foreground">{t("caja.customer")}</p>
            <p className="font-heading text-xl font-bold">{view.card.holderName ?? t("caja.anonymous")}</p>
          </div>
          <Progress card={view.card} />
          <p className="text-3xl font-extrabold">
            {view.card.stamps}/{view.card.stampsRequired}
          </p>
          {view.card.rewardReady ? (
            <p className="flex items-center gap-2 font-medium text-ink-accent">
              <Gift className="size-5" aria-hidden /> {t("caja.rewardReady")}: {view.card.reward}
            </p>
          ) : null}
          {view.card.rewardReady ? (
            <Button
              size="lg"
              className="h-16 w-full rounded-2xl text-lg"
              disabled={busy}
              onClick={() => void act(view.card, "redeem")}
            >
              <Gift className="size-5" /> {t("caja.redeem")}
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-16 w-full rounded-2xl text-lg"
              disabled={busy}
              onClick={() => void act(view.card, "stamp")}
            >
              <Stamp className="size-5" /> {t("caja.stamp")}
            </Button>
          )}
          <Button variant="ghost" onClick={reset}>
            {t("app.cancel")}
          </Button>
        </section>
      ) : null}

      {view.name === "done" ? (
        <section
          role="status"
          className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-6 text-center"
        >
          <CheckCircle2 className="size-14 text-secondary" aria-hidden />
          <p className="font-heading text-2xl font-extrabold">
            {view.kind === "redeem"
              ? t("caja.redeemOk")
              : view.result.completed
                ? t("caja.completed")
                : t("caja.stampOk")}
          </p>
          <Progress card={view.result.card} />
          <p className="text-3xl font-extrabold">
            {view.result.card.stamps}/{view.result.card.stampsRequired}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("caja.sentToCustomer")} <span className="text-foreground">“{view.result.message}”</span>
          </p>
          <Button size="lg" className="h-14 w-full rounded-2xl" onClick={reset}>
            <ScanLine /> {t("caja.next")}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
