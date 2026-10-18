# Google Wallet (fase 2, preparado)

Google Wallet **no está implementado**. La landing lo avisa (“En Android, tu tarjeta vivirá en la app de Sellora”) y el flag
`features.googleWallet` de `packages/shared/sellora.config.ts` está en `false`. Mientras tanto, los clientes de Android
tienen su tarjeta con QR en la app de Sellora, que funciona igual en caja.

Esta guía deja listo lo que hay que hacer. Antes de implementarlo, confirma los detalles en la documentación vigente de
Google (<https://developers.google.com/wallet>), porque cambian.

## Qué hace falta de Google

1. Cuenta de **Google Wallet Issuer** (consola: <https://pay.google.com/business/console>). Pide revisión del emisor.
2. Un proyecto de Google Cloud con la **Google Wallet API** activa y una **cuenta de servicio** con acceso al emisor.
3. La clave JSON de esa cuenta de servicio, guardada fuera del repositorio.

## Cómo encaja en el código

| Apple Wallet (hecho)                                   | Google Wallet (por hacer)                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `buildPkpass()` genera un `.pkpass` por tarjeta        | Una **clase** de lealtad por negocio y un **objeto** por tarjeta                 |
| `locations` del pase, máx. 10                          | `locations` de la clase, también limitadas                                       |
| Botón “Añadir a Apple Wallet” → `/api/b/[slug]/pkpass` | Botón “Añadir a Google Wallet” → enlace `https://pay.google.com/gp/v/save/<JWT>` |
| Push vacío a APNs + descarga del pase                  | `PATCH` del objeto por la API REST al sellar (no hay push propio)                |
| QR con `sellora:<serial>`                              | El mismo QR como `barcode` del objeto                                            |

Pasos sugeridos:

1. `apps/web/src/server/passes/google.ts`: firmar el JWT de “Save to Google Wallet” con la clave de la cuenta de servicio
   (RS256, igual que ya se hace en `fcm.ts`) y crear/actualizar clase y objeto.
2. Enganchar la actualización en `notifyPassUpdated()` (`server/passes/push.ts`): junto al push de Wallet y al de la app.
3. Variables de entorno nuevas: `GOOGLE_WALLET_ISSUER_ID` y `GOOGLE_WALLET_SERVICE_ACCOUNT_PATH`, validadas en `src/lib/env.ts`.
4. En `/b/[slug]`, mostrar el botón de Google cuando `features.googleWallet` sea `true` y el dispositivo sea Android.
5. Tests con el mismo estilo que `apps/web/tests/pkpass.test.ts`: contenido del objeto, ubicaciones y QR.

El modelo de datos no cambia: el `serial` de `pass` identifica la tarjeta en ambos Wallets. Para guardar el id del objeto de
Google se puede derivar del serial (`<issuer>.<serial>`) sin añadir columnas.

## Otras ideas de fase 2

- **Campañas**: mensajes del negocio a sus clientes (el flag `features.campaigns` ya existe, en `false`). Con la privacidad
  actual solo pueden dirigirse a quien tiene la tarjeta, nunca por ubicación.
- **Cobros**: los planes `free` y `pro` ya limitan locales, personal y tarjetas; falta la pasarela de pago.
- **NFC**: leer tarjetas físicas NFC en caja. Hoy los plugins gratuitos de Capacitor para NFC son poco maduros; conviene
  reevaluarlos o escribir un plugin propio. La etiqueta NFC en el mostrador (que abre `/b/slug`) ya funciona sin código.
