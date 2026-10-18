import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { api, json } from "./api";

/**
 * Notificaciones de la app del cliente (FCM). Están apagadas por defecto: en Android la app se cierra al
 * pedir el token si el proyecto no tiene `google-services.json`. Pasos para activarlas: docs/push.md.
 */
export const pushEnabled: boolean =
  import.meta.env.VITE_PUSH_ENABLED === "true" && Capacitor.isNativePlatform();

let started = false;

/** Pide permiso, obtiene el token y se lo envía al servidor. Seguro llamarlo más de una vez. */
export async function registerForPush(): Promise<void> {
  if (!pushEnabled || started) return;
  started = true;

  await PushNotifications.addListener("registration", ({ value }) => {
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    void api("/api/customer/push-token", { method: "POST", ...json({ token: value, platform }) }).catch(
      () => {
        // Si falla, se reintenta la próxima vez que se abra la app.
        started = false;
      },
    );
  });
  await PushNotifications.addListener("registrationError", () => {
    started = false;
  });

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive === "granted") await PushNotifications.register();
}
