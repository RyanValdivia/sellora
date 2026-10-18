import { t, type DictionaryKey } from "@sellora/shared/i18n";
import { fail } from "../api";
import type { ActionResult } from "./stamping";

/** 409 con el motivo y un texto listo para mostrar en caja. */
export function actionError(result: Extract<ActionResult, { ok: false }>) {
  const message = t(`caja.denied.${result.reason}` as DictionaryKey, {
    time: result.retryAt
      ? result.retryAt.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
      : "",
  });
  const response = fail(409, result.reason, message);
  return response;
}
