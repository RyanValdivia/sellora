import { useId } from "react";
import config from "@config";
import { WORDMARK } from "@/lib/brand/wordmark.generated";
import { INNER_RING, PIN_DOT, PIN_PATH, scallopPath } from "@/lib/brand/stamp-geometry";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon" | "mono-light" | "mono-dark";

const SCALE = 0.62;
const GAP = 14;

/** Colores por variante. “currentColor” permite heredar el color del texto. */
function paletteFor(variant: LogoVariant) {
  const { tangerine, plum, cream } = config.palette;
  switch (variant) {
    case "mono-light":
      return { body: cream, ring: plum, text: cream };
    case "mono-dark":
      return { body: plum, ring: cream, text: plum };
    default:
      return { body: tangerine, ring: cream, text: "var(--foreground)" };
  }
}

type LogoProps = {
  variant?: LogoVariant;
  className?: string;
  /** Si es decorativo (hay texto al lado) se oculta a lectores de pantalla. */
  decorative?: boolean;
};

export function Logo({ variant = "full", className, decorative = false }: LogoProps) {
  const id = useId().replace(/:/g, "");
  const { body, ring, text } = paletteFor(variant);
  const showWord = variant !== "icon";
  const wordWidth = WORDMARK.width * SCALE;
  const wordY = (100 - WORDMARK.height * SCALE) / 2;
  const width = showWord ? 100 + GAP + wordWidth : 100;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${Math.ceil(width)} 100`}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : config.brand.name}
      aria-hidden={decorative || undefined}
      className={cn("h-8 w-auto", className)}
    >
      <defs>
        <mask id={id}>
          <rect width="100" height="100" fill="#fff" />
          <path d={PIN_PATH} fill="#000" />
          <circle cx={PIN_DOT.cx} cy={PIN_DOT.cy} r={PIN_DOT.r} fill="#fff" />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        <path d={scallopPath()} fill={body} />
        <circle
          cx={INNER_RING.cx}
          cy={INNER_RING.cy}
          r={INNER_RING.r}
          fill="none"
          stroke={ring}
          strokeWidth="1.6"
          strokeDasharray="1.2 3.4"
          strokeLinecap="round"
        />
      </g>
      {showWord && (
        <g transform={`translate(${100 + GAP} ${wordY.toFixed(2)}) scale(${SCALE})`}>
          <path transform={`translate(${WORDMARK.shift.x} ${WORDMARK.shift.y})`} d={WORDMARK.d} fill={text} />
        </g>
      )}
    </svg>
  );
}
