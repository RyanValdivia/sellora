# Notificaciones

Hay dos canales y funcionan por separado.

| Canal             | Quién lo recibe                      | Cómo se envía                                                       | Qué hace falta                                 |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------- |
| **Wallet (APNs)** | Quien guardó el pase en Apple Wallet | Push vacío a APNs; Wallet baja el pase y muestra el `changeMessage` | Certificados de Apple (`docs/apple-wallet.md`) |
| **App (FCM)**     | Clientes con la app de Sellora       | FCM HTTP v1 con el texto del mensaje                                | Proyecto de Firebase                           |

Ninguno envía la ubicación del cliente. Los avisos “estás cerca” los decide el teléfono con las `locations` del pase.

## Activar FCM para la app del cliente

1. Crea un proyecto en <https://console.firebase.google.com> y añade una app **Android** con el id `app.sellora.app`
   (o el que hayas puesto en `capacitor.config.ts`).
2. Descarga `google-services.json` y cópialo a `apps/app/android/app/google-services.json` (está en `.gitignore`).
   Capacitor aplica el plugin de Google Services solo si ese archivo existe.
3. En Firebase → _Configuración del proyecto → Cuentas de servicio_ genera una clave privada (JSON). Guárdala **fuera del repositorio**.
4. Configura el servidor:

   ```bash
   # apps/web/.env.local
   FCM_SERVICE_ACCOUNT_PATH=./certs/firebase-service-account.json
   ```

5. Construye la app con las notificaciones activadas:

   ```bash
   VITE_PUSH_ENABLED=true pnpm --filter @sellora/app android:debug
   ```

   Sin `google-services.json`, **no actives** `VITE_PUSH_ENABLED`: la app se cerraría al pedir el token.

6. Entra como cliente, guarda una tarjeta y suma un sello desde caja: debe llegar la notificación con el mensaje del negocio.

El servidor olvida solo los tokens que FCM marca como inexistentes. Las notificaciones no se reintentan: si el celular
está apagado, la app se pone al día la próxima vez que se abre (consulta cada 10–15 segundos mientras está visible).

### iOS

`@capacitor/push-notifications` entrega en iOS un token de APNs, no de FCM. Para usar FCM en iOS hay que añadir el SDK de
Firebase a `apps/app/ios` y `GoogleService-Info.plist`, o enviar directo por APNs con una clave `.p8`. No está hecho: hoy los
clientes de iPhone reciben avisos por el pase de Wallet.

## Estado de la prueba

El flujo de Wallet y el del servidor (registro de dispositivos, consulta de cambios, descarga con `If-Modified-Since`) están
probados de punta a punta con `apps/web/scripts/smoke-flow.mjs`. El envío real a APNs y FCM **no se ha probado**: necesita
certificados y un proyecto de Firebase reales.
