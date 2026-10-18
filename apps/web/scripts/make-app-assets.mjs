import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const icon = readFileSync("public/brand/sellora-icon.svg", "utf8")
  .replace(/<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");
const wrap = (size, bg, scale) => {
  const inner = size * scale;
  const off = (size - inner) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ""}<svg x="${off}" y="${off}" width="${inner}" height="${inner}" viewBox="0 0 100 100">${icon}</svg></svg>`;
};
const png = (svg, w) => new Resvg(svg, { fitTo: { mode: "width", value: w } }).render().asPng();
const out = "../app/assets";
writeFileSync(`${out}/icon-only.png`, png(wrap(1024, "#FFF6EA", 0.78), 1024));
writeFileSync(`${out}/icon-foreground.png`, png(wrap(1024, null, 0.6), 1024));
writeFileSync(
  `${out}/icon-background.png`,
  png(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#FFF6EA"/></svg>`,
    1024,
  ),
);
writeFileSync(
  `${out}/splash.png`,
  png(
    `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732"><rect width="2732" height="2732" fill="#FFF6EA"/><svg x="1066" y="1066" width="600" height="600" viewBox="0 0 100 100">${icon}</svg></svg>`,
    2732,
  ),
);
writeFileSync(
  `${out}/splash-dark.png`,
  png(
    `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732"><rect width="2732" height="2732" fill="#1C0F2B"/><svg x="1066" y="1066" width="600" height="600" viewBox="0 0 100 100">${icon}</svg></svg>`,
    2732,
  ),
);
console.log("assets listos");

// ── Recursos de Android (sin depender de sharp) ─────────────────────────────
const res = "../app/android/app/src/main/res";
const densities = {
  mdpi: [48, 108],
  hdpi: [72, 162],
  xhdpi: [96, 216],
  xxhdpi: [144, 324],
  xxxhdpi: [192, 432],
};
const rounded = (size, shape) =>
  shape === "circle"
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#FFF6EA"/><svg x="${size * 0.14}" y="${size * 0.14}" width="${size * 0.72}" height="${size * 0.72}" viewBox="0 0 100 100">${icon}</svg></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#FFF6EA"/><svg x="${size * 0.11}" y="${size * 0.11}" width="${size * 0.78}" height="${size * 0.78}" viewBox="0 0 100 100">${icon}</svg></svg>`;
for (const [d, [legacy, adaptive]] of Object.entries(densities)) {
  writeFileSync(`${res}/mipmap-${d}/ic_launcher.png`, png(rounded(legacy, "square"), legacy));
  writeFileSync(`${res}/mipmap-${d}/ic_launcher_round.png`, png(rounded(legacy, "circle"), legacy));
  writeFileSync(`${res}/mipmap-${d}/ic_launcher_foreground.png`, png(wrap(adaptive, null, 0.6), adaptive));
}
writeFileSync(
  `${res}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFF6EA</color>\n</resources>\n`,
);

const splashSizes = {
  mdpi: [320, 480],
  hdpi: [480, 800],
  xhdpi: [720, 1280],
  xxhdpi: [960, 1600],
  xxxhdpi: [1280, 1920],
};
const splash = (w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#FFF6EA"/><svg x="${(w - Math.min(w, h) * 0.34) / 2}" y="${(h - Math.min(w, h) * 0.34) / 2}" width="${Math.min(w, h) * 0.34}" height="${Math.min(w, h) * 0.34}" viewBox="0 0 100 100">${icon}</svg></svg>`;
for (const [d, [w, h]] of Object.entries(splashSizes)) {
  writeFileSync(`${res}/drawable-port-${d}/splash.png`, png(splash(w, h), w));
  writeFileSync(`${res}/drawable-land-${d}/splash.png`, png(splash(h, w), h));
}
writeFileSync(`${res}/drawable/splash.png`, png(splash(480, 320), 480));
console.log("recursos de Android listos");
