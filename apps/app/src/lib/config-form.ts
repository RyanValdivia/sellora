import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { businessConfigSchema, type BusinessConfig } from "@sellora/shared/business/config";
import { t } from "@sellora/shared/i18n";
import { HttpError } from "./api";
import { useConfig, useSaveConfig } from "./business";

/**
 * Formulario sobre la config completa del negocio, compartido por las pantallas de tarjeta y mensajes.
 * Cada pantalla pinta solo sus campos; al guardar se envía la config entera.
 */
export function useConfigForm(businessId: string) {
  const query = useConfig(businessId);
  const save = useSaveConfig(businessId);
  const form = useForm<BusinessConfig>({
    // zod aplica los defaults al parsear, por eso el tipo de entrada difiere del de salida.
    resolver: zodResolver(businessConfigSchema) as unknown as Resolver<BusinessConfig>,
  });

  const loaded = query.data?.config;
  useEffect(() => {
    if (loaded) form.reset(loaded);
  }, [loaded, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
      toast.success(t("app.saved"));
    } catch (e) {
      toast.error(e instanceof HttpError ? e.message : t("app.retry"));
    }
  });

  return { form, onSubmit, query, saving: save.isPending, isOwner: query.data?.role === "owner" };
}
