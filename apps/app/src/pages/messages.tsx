import { useState } from "react";
import { useWatch } from "react-hook-form";
import { useOutletContext } from "react-router";
import { Button } from "@sellora/ui/components/button";
import { FieldError, FieldLabel } from "@sellora/ui/components/field";
import { Textarea } from "@sellora/ui/components/textarea";
import {
  MESSAGE_VARIABLES,
  findUnknownVariables,
  renderMessage,
  varsFromCard,
  type MessageVariable,
} from "@sellora/shared/business/messages";
import type { BusinessConfig } from "@sellora/shared/business/config";
import type { BusinessSummary } from "@sellora/shared/api/contracts";
import { t, type DictionaryKey } from "@sellora/shared/i18n";
import { useConfigForm } from "@/lib/config-form";

const KEYS = ["welcome", "stampAdded", "rewardReady", "redeemed", "nearby"] as const;

export function MessagesPage() {
  const { business } = useOutletContext<{ business: BusinessSummary }>();
  const { form, onSubmit, query, saving, isOwner } = useConfigForm(business.id);
  const { register, control, setValue, getValues, formState } = form;
  const watched = useWatch({ control });
  const [focused, setFocused] = useState<(typeof KEYS)[number]>("welcome");

  if (query.isPending || !watched.messages) return <p role="status">{t("app.loading")}</p>;
  if (!isOwner) return <p>{t("app.ownerOnly")}</p>;

  const cfg = watched as BusinessConfig;
  // Valores de ejemplo para que el dueño vea el resultado real del mensaje.
  const sample = varsFromCard({
    stamps: Math.max(cfg.rules.stampsRequired - 1, 0),
    stampsRequired: cfg.rules.stampsRequired,
    reward: cfg.rules.reward,
    businessName: cfg.identity.name,
    holderName: "Rosa",
  });

  function insert(variable: MessageVariable) {
    const key = focused;
    const current = getValues(`messages.${key}`) ?? "";
    setValue(`messages.${key}`, `${current} {${variable}}`.trim(), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-2xl font-extrabold">{t("app.messages.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("app.messages.intro")}</p>
      </div>

      <div className="sticky top-16 z-20 -mx-4 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t("app.messages.variables")}</p>
        <div className="flex flex-wrap gap-2">
          {MESSAGE_VARIABLES.map((v) => (
            <Button
              key={v}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              title={t(`app.messages.vars.${v}` as DictionaryKey)}
              onClick={() => insert(v)}
            >
              {`{${v}}`}
            </Button>
          ))}
        </div>
      </div>

      {KEYS.map((key) => {
        const text = watched.messages?.[key] ?? "";
        const unknown = findUnknownVariables(text);
        return (
          <div key={key} className="flex flex-col gap-2">
            <FieldLabel htmlFor={key}>{t(`app.messages.${key}` as DictionaryKey)}</FieldLabel>
            <Textarea
              id={key}
              rows={2}
              maxLength={160}
              {...register(`messages.${key}`, { onBlur: () => setFocused(key) })}
              onFocus={() => setFocused(key)}
              aria-invalid={!!formState.errors.messages?.[key]}
            />
            {unknown.length > 0 ? (
              <FieldError>{t("app.messages.unknownVars", { vars: unknown.join(", ") })}</FieldError>
            ) : null}
            <FieldError errors={[formState.errors.messages?.[key]]} />
            <p className="rounded-xl bg-muted px-3 py-2 text-sm">
              <span className="mr-2 text-xs font-medium text-muted-foreground">
                {t("app.messages.example")}
              </span>
              {renderMessage(text, sample)}
            </p>
          </div>
        );
      })}

      <Button type="submit" size="lg" className="h-12" disabled={saving}>
        {saving ? t("app.saving") : t("app.save")}
      </Button>
    </form>
  );
}
