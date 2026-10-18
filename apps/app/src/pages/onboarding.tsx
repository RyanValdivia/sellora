import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@sellora/ui/components/button";
import { t } from "@sellora/shared/i18n";
import { TextField } from "@/components/fields";
import { useCreateBusiness } from "@/lib/business";

const schema = z.object({ name: z.string().trim().min(2, "Escribe el nombre de tu negocio").max(60) });

/** Pantalla para usuarios con sesión pero sin negocio todavía. */
export function Onboarding() {
  const create = useCreateBusiness();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: "" } });

  const onSubmit = form.handleSubmit(async ({ name }) => {
    try {
      await create.mutateAsync(name);
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{t("app.onboarding.title")}</h1>
        <p className="text-muted-foreground">{t("app.onboarding.body")}</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          id="name"
          label={t("app.auth.businessName")}
          error={form.formState.errors.name}
          {...form.register("name")}
        />
        <Button type="submit" size="lg" className="h-12" disabled={create.isPending}>
          {t("app.onboarding.create")}
        </Button>
      </form>
    </div>
  );
}
