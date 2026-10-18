import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import config from "@sellora/shared/config";
import { INNER_RING, PIN_DOT, PIN_PATH, scallopPath } from "@sellora/shared/brand/stamp-geometry";
import { WORDMARK } from "@sellora/shared/brand/wordmark.generated";

export const alt = `${config.brand.name} — ${config.brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(file: string) {
  const full = path.join(process.cwd(), "node_modules/@fontsource/bricolage-grotesque/files", file);
  return readFile(full);
}

export default async function OpengraphImage() {
  const { cream, plum, tangerine, butter, teal } = config.palette;
  const heading = await loadFont("bricolage-grotesque-latin-800-normal.woff");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: cream,
        padding: "72px 88px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: butter,
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -160,
          left: -100,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: teal,
          opacity: 0.3,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 28, zIndex: 1 }}>
        <svg
          width={WORDMARK.width * 1.5}
          height={WORDMARK.height * 1.5}
          viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
        >
          <path transform={`translate(${WORDMARK.shift.x} ${WORDMARK.shift.y})`} d={WORDMARK.d} fill={plum} />
        </svg>
        <div
          style={{
            fontFamily: "Bricolage",
            fontSize: 62,
            lineHeight: 1.05,
            color: plum,
            maxWidth: 640,
            fontWeight: 800,
          }}
        >
          {config.brand.tagline}
        </div>
      </div>

      <svg width="360" height="360" viewBox="0 0 100 100" style={{ zIndex: 1 }}>
        <path d={scallopPath()} fill={tangerine} />
        <circle
          cx={INNER_RING.cx}
          cy={INNER_RING.cy}
          r={INNER_RING.r}
          fill="none"
          stroke={cream}
          strokeWidth="1.6"
          strokeDasharray="1.2 3.4"
          strokeLinecap="round"
        />
        <path d={PIN_PATH} fill={cream} />
        <circle cx={PIN_DOT.cx} cy={PIN_DOT.cy} r={PIN_DOT.r} fill={tangerine} />
      </svg>
    </div>,
    { ...size, fonts: [{ name: "Bricolage", data: heading, weight: 800, style: "normal" }] },
  );
}
