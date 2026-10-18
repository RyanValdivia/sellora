import type { ComponentProps, ReactNode } from "react";
import type { FieldError as RhfError } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sellora/ui/components/field";
import { Input } from "@sellora/ui/components/input";
import { Button } from "@sellora/ui/components/button";
import { cn } from "@sellora/ui/utils";

type TextFieldProps = Omit<ComponentProps<typeof Input>, "id"> & {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: RhfError;
};

/** Etiqueta + input + ayuda + error, con los atributos de accesibilidad conectados. */
export function TextField({ id, label, hint, error, className, ...input }: TextFieldProps) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined
        }
        className={cn("h-11", className)}
        {...input}
      />
      {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      <FieldError id={`${id}-error`} errors={[error]} />
    </Field>
  );
}

interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange(value: T): void;
}

/** Elige una opción entre pocas con botones grandes (mejor en celular que un desplegable). */
export function ChoiceGroup<T extends string>({ label, value, options, onChange }: ChoiceProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            variant={o.value === value ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
