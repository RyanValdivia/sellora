import { useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { useOutletContext } from "react-router";
import { Button } from "@sellora/ui/components/button";
import { Slider } from "@sellora/ui/components/slider";
import { Switch } from "@sellora/ui/components/switch";
import { Label } from "@sellora/ui/components/label";
import { BUSINESS_CATEGORIES, STAMP_ICONS } from "@sellora/shared/business/config";
import { t, type DictionaryKey } from "@sellora/shared/i18n";
import type { BusinessSummary } from "@sellora/shared/api/contracts";
import { ChoiceGroup, TextField } from "@/components/fields";
import { PassPreview } from "@sellora/ui/brand/pass-preview";
import { useConfigForm } from "@/lib/config-form";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <legend className="px-1 font-heading text-lg font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

export function CardPage() {
  const { business } = useOutletContext<{ business: BusinessSummary }>();
  const { form, onSubmit, query, saving, isOwner } = useConfigForm(business.id);
  const [sample, setSample] = useState(3);
  const { register, control, formState } = form;
  const errors = formState.errors;
  const watched = useWatch({ control });

  if (query.isPending || !watched.identity) return <p role="status">{t("app.loading")}</p>;
  if (!isOwner) return <p>{t("app.ownerOnly")}</p>;

  const preview = {
    identity: { ...watched.identity, name: watched.identity.name ?? "" },
    passDesign: watched.passDesign!,
    rules: { stampsRequired: watched.rules?.stampsRequired ?? 6, reward: watched.rules?.reward ?? "" },
  } as Parameters<typeof PassPreview>[0]["config"];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <h1 className="text-2xl font-extrabold">{t("app.card.title")}</h1>

      <section
        aria-label={t("app.card.preview")}
        className="-mx-4 flex flex-col gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:sticky md:top-16 md:z-20"
      >
        <PassPreview config={preview} stamps={sample} />
        <div className="mx-auto flex w-full max-w-xs items-center gap-3">
          <Label htmlFor="sample" className="shrink-0 text-xs text-muted-foreground">
            {t("app.card.previewStamps")}
          </Label>
          <Slider
            id="sample"
            min={0}
            max={preview.rules.stampsRequired}
            step={1}
            value={[Math.min(sample, preview.rules.stampsRequired)]}
            onValueChange={(v) => setSample(Array.isArray(v) ? v[0]! : v)}
          />
        </div>
      </section>

      <Section title={t("app.card.identity")}>
        <TextField
          id="name"
          label={t("app.card.name")}
          error={errors.identity?.name}
          {...register("identity.name")}
        />
        <Controller
          control={control}
          name="identity.category"
          render={({ field }) => (
            <ChoiceGroup
              label={t("app.card.category")}
              value={field.value}
              onChange={field.onChange}
              options={BUSINESS_CATEGORIES.map((c) => ({
                value: c,
                label: t(`app.card.categories.${c}` as DictionaryKey),
              }))}
            />
          )}
        />
        <TextField
          id="tagline"
          label={t("app.card.tagline")}
          error={errors.identity?.tagline}
          {...register("identity.tagline")}
        />
        <TextField
          id="phone"
          label={t("app.card.phone")}
          type="tel"
          inputMode="tel"
          error={errors.identity?.phone}
          {...register("identity.phone")}
        />
      </Section>

      <Section title={t("app.card.rules")}>
        <TextField
          id="stampsRequired"
          label={t("app.card.stampsRequired")}
          type="number"
          inputMode="numeric"
          min={2}
          max={20}
          error={errors.rules?.stampsRequired}
          {...register("rules.stampsRequired", { valueAsNumber: true })}
        />
        <TextField
          id="reward"
          label={t("app.card.reward")}
          error={errors.rules?.reward}
          {...register("rules.reward")}
        />
        <TextField
          id="maxStampsPerDay"
          label={t("app.card.maxStampsPerDay")}
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          error={errors.rules?.maxStampsPerDay}
          {...register("rules.maxStampsPerDay", { valueAsNumber: true })}
        />
        <TextField
          id="minMinutes"
          label={t("app.card.minMinutes")}
          hint={t("app.card.minMinutesHint")}
          type="number"
          inputMode="numeric"
          min={0}
          error={errors.rules?.minMinutesBetweenStamps}
          {...register("rules.minMinutesBetweenStamps", { valueAsNumber: true })}
        />
        <Controller
          control={control}
          name="rules.expiresAfterDays"
          render={({ field }) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="expires">{t("app.card.expires")}</Label>
                <Switch
                  id="expires"
                  checked={field.value !== null}
                  onCheckedChange={(on) => field.onChange(on ? 90 : null)}
                />
              </div>
              {field.value !== null ? (
                <TextField
                  id="expiresDays"
                  label={t("app.card.expiresDays")}
                  type="number"
                  inputMode="numeric"
                  min={7}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={errors.rules?.expiresAfterDays}
                />
              ) : null}
            </div>
          )}
        />
      </Section>

      <Section title={t("app.card.design")}>
        {(["backgroundColor", "foregroundColor", "labelColor"] as const).map((key) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <Label htmlFor={key}>
              {t(
                `app.card.${key === "backgroundColor" ? "background" : key === "foregroundColor" ? "foreground" : "label"}`,
              )}
            </Label>
            <input
              id={key}
              type="color"
              className="h-10 w-16 cursor-pointer rounded-lg border border-border bg-transparent p-1"
              {...register(`passDesign.${key}`)}
            />
          </div>
        ))}
        <Controller
          control={control}
          name="passDesign.stampIcon"
          render={({ field }) => (
            <ChoiceGroup
              label={t("app.card.stampIcon")}
              value={field.value}
              onChange={field.onChange}
              options={STAMP_ICONS.map((i) => ({
                value: i,
                label: t(`app.card.icons.${i}` as DictionaryKey),
              }))}
            />
          )}
        />
      </Section>

      <Section title={t("app.card.landing")}>
        <TextField
          id="headline"
          label={t("app.card.headline")}
          error={errors.landing?.headline}
          {...register("landing.headline")}
        />
        <TextField
          id="body"
          label={t("app.card.body")}
          error={errors.landing?.body}
          {...register("landing.body")}
        />
        <TextField
          id="cta"
          label={t("app.card.cta")}
          error={errors.landing?.ctaLabel}
          {...register("landing.ctaLabel")}
        />
      </Section>

      <Button type="submit" size="lg" className="h-12" disabled={saving}>
        {saving ? t("app.saving") : t("app.save")}
      </Button>
    </form>
  );
}
