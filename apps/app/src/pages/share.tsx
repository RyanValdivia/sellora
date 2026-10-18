import { useEffect, useState } from "react";
import { Copy, Download, FileText, Nfc } from "lucide-react";
import QRCode from "qrcode";
import { useOutletContext } from "react-router";
import { toast } from "sonner";
import { Button } from "@sellora/ui/components/button";
import type { BusinessSummary } from "@sellora/shared/api/contracts";
import { t } from "@sellora/shared/i18n";
import { PUBLIC_URL } from "@/lib/api";
import { saveFile } from "@/lib/save-file";

const QR_OPTIONS = {
  margin: 2,
  errorCorrectionLevel: "M" as const,
  color: { dark: "#2A1740", light: "#FFFFFF" },
};

export function SharePage() {
  const { business } = useOutletContext<{ business: BusinessSummary }>();
  const link = `${PUBLIC_URL}/b/${business.slug}`;
  const [png, setPng] = useState<string>("");

  useEffect(() => {
    void QRCode.toDataURL(link, { ...QR_OPTIONS, width: 1024 }).then(setPng);
  }, [link]);

  async function downloadPng() {
    const blob = await (await fetch(await QRCode.toDataURL(link, { ...QR_OPTIONS, width: 2048 }))).blob();
    await saveFile(`qr-${business.slug}.png`, blob);
  }

  async function downloadSvg() {
    const svg = await QRCode.toString(link, { ...QR_OPTIONS, type: "svg" });
    await saveFile(`qr-${business.slug}.svg`, new Blob([svg], { type: "image/svg+xml" }));
  }

  /** Cartel A5 listo para imprimir. jsPDF se carga solo cuando se pide. */
  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(255, 246, 234);
    doc.rect(0, 0, w, doc.internal.pageSize.getHeight(), "F");
    doc.setTextColor(42, 23, 64);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text(business.name, w / 2, 30, { align: "center", maxWidth: w - 20 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(15);
    doc.text(t("app.share.poster"), w / 2, 44, { align: "center" });
    const qr = await QRCode.toDataURL(link, { ...QR_OPTIONS, width: 1024 });
    doc.addImage(qr, "PNG", (w - 90) / 2, 55, 90, 90);
    doc.setFontSize(10);
    doc.text(link, w / 2, 155, { align: "center", maxWidth: w - 20 });
    await saveFile(`cartel-${business.slug}.pdf`, doc.output("blob"));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t("app.share.copied"));
    } catch {
      toast.error(link);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t("app.share.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("app.share.intro")}</p>
      </div>

      <div className="mx-auto w-full max-w-xs rounded-3xl bg-white p-4 shadow-soft">
        {png ? (
          <img src={png} alt={`QR de ${business.name}`} className="w-full" />
        ) : (
          <div className="aspect-square" />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("app.share.link")}</span>
        <code className="rounded-xl bg-muted px-3 py-2 text-sm break-all">{link}</code>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" className="h-11" onClick={() => void copy()}>
          <Copy /> {t("app.share.copy")}
        </Button>
        <Button variant="outline" className="h-11" onClick={() => void downloadPng()}>
          <Download /> {t("app.share.downloadPng")}
        </Button>
        <Button variant="outline" className="h-11" onClick={() => void downloadSvg()}>
          <Download /> {t("app.share.downloadSvg")}
        </Button>
        <Button className="h-11" onClick={() => void downloadPdf()}>
          <FileText /> {t("app.share.downloadPdf")}
        </Button>
      </div>

      <aside className="flex gap-3 rounded-2xl border border-border bg-card p-4">
        <Nfc className="mt-0.5 size-5 shrink-0 text-ink-accent" aria-hidden />
        <div>
          <h2 className="font-heading font-semibold">{t("app.share.nfcTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("app.share.nfcBody")}</p>
        </div>
      </aside>
    </div>
  );
}
