import config from "@config";
import { esPE, type Dictionary } from "./es-PE";

const dictionaries: Record<string, Dictionary> = {
  "es-PE": esPE,
};

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = T extends string
  ? never
  : T extends readonly unknown[]
    ? never
    : { [K in keyof T & string]: T[K] extends string ? K : Join<K, Paths<T[K]>> | K }[keyof T & string];

export type DictionaryKey = Paths<Dictionary>;

export type Vars = Record<string, string | number>;

function lookup(dict: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object") return (node as Record<string, unknown>)[part];
    return undefined;
  }, dict);
}

export function getDictionary(locale: string = config.locale.default): Dictionary {
  return dictionaries[locale] ?? dictionaries[config.locale.default];
}

function interpolate(template: string, vars: Vars): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** Texto traducido con variables. Las claves inexistentes devuelven la propia clave. */
export function t(key: DictionaryKey, vars: Vars = {}, locale?: string): string {
  const value = lookup(getDictionary(locale), key);
  if (typeof value !== "string") return key;
  return interpolate(value, { brand: config.brand.name, tagline: config.brand.tagline, ...vars });
}

/** Valor estructurado (listas, objetos) del diccionario, p. ej. los pasos de “Cómo funciona”. */
export function tr<T = unknown>(key: string, locale?: string): T {
  return lookup(getDictionary(locale), key) as T;
}

export { interpolate };
