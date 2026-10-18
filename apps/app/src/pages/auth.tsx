import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { z } from "zod";
import { Logo } from "@sellora/ui/brand/logo";
import { Rich } from "@sellora/ui/brand/rich";
import { Button } from "@sellora/ui/components/button";
import { FieldError } from "@sellora/ui/components/field";
import { t } from "@sellora/shared/i18n";
import { TextField } from "@/components/fields";
import { HttpError, api, json } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const loginSchema = z.object({
  email: z.email("Escribe un correo válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre"),
  businessName: z.string().trim().min(2, "Escribe el nombre de tu negocio").max(60),
  email: z.email("Escribe un correo válido"),
  password: z.string().min(8, t("app.auth.passwordHint")),
});

function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      <Logo className="h-9 self-start" />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">
          <Rich text={title} />
        </h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function LoginPage() {
  const { state, signIn, signInAsCustomer } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  if (state.status === "authenticated") return <Navigate to="/" replace />;

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await signIn(email, password);
      void navigate("/", { replace: true });
    } catch (e) {
      setFormError(
        e instanceof HttpError && e.status === 401 ? t("app.auth.invalidCredentials") : (e as Error).message,
      );
    }
  });

  return (
    <AuthFrame title={t("app.auth.loginTitle")} subtitle={t("app.auth.loginSubtitle")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          id="email"
          label={t("app.auth.email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={form.formState.errors.email}
          {...form.register("email")}
        />
        <TextField
          id="password"
          label={t("app.auth.password")}
          type="password"
          autoComplete="current-password"
          error={form.formState.errors.password}
          {...form.register("password")}
        />
        {formError ? <FieldError>{formError}</FieldError> : null}
        <Button type="submit" size="lg" className="h-12" disabled={form.formState.isSubmitting}>
          {t("app.auth.login")}
        </Button>
      </form>
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-border p-4 text-center">
        <Button
          type="button"
          variant="ghost"
          className="font-medium"
          onClick={() =>
            void signInAsCustomer()
              .then(() => navigate("/c", { replace: true }))
              .catch((e: Error) => setFormError(e.message))
          }
        >
          {t("me.enter")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("me.enterHint")}</p>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {t("app.auth.noAccount")}{" "}
        <Link to="/registro" className="font-medium text-ink-accent underline underline-offset-4">
          {t("common.createCard")}
        </Link>
      </p>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { state, signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", businessName: "", email: "", password: "" },
  });

  if (state.status === "authenticated") return <Navigate to="/" replace />;

  const onSubmit = form.handleSubmit(async ({ name, businessName, email, password }) => {
    setFormError(null);
    try {
      await signUp(name, email, password);
      // El negocio se crea justo después, ya con la sesión abierta.
      await api("/api/business", { method: "POST", ...json({ name: businessName }) });
      void navigate("/", { replace: true });
    } catch (e) {
      setFormError(
        e instanceof HttpError && e.status === 422 ? t("app.auth.emailTaken") : (e as Error).message,
      );
    }
  });

  return (
    <AuthFrame title={t("app.auth.registerTitle")} subtitle={t("app.auth.registerSubtitle")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          id="name"
          label={t("app.auth.name")}
          autoComplete="name"
          error={form.formState.errors.name}
          {...form.register("name")}
        />
        <TextField
          id="businessName"
          label={t("app.auth.businessName")}
          error={form.formState.errors.businessName}
          {...form.register("businessName")}
        />
        <TextField
          id="email"
          label={t("app.auth.email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={form.formState.errors.email}
          {...form.register("email")}
        />
        <TextField
          id="password"
          label={t("app.auth.password")}
          type="password"
          autoComplete="new-password"
          hint={t("app.auth.passwordHint")}
          error={form.formState.errors.password}
          {...form.register("password")}
        />
        {formError ? <FieldError>{formError}</FieldError> : null}
        <Button type="submit" size="lg" className="h-12" disabled={form.formState.isSubmitting}>
          {t("app.auth.register")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t("app.auth.haveAccount")}{" "}
        <Link to="/entrar" className="font-medium text-ink-accent underline underline-offset-4">
          {t("app.auth.login")}
        </Link>
      </p>
    </AuthFrame>
  );
}
