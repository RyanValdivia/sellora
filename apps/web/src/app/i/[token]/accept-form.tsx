"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { acceptInvitationInput } from "@sellora/shared/api/contracts";
import { t } from "@sellora/shared/i18n";
import { Button } from "@sellora/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sellora/ui/components/field";
import { Input } from "@sellora/ui/components/input";

type Values = { name: string; email: string; password: string };

export function AcceptForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(acceptInvitationInput),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) return setDone(true);
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    setFormError(body?.error?.message ?? t("app.retry"));
  });

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-2 text-center">
        <h2 className="font-heading text-2xl font-extrabold">{t("invite.doneTitle")}</h2>
        <p className="text-muted-foreground">{t("invite.doneBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field data-invalid={errors.name ? true : undefined}>
        <FieldLabel htmlFor="name">{t("invite.name")}</FieldLabel>
        <Input
          id="name"
          className="h-11"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={errors.email ? true : undefined}>
        <FieldLabel htmlFor="email">{t("invite.email")}</FieldLabel>
        <Input
          id="email"
          type="email"
          className="h-11"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>
      <Field data-invalid={errors.password ? true : undefined}>
        <FieldLabel htmlFor="password">{t("invite.password")}</FieldLabel>
        <Input
          id="password"
          type="password"
          className="h-11"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby="password-hint"
          {...register("password")}
        />
        <FieldDescription id="password-hint">{t("invite.passwordHint")}</FieldDescription>
        <FieldError errors={[errors.password]} />
      </Field>
      {formError ? <FieldError>{formError}</FieldError> : null}
      <Button type="submit" size="lg" className="h-12" disabled={isSubmitting}>
        {t("invite.submit")}
      </Button>
    </form>
  );
}
