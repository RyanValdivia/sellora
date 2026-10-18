/**
 * Geometría del sello de Sellora. Es pura (sin React) para que la usen
 * tanto el componente <Logo /> como el script que genera los SVG estáticos.
 * Lienzo: 100 x 100, centro en (50, 50).
 */

const CENTER = 50;
const OUTER_RADIUS = 44;
const SCALLOPS = 14;

const round = (n: number) => Math.round(n * 100) / 100;

/** Borde festoneado: un arco que sobresale entre cada par de puntos del círculo. */
export function scallopPath(): string {
  const chord = 2 * OUTER_RADIUS * Math.sin(Math.PI / SCALLOPS);
  const arcRadius = round(chord * 0.58);
  const point = (k: number) => {
    const angle = (k * 2 * Math.PI) / SCALLOPS - Math.PI / 2;
    return [
      round(CENTER + OUTER_RADIUS * Math.cos(angle)),
      round(CENTER + OUTER_RADIUS * Math.sin(angle)),
    ] as const;
  };

  const [startX, startY] = point(0);
  let d = `M${startX} ${startY}`;
  for (let k = 1; k <= SCALLOPS; k++) {
    const [x, y] = point(k % SCALLOPS);
    d += `A${arcRadius} ${arcRadius} 0 0 1 ${x} ${y}`;
  }
  return `${d}Z`;
}

/** Pin de ubicación (gota) centrado en el sello. */
export const PIN_PATH = "M50 69C50 69 34.5 55.5 34.5 44.5a15.5 15.5 0 0 1 31 0C65.5 55.5 50 69 50 69Z";

/** Agujero interior del pin. */
export const PIN_DOT = { cx: 50, cy: 44.5, r: 5.6 } as const;

/** Anillo punteado interior, como el troquelado de un sello. */
export const INNER_RING = { cx: 50, cy: 50, r: 36.5 } as const;
