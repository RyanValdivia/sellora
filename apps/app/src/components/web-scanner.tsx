import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";
import { t } from "@sellora/shared/i18n";

interface Props {
  onResult(text: string): void;
  onError(message: string): void;
}

/**
 * Escáner de QR en el navegador con la cámara trasera. Usa jsQR sobre cuadros del video: funciona en
 * cualquier navegador con getUserMedia, sin depender de BarcodeDetector.
 */
export function WebScanner({ onResult, onError }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    function tick() {
      const v = video.current;
      if (stopped || !v || !ctx) return;
      if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth > 0) {
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        ctx.drawImage(v, 0, 0);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          stopped = true;
          onResult(code.data);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then(async (s) => {
        if (stopped) return s.getTracks().forEach((track) => track.stop());
        stream = s;
        const v = video.current!;
        v.srcObject = s;
        await v.play();
        setReady(true);
        tick();
      })
      .catch(() => onError(t("caja.permission")));

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
    };
    // Los callbacks vienen de la pantalla padre y cambian en cada render; el escáner no debe reiniciarse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-black">
      <video
        ref={video}
        muted
        playsInline
        className="aspect-square w-full object-cover"
        aria-label={t("caja.scanning")}
      />
      <div
        className="pointer-events-none absolute inset-8 rounded-2xl border-4 border-primary/90"
        aria-hidden
      />
      <p className="absolute inset-x-0 bottom-3 text-center text-sm text-white drop-shadow" role="status">
        {ready ? t("caja.scanning") : t("app.loading")}
      </p>
    </div>
  );
}
