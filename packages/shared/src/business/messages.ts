/** Variables disponibles en los mensajes del negocio. */
export const MESSAGE_VARIABLES = [
  "sellos_actuales",
  "sellos_faltantes",
  "sellos_total",
  "premio",
  "negocio",
  "nombre",
] as const;

export type MessageVariable = (typeof MESSAGE_VARIABLES)[number];
export type MessageVars = Partial<Record<MessageVariable, string | number>>;

const VARIABLE_RE = /\{([a-z_]+)\}/g;

function isKnown(name: string): name is MessageVariable {
  return (MESSAGE_VARIABLES as readonly string[]).includes(name);
}

/**
 * Sustituye {variables} en una plantilla. Las variables desconocidas se dejan tal cual
 * y las conocidas sin valor se sustituyen por cadena vacía.
 */
export function renderMessage(template: string, vars: MessageVars): string {
  return template
    .replace(VARIABLE_RE, (whole, name: string) => {
      if (!isKnown(name)) return whole;
      const value = vars[name];
      return value === undefined ? "" : String(value);
    })
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Devuelve las variables de la plantilla que no existen (para avisar en el editor). */
export function findUnknownVariables(template: string): string[] {
  const unknown = new Set<string>();
  for (const match of template.matchAll(VARIABLE_RE)) {
    const name = match[1]!;
    if (!isKnown(name)) unknown.add(name);
  }
  return [...unknown];
}

export interface CardSnapshot {
  stamps: number;
  stampsRequired: number;
  reward: string;
  businessName: string;
  holderName?: string | null;
}

/** Arma las variables de un mensaje a partir del estado de una tarjeta. */
export function varsFromCard(card: CardSnapshot): MessageVars {
  return {
    sellos_actuales: card.stamps,
    sellos_total: card.stampsRequired,
    sellos_faltantes: Math.max(card.stampsRequired - card.stamps, 0),
    premio: card.reward,
    negocio: card.businessName,
    nombre: card.holderName?.trim() ?? "",
  };
}
