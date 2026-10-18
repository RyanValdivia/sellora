import { Fragment } from "react";
import { cn } from "@sellora/ui/utils";

/**
 * Pinta *palabras* con el acento serif cursivo dentro de un titular.
 * El texto viene del diccionario, así que no hay marcado en los componentes.
 */
export function Rich({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\*(.+?)\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em
            key={i}
            className={cn(
              "font-serif text-[1.08em] font-normal tracking-normal text-ink-accent italic",
              className,
            )}
          >
            {part}
          </em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
