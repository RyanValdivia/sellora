import { readFileSync } from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import type { BusinessConfig } from "@sellora/shared/business/config";

export function svgToPng(svg: string, width: number): Buffer {
  return new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
}

let brandIcon: string | undefined;
function brandIconSvg(): string {
  brandIcon ??= readFileSync(path.join(process.cwd(), "public", "brand", "sellora-icon.svg"), "utf8");
  return brandIcon;
}

/** Imágenes fijas que Apple exige: icon (notificaciones y bloqueo) y logo (cabecera del pase). */
export function staticImages(): Record<string, Buffer> {
  const svg = brandIconSvg();
  return {
    "icon.png": svgToPng(svg, 29),
    "icon@2x.png": svgToPng(svg, 58),
    "icon@3x.png": svgToPng(svg, 87),
    "logo.png": svgToPng(svg, 50),
    "logo@2x.png": svgToPng(svg, 100),
    "logo@3x.png": svgToPng(svg, 150),
  };
}

const STRIP = { w: 375, h: 98 };

/** Distribución de los círculos del strip: una fila hasta 6 sellos, dos hasta 12 y tres hasta 20. */
export function stripLayout(total: number): { rows: number; cols: number } {
  const rows = total <= 6 ? 1 : total <= 12 ? 2 : 3;
  return { rows, cols: Math.ceil(total / rows) };
}

/** SVG del strip con los sellos llenos y vacíos, en los colores del negocio. */
export function stripSvg(design: BusinessConfig["passDesign"], total: number, filled: number): string {
  const { rows, cols } = stripLayout(total);
  const cellW = STRIP.w / cols;
  const cellH = STRIP.h / rows;
  const r = Math.min(cellW, cellH) * 0.36;
  const stroke = Math.max(r * 0.12, 1.2);
  const parts: string[] = [];

  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / cols);
    // La última fila se centra si queda incompleta.
    const inRow = row === rows - 1 ? total - row * cols : cols;
    const col = i - row * cols;
    const cx = (STRIP.w - inRow * cellW) / 2 + cellW * (col + 0.5);
    const cy = cellH * (row + 0.5);
    const on = i < filled;
    parts.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${on ? design.labelColor : "none"}" stroke="${design.labelColor}" stroke-width="${stroke.toFixed(1)}" opacity="${on ? 1 : 0.55}"/>`,
    );
    if (on) {
      const k = r * 0.5;
      parts.push(
        `<path d="M${(cx - k).toFixed(1)} ${cy.toFixed(1)}l${(k * 0.7).toFixed(1)} ${(k * 0.75).toFixed(1)}l${(k * 1.3).toFixed(1)} ${(-k * 1.4).toFixed(1)}" fill="none" stroke="${design.backgroundColor}" stroke-width="${(stroke * 1.4).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${STRIP.w} ${STRIP.h}" width="${STRIP.w}" height="${STRIP.h}"><rect width="${STRIP.w}" height="${STRIP.h}" fill="${design.backgroundColor}"/>${parts.join("")}</svg>`;
}

export function stripImages(design: BusinessConfig["passDesign"], total: number, filled: number) {
  const svg = stripSvg(design, total, filled);
  return {
    "strip.png": svgToPng(svg, 375),
    "strip@2x.png": svgToPng(svg, 750),
    "strip@3x.png": svgToPng(svg, 1125),
  };
}
