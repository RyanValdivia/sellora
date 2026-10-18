# Sellora

> Tu barrio, a un sello de distancia.

Plataforma SaaS para que negocios de barrio creen tarjetas de fidelidad digitales para Apple Wallet
(Google Wallet en fase 2), con avisos de proximidad en la pantalla de bloqueo del cliente.

Este README se completa al final del proyecto. Estado actual: **hito 2** (monorepo pnpm: `apps/web`, `packages/shared`, `packages/ui`; próximamente `apps/app` con Vite + Capacitor).

## Arranque rápido

```bash
pnpm install
cp .env.example .env.local
pnpm dev            # apps/web en http://localhost:3000
```

Scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`, `pnpm brand:build`.

## Cambiar la marca

Un tema de marca cambia tocando solo tres sitios:

1. **Tokens de color** → bloque `BRAND TOKENS` al inicio de `packages/ui/src/styles/globals.css` (modo claro y oscuro).
2. **Datos de marca** → `packages/shared/sellora.config.ts` (nombre, lema, paleta para pases/OG, moneda, enlaces legales).
3. **Logo** → `packages/shared/src/brand/stamp-geometry.ts` + `pnpm brand:build`, que regenera `apps/web/public/brand/*.svg` y el favicon.

Los textos están en `packages/shared/src/i18n/es-PE.ts`. Un test (`packages/shared/tests/brand.test.ts`) comprueba que la paleta de
`sellora.config.ts` coincide con los tokens de `globals.css`.

Las tipografías se cargan con `next/font` en `apps/web/src/app/fonts.ts` (necesita valores literales).
