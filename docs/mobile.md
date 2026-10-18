# Apps móviles (Android e iOS)

`apps/app` es una sola app Vite + React empaquetada con Capacitor. Sirve para tres perfiles:
**dueño** (editor de tarjeta, locales, QR, equipo), **caja** (escáner y sellos) y **cliente** (sus tarjetas con QR).
El perfil lo decide la cuenta: dueños y personal entran con correo; los clientes con una cuenta anónima, sin datos.

## Requisitos

| Para             | Necesitas                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Web y desarrollo | Node 22 o superior y pnpm                                                                             |
| Android          | Android Studio (trae el SDK) y **JDK 21** (Capacitor 8 no compila con JDK 25)                         |
| iOS              | Un Mac con Xcode, o un CI con macOS (GitHub Actions, Codemagic). **No se puede compilar en Windows.** |

Si Gradle falla con `Unsupported class file major version`, está usando un JDK demasiado nuevo. Apunta `JAVA_HOME` a un JDK 21.

## Probar en el navegador

```bash
pnpm dev                                  # servidor en :3000
pnpm --filter @sellora/app dev            # app en :5173
```

La app web usa la cámara del navegador (jsQR) para escanear y, si no hay cámara, deja escribir el código a mano.

## Probar en el emulador de Android Studio

El emulador ve el PC en `10.0.2.2`:

```bash
cd apps/app
VITE_API_URL=http://10.0.2.2:3000 pnpm android:debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

El escáner nativo de Google se descarga la primera vez y necesita Google Play Services. Si no está disponible (como en
algunos emuladores), la app avisa y usa la cámara del WebView como respaldo: la cámara virtual del emulador no sirve para
leer un QR de verdad, así que en el emulador usa el campo de código manual. En un celular real el escáner funciona.

## Probar en un Android real (debug)

1. Averigua la IP de tu PC en la red local, por ejemplo `192.168.18.21`, y pon el celular en la **misma red Wi-Fi**.
2. Arranca el servidor escuchando en toda la red y con esa URL pública (para QR, invitaciones y pases):

   ```bash
   # apps/web/.env.local
   APP_URL=http://192.168.18.21:3000
   pnpm --filter @sellora/web exec next dev -H 0.0.0.0
   ```

3. Construye la app apuntando a ese servidor y genera el APK:

   ```bash
   cd apps/app
   VITE_API_URL=http://192.168.18.21:3000 pnpm android:debug
   # APK: apps/app/android/app/build/outputs/apk/debug/app-debug.apk
   ```

4. Instálalo: `adb install -r app-debug.apk`, o pásalo al celular y ábrelo (permite “instalar apps desconocidas”).

Las peticiones salen por el cliente HTTP nativo de Capacitor, así que no hay problemas de CORS. El permiso para HTTP sin
cifrar solo existe en builds **debug** (`android/app/src/debug/AndroidManifest.xml`); el build release exige HTTPS.

**Importante:** `APP_URL` es la dirección que el servidor escribe en los enlaces de invitación y en el QR. Si la dejas en
`localhost`, esos enlaces no abren desde otro celular. Ponle la IP de tu PC (o tu dominio).

Con Windows Firewall activo, permite Node.js en redes privadas la primera vez que lo pida.

## Publicar en Google Play

1. Cuenta de Google Play Console (pago único de 25 USD al escribir esto; verifica el precio actual).
2. Crea una llave de firma **y guárdala fuera del repositorio con copia de respaldo**: si la pierdes no puedes actualizar la app.

   ```bash
   keytool -genkey -v -keystore sellora-release.jks -alias sellora -keyalg RSA -keysize 2048 -validity 10000
   ```

3. Define la firma en `android/keystore.properties` (ignorado por Git) y léela desde `android/app/build.gradle`
   (`signingConfigs.release`), según la guía de Android: <https://developer.android.com/studio/publish/app-signing>.
4. Construye con tu URL de producción (https) y genera el bundle:

   ```bash
   cd apps/app
   VITE_API_URL=https://api.tudominio.com pnpm android:release
   # AAB: apps/app/android/app/build/outputs/bundle/release/app-release.aab
   ```

5. Sube el `.aab` en Play Console. Necesitas ficha, capturas, política de privacidad (`/privacidad`) y el formulario de
   “Seguridad de los datos”: declara que la app no recoge ubicación y que la cuenta del cliente es anónima.

El `applicationId` es `app.sellora.app` (en `capacitor.config.ts`). Cámbialo **antes** de publicar: no se puede cambiar después.

## Publicar en App Store (iOS)

1. Apple Developer Program (99 USD al año). Es el mismo que se necesita para los pases de Wallet.
2. En un Mac: `pnpm --filter @sellora/app build && pnpm --filter @sellora/app exec cap sync ios`, y abre
   `apps/app/ios/App` en Xcode. Capacitor 8 usa Swift Package Manager, no hace falta CocoaPods.
3. Elige tu Team en _Signing & Capabilities_, cambia el Bundle Identifier y archiva (_Product → Archive_).
4. Sube a App Store Connect con el Organizer o con TestFlight.
5. Para el CI sin Mac propio: Codemagic o GitHub Actions (`macos-latest`) con `xcodebuild archive`.

`Info.plist` ya incluye el texto de permiso de cámara. Si añades más permisos, Apple exige explicar cada uno.

## Iconos y pantalla de inicio

Salen del logo de la marca. Tras cambiar `packages/shared/src/brand/stamp-geometry.ts`:

```bash
pnpm brand:build        # regenera los SVG
pnpm --filter @sellora/web app:assets   # regenera iconos y splash de Android y los PNG de assets/
```

Los iconos de iOS (`AppIcon`) se generan con `assets/icon-only.png` desde Xcode o con `@capacitor/assets` en un Mac.

## Enlaces que abren la app

Hoy, escanear el QR del mostrador abre la landing web del negocio (`/b/slug`); desde ahí el cliente guarda su pase de
Apple Wallet. Para que ese enlace abra directamente la app instalada hacen falta _Android App Links_ y _Universal Links_,
que dependen de tu dominio (`assetlinks.json` y `apple-app-site-association`). Queda como mejora cuando haya dominio.
