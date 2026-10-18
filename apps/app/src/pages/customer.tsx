import { ArrowLeft, Gift, LogOut, Plus, ScanLine } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Logo } from "@sellora/ui/brand/logo";
import { PassPreview } from "@sellora/ui/brand/pass-preview";
import { Button } from "@sellora/ui/components/button";
import { encodeCardQr } from "@sellora/shared/business/qr";
import { slugFromLink, type CustomerCardDto } from "@sellora/shared/api/contracts";
import { t } from "@sellora/shared/i18n";
import { Loading } from "@/components/app-shell";
import { TextField } from "@/components/fields";
import { WebScanner } from "@/components/web-scanner";
import { HttpError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAddCard, useMyCard, useMyCards, useRenameCard } from "@/lib/customer";
import { registerForPush } from "@/lib/push";
import { ScanCancelled, hasNativeScanner, scanNative } from "@/lib/scanner";

/** Marco de la parte del cliente: sin menú, solo sus tarjetas. */
export function CustomerShell() {
  const { state, signOut } = useAuth();
  const isCustomer = state.status === "authenticated" && state.user.role === "customer";
  useEffect(() => {
    if (isCustomer) void registerForPush();
  }, [isCustomer]);

  if (state.status === "loading") return <Loading />;
  if (state.status === "anonymous") return <Navigate to="/entrar" replace />;
  if (state.user.role !== "customer") return <Navigate to="/" replace />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <Link to="/c" aria-label={t("me.back")}>
          <Logo className="h-8" />
        </Link>
        <Button variant="ghost" size="icon" aria-label={t("me.logout")} onClick={() => void signOut()}>
          <LogOut className="size-5" />
        </Button>
      </header>
      <main id="main" className="flex-1 px-4 pt-2 pb-10">
        <Outlet />
      </main>
    </div>
  );
}

function toPreview(c: CustomerCardDto) {
  return {
    identity: c.identity,
    passDesign: c.passDesign,
    rules: { stampsRequired: c.card.stampsRequired, reward: c.card.reward },
  };
}

function AddCard() {
  const add = useAddCard();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [link, setLink] = useState("");

  async function submit(text: string) {
    setScanning(false);
    const slug = slugFromLink(text);
    if (!slug) return void toast.error(t("me.invalidLink"));
    try {
      const card = await add.mutateAsync(slug);
      toast.success(t("me.added"));
      void navigate(`/c/${card.card.serial}`);
    } catch (e) {
      toast.error(e instanceof HttpError && e.status === 404 ? t("me.notFound") : (e as Error).message);
    }
  }

  async function scan() {
    if (!hasNativeScanner()) return setScanning(true);
    try {
      await submit(await scanNative());
    } catch (e) {
      if (!(e instanceof ScanCancelled)) toast.error((e as Error).message);
    }
  }

  return (
    <section
      aria-label={t("me.add")}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"
    >
      <Button
        size="lg"
        className="h-14 rounded-2xl text-base"
        disabled={add.isPending}
        onClick={() => void scan()}
      >
        <ScanLine /> {t("me.scan")}
      </Button>
      {scanning ? (
        <WebScanner
          onResult={(text) => void submit(text)}
          onError={(message) => {
            setScanning(false);
            toast.error(message);
          }}
        />
      ) : null}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(link);
        }}
      >
        <div className="flex-1">
          <TextField
            id="link"
            label={t("me.linkLabel")}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
        <Button type="submit" variant="outline" className="h-11" disabled={!link.trim() || add.isPending}>
          {t("me.linkButton")}
        </Button>
      </form>
    </section>
  );
}

export function CustomerHome() {
  const cards = useMyCards();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">{t("me.title")}</h1>
      {cards.isPending ? <p role="status">{t("app.loading")}</p> : null}
      {cards.data?.length === 0 ? (
        <div>
          <p className="font-medium">{t("me.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("me.emptyHint")}</p>
        </div>
      ) : null}
      <ul className="flex flex-col gap-4">
        {cards.data?.map((c) => (
          <li key={c.card.serial}>
            <Link
              to={`/c/${c.card.serial}`}
              className="block rounded-3xl focus-visible:outline-2"
              aria-label={c.identity.name}
            >
              <PassPreview config={toPreview(c)} stamps={c.card.stamps} />
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Plus className="size-5" aria-hidden /> {t("me.add")}
      </h2>
      <AddCard />
      <p className="text-center text-xs text-muted-foreground">{t("me.privacy")}</p>
    </div>
  );
}

export function CustomerCard() {
  const { serial } = useParams();
  const card = useMyCard(serial);
  const rename = useRenameCard(serial ?? "");
  const [qr, setQr] = useState("");
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!serial) return;
    void QRCode.toDataURL(encodeCardQr(serial), {
      margin: 2,
      width: 720,
      color: { dark: "#2A1740", light: "#FFFFFF" },
    }).then(setQr);
  }, [serial]);

  if (card.isPending) return <p role="status">{t("app.loading")}</p>;
  if (!card.data) return <Navigate to="/c" replace />;
  const c = card.data;

  return (
    <div className="flex flex-col gap-5">
      <Link to="/c" className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" aria-hidden /> {t("me.back")}
      </Link>
      <PassPreview config={toPreview(c)} stamps={c.card.stamps} />
      {c.card.rewardReady ? (
        <p
          role="status"
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary/10 p-3 font-medium text-ink-accent"
        >
          <Gift className="size-5" aria-hidden /> {t("me.rewardReady")}
        </p>
      ) : null}
      <div className="mx-auto w-full max-w-xs rounded-3xl bg-white p-4 shadow-soft">
        {qr ? (
          <img src={qr} alt={t("me.qrAlt", { business: c.identity.name })} className="w-full" />
        ) : (
          <div className="aspect-square" />
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">{t("me.show")}</p>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void rename
            .mutateAsync(name ?? c.card.holderName ?? "")
            .then(() => toast.success(t("me.nameSaved")));
        }}
      >
        <div className="flex-1">
          <TextField
            id="holder"
            label={t("me.nameLabel")}
            hint={t("me.nameHint")}
            value={name ?? c.card.holderName ?? ""}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" className="mb-7 h-11" disabled={rename.isPending}>
          {t("app.save")}
        </Button>
      </form>
    </div>
  );
}
