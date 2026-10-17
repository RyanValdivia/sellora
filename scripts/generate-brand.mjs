/**
 * Genera los SVG de marca (public/brand) y el trazado del wordmark.
 * Uso: pnpm brand:build
 * Para cambiar colores o geometría edita sellora.config.ts / stamp-geometry.ts y vuelve a ejecutarlo.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import opentype from "opentype.js";
import { PIN_DOT, PIN_PATH, INNER_RING, scallopPath } from "../src/lib/brand/stamp-geometry.ts";
import config from "../sellora.config.ts";

const require = createRequire(import.meta.url);
const fontFile =
  require.resolve("@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff");
const buf = readFileSync(fontFile);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const WORD = config.brand.wordmark;
const FONT_SIZE = 64;
const scale0 = FONT_SIZE / font.unitsPerEm;
const path = new opentype.Path();
let penX = 0;
for (const ch of WORD) {
  const glyph = font.charToGlyph(ch);
  path.extend(glyph.getPath(penX, 0, FONT_SIZE));
  penX += glyph.advanceWidth * scale0 - FONT_SIZE * 0.02;
}
const box = path.getBoundingBox();
const wordD = path.toPathData(2);
const wordW = Math.ceil(box.x2 - box.x1);
const wordH = Math.ceil(box.y2 - box.y1);
const wordShift = { x: -box.x1, y: -box.y1 };

const { tangerine, plum, cream } = config.palette;

function stamp({ body, ring, id }) {
  return `<defs><mask id="${id}"><rect width="100" height="100" fill="#fff"/><path d="${PIN_PATH}" fill="#000"/><circle cx="${PIN_DOT.cx}" cy="${PIN_DOT.cy}" r="${PIN_DOT.r}" fill="#fff"/></mask></defs>
<g mask="url(#${id})"><path d="${scallopPath()}" fill="${body}"/><circle cx="${INNER_RING.cx}" cy="${INNER_RING.cy}" r="${INNER_RING.r}" fill="none" stroke="${ring}" stroke-width="1.6" stroke-dasharray="1.2 3.4" stroke-linecap="round"/></g>`;
}

function icon(colors, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${config.brand.name}">${stamp({ ...colors, id })}</svg>`;
}

function full({ body, ring, text }, id) {
  const iconSize = 100;
  const gap = 14;
  const scale = 0.62;
  const wordHeight = wordH * scale;
  const wordY = (iconSize - wordHeight) / 2;
  const total = iconSize + gap + wordW * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(total)} ${iconSize}" role="img" aria-label="${config.brand.name}">${stamp({ body, ring, id })}<g transform="translate(${iconSize + gap} ${wordY.toFixed(2)}) scale(${scale})"><path transform="translate(${wordShift.x.toFixed(2)} ${wordShift.y.toFixed(2)})" d="${wordD}" fill="${text}"/></g></svg>`;
}

const variants = {
  "sellora-icon.svg": icon({ body: tangerine, ring: cream }, "m1"),
  "sellora-icon-mono-dark.svg": icon({ body: plum, ring: cream }, "m2"),
  "sellora-icon-mono-light.svg": icon({ body: cream, ring: plum }, "m3"),
  "sellora-full.svg": full({ body: tangerine, ring: cream, text: plum }, "m4"),
  "sellora-mono-dark.svg": full({ body: plum, ring: cream, text: plum }, "m5"),
  "sellora-mono-light.svg": full({ body: cream, ring: plum, text: cream }, "m6"),
};

mkdirSync("public/brand", { recursive: true });
for (const [name, svg] of Object.entries(variants)) writeFileSync(`public/brand/${name}`, svg + "\n");
writeFileSync("src/app/icon.svg", variants["sellora-icon.svg"] + "\n");

writeFileSync(
  "src/lib/brand/wordmark.generated.ts",
  `// Generado por scripts/generate-brand.mjs. No editar a mano.\nexport const WORDMARK = { d: ${JSON.stringify(wordD)}, width: ${wordW}, height: ${wordH}, shift: { x: ${wordShift.x.toFixed(2)}, y: ${wordShift.y.toFixed(2)} } } as const;\n`,
);
console.log("Marca generada:", Object.keys(variants).join(", "));
