# Sellora

> Tu barrio, a un sello de distancia.

Sellora es un SaaS para que los negocios de barrio (cafeterías, panaderías, barberías, bodegas…) tengan su **tarjeta de
sellos digital**. El cliente la guarda en el Apple Wallet de su iPhone o en la app de Sellora, el cajero suma sellos
escaneando un QR y el celular del cliente se actualiza solo. Si pasa cerca del local, Wallet le avisa en la pantalla de bloqueo.

**Privacidad por diseño:** el servidor nunca recibe ni guarda la ubicación del cliente. El teléfono compara su posición con
la del local por su cuenta. Del cliente solo se guarda un código de tarjeta y, si él quiere, su nombre.

## Estado

| Pieza                                                                                                      | Estado                                                                |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Landing, privacidad y términos                                                                             | Hecho                                                                 |
| Alta de negocio, editor de tarjeta con vista previa, mensajes con variables, locales (Nominatim + Leaflet) | Hecho                                                                 |
| QR imprimible (PNG, SVG, cartel PDF) y guía de etiqueta NFC                                                | Hecho                                                                 |
| `.pkpass` (storeCard) con ubicaciones, servicio web de PassKit v1 y push a APNs                            | Hecho; **sin probar con un iPhone ni con certificados reales**        |
| Caja: escáner de QR nativo y de navegador, sumar sello y canjear                                           | Hecho                                                                 |
| Equipo de caja por invitación con enlace                                                                   | Hecho                                                                 |
| Superadmin: negocios, planes, activación, registro abierto                                                 | Hecho                                                                 |
| App del cliente (cuenta anónima, tarjetas con QR)                                                          | Hecho                                                                 |
| Avisos a la app (FCM)                                                                                      | Hecho en el servidor y en la app; **sin probar** (necesita Firebase)  |
| Android: APK debug compilado                                                                               | Hecho                                                                 |
| iOS: proyecto generado                                                                                     | **No compilado** (necesita un Mac)                                    |
| Google Wallet, campañas, cobros, NFC en caja                                                               | Fase 2, preparado en [`docs/google-wallet.md`](docs/google-wallet.md) |

## Cómo está armado

```
sellora/
├── apps/
│   ├── web/                 Next.js 16: landing, /b/[slug], /i/[token], API (route handlers), pases, base de datos
│   │   ├── src/app/         páginas y /api/*
│   │   ├── src/server/      db (Drizzle), auth (Better Auth), passes (pkpass, push, sellado)
│   │   ├── drizzle/         migraciones: sqlite/ y pg/
│   │   └── scripts/         marca, iconos de la app y prueba de punta a punta
│   └── app/                 Vite + React + Capacitor: dueño, caja, superadmin y cliente
│       ├── src/pages/       pantallas
│       ├── android/ ios/    proyectos nativos
│       └── assets/          iconos y splash de origen
├── packages/
│   ├── shared/              config de plataforma, i18n (es-PE), reglas de sellos, mensajes, contratos zod
│   └── ui/                  shadcn/ui, tokens de marca, logo y vista previa del pase
└── docs/                    diagramas y guías (Apple Wallet, móviles, notificaciones, Google Wallet)
```

Stack: Next.js (App Router, TypeScript estricto), Tailwind 4, shadcn/ui, react-hook-form + zod, Drizzle ORM, Better Auth,
passkit-generator, Vite + Capacitor, pnpm. Los diagramas del modelo y los flujos están en [`docs/diagramas.md`](docs/diagramas.md).

## Instalación

Necesitas Node 22 o superior y pnpm.

```bash
pnpm install
cp .env.example apps/web/.env.local     # ajusta lo que necesites
pnpm --filter @sellora/web db:migrate   # crea la base SQLite local
pnpm --filter @sellora/web db:seed      # Panadería Alba + usuarios de prueba
pnpm dev                                # servidor en http://localhost:3000
pnpm --filter @sellora/app dev          # app en http://localhost:5173
```

Usuarios de prueba (solo desarrollo; contraseña `sellora-dev-123`):

| Rol                     | Correo               |
| ----------------------- | -------------------- |
| Dueño de Panadería Alba | `alba@sellora.test`  |
| Superadmin              | `admin@sellora.test` |

La tarjeta pública de ejemplo está en <http://localhost:3000/b/panaderia-alba>. Para ver todo el flujo sin celular: entra a la
app como dueño, ve a _Caja_, y pega un código `sellora:<serial>` (el serial sale del `.pkpass` o de la tarjeta de un cliente).

### Scripts

| Comando                                                       | Qué hace                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------- |
| `pnpm lint` · `pnpm typecheck` · `pnpm test`                  | Calidad en todo el monorepo                               |
| `pnpm format` · `pnpm format:check`                           | Prettier                                                  |
| `pnpm build`                                                  | Build de producción del servidor                          |
| `pnpm brand:build`                                            | Regenera logo, favicon y trazado del wordmark             |
| `pnpm --filter @sellora/web db:generate`                      | Migraciones de SQLite **y** Postgres a partir del esquema |
| `pnpm --filter @sellora/web exec node scripts/smoke-flow.mjs` | Prueba de punta a punta (con el servidor corriendo)       |
| `pnpm --filter @sellora/app android:debug`                    | APK debug (ver [`docs/mobile.md`](docs/mobile.md))        |

## Configuración en tres capas

Todo lo que se puede cambiar vive en uno de estos tres sitios, de menos a más específico:

1. **Plataforma** — `packages/shared/sellora.config.ts`, validado con zod: marca, paleta, moneda, zona horaria, planes y
   límites, enlaces legales, _feature flags_. Es lo que se toca para rehacer la marca.
2. **Entorno** — variables validadas al arrancar (`apps/web/src/lib/env.ts`); la lista comentada está en [`.env.example`](.env.example).
3. **Negocio** — en la base de datos y editable desde la app: identidad, reglas, mensajes, diseño del pase, ubicaciones,
   equipo y textos de la página pública.

Los textos de la interfaz salen de un diccionario (`packages/shared/src/i18n/es-PE.ts`) con la función `t()`.

### Variables de entorno

| Variable                                               | Para qué                                                                                    | Por defecto             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------- |
| `APP_URL`                                              | URL pública del servidor (QR, invitaciones, `webServiceURL` del pase). En producción, https | `http://localhost:3000` |
| `DATABASE_URL`                                         | `file:./data/sellora.db` (SQLite) o `postgres://…`; el prefijo elige el driver              | SQLite local            |
| `BETTER_AUTH_SECRET`                                   | Secreto de sesiones, 32+ caracteres. **Obligatorio cambiarlo en producción**                | valor de desarrollo     |
| `TRUSTED_ORIGINS`                                      | Orígenes de las apps autorizados por CORS                                                   | Vite y Capacitor        |
| `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_*_PATH`  | Firma de pases de Apple Wallet                                                              | modo vista previa       |
| `FCM_SERVICE_ACCOUNT_PATH`                             | Avisos a la app del cliente                                                                 | desactivado             |
| `VITE_API_URL`, `VITE_PUBLIC_URL`, `VITE_PUSH_ENABLED` | Variables de la app ([`apps/app/.env.example`](apps/app/.env.example))                      | servidor local          |

Postgres: pon `DATABASE_URL=postgres://…` y ejecuta `pnpm --filter @sellora/web db:migrate`. Las migraciones de Postgres
están generadas, pero la ruta de Postgres solo se ha probado con SQLite.

## Cambiar la marca (demo)

Ejemplo: pasar de “Sellora” a “Estampa” con otro color principal.

1. **Datos de marca** — `packages/shared/sellora.config.ts`: cambia `brand.name` a `"Estampa"` y `brand.wordmark` a `"estampa"`.
   Cambia `palette.tangerine` al nuevo color (por ejemplo `#7C3AED`).
2. **Tokens de color** — `packages/ui/src/styles/globals.css`, bloque `TOKENS DE MARCA`: pon el mismo valor en `--brand-tangerine`
   (y ajusta `--brand-tangerine-ink`, la versión oscura para texto). Un test (`packages/shared/tests/brand.test.ts`)
   falla si la paleta del paso 1 y los tokens del CSS no coinciden.
3. **Logo** — `pnpm brand:build` regenera `apps/web/public/brand/*.svg`, el favicon y el wordmark. La forma del sello vive en
   `packages/shared/src/brand/stamp-geometry.ts`.
4. **App móvil** — `pnpm --filter @sellora/web app:assets` regenera iconos y pantalla de inicio de Android. Cambia también `appName` y
   `appId` en `apps/app/capacitor.config.ts` (el id no se puede cambiar una vez publicada la app) y el `<title>` de `apps/app/index.html`.
5. **Textos** — `packages/shared/src/i18n/es-PE.ts`; “Sellora” aparece como `{brand}`, así que cambia sola.
6. Si cambias las tipografías, hay que tocar `apps/web/src/app/fonts.ts` (`next/font` exige valores literales) y los imports de
   `@fontsource` en `apps/app/src/index.css`.

## Probar en un iPhone real

El servidor genera los pases sin certificados, pero el iPhone solo los acepta firmados por Apple.

1. Apple Developer Program, Pass Type ID y certificados: [`docs/apple-wallet.md`](docs/apple-wallet.md).
2. Un túnel https hacia tu PC (por ejemplo `cloudflared tunnel --url http://localhost:3000`); Wallet no acepta `http`.
3. Pon esa URL en `APP_URL`, abre `https://<túnel>/b/panaderia-alba` en **Safari del iPhone** y toca “Añadir a Apple Wallet”.
4. Suma un sello desde la app de caja y mira cómo se actualiza el pase.

## Probar en un Android real

Hay un APK debug que se compila con la IP local de tu PC. Pasos en [`docs/mobile.md`](docs/mobile.md). Los clientes de Android
usan la tarjeta con QR dentro de la app (Google Wallet es de la fase 2).

## Seguridad y privacidad, en corto

- La ubicación del cliente nunca llega al servidor; las `locations` del pase las compara el teléfono.
- El QR de la tarjeta lleva solo el número de serie. El `authenticationToken` no viaja en el QR.
- Los roles (`superadmin`, `owner`, `staff`, `customer`) los asigna el servidor; nadie elige el suyo.
- Cada negocio solo ve sus datos; pedir una tarjeta de otro negocio responde 404, igual que si no existiera.
- Las invitaciones se guardan con hash, vencen a los 7 días y se usan una sola vez.
- Los certificados y claves están en `.gitignore`. No los subas.

## Límites conocidos

- Nada del flujo de Apple Wallet ni de APNs se ha probado en un iPhone real, ni FCM con Firebase real.
- El proyecto de iOS está generado pero no se ha compilado.
- La captura de sellos por NFC no existe; solo la pegatina NFC del mostrador (que abre el enlace del negocio).
- El límite de peticiones está en memoria: con varias réplicas hay que llevarlo a Redis o a la base.
- Los textos legales son una base y deben revisarse con un abogado antes de lanzar.

## Más documentación

- [`docs/diagramas.md`](docs/diagramas.md): modelo de datos y flujos
- [`docs/apple-wallet.md`](docs/apple-wallet.md): certificados, pruebas en iPhone y cómo se actualiza un pase
- [`docs/mobile.md`](docs/mobile.md): compilar y publicar en Android e iOS
- [`docs/push.md`](docs/push.md): notificaciones de Wallet y de la app
- [`docs/google-wallet.md`](docs/google-wallet.md): lo que falta para fase 2
