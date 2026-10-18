# Apple Wallet: de modo vista previa a pases reales

Sellora genera los pases `.pkpass` sin ningún certificado de Apple: es el **modo vista previa**. Sirve para
desarrollar y probar el flujo completo (alta, QR, sellos, mensajes), pero **un iPhone rechazará esos pases**
porque su firma no encadena con los certificados de Apple.

Para que un iPhone los acepte necesitas una cuenta de pago de Apple y tres archivos PEM.

## Qué necesitas

| Qué                                   | Dónde                                                              | Costo         |
| ------------------------------------- | ------------------------------------------------------------------ | ------------- |
| Apple Developer Program               | <https://developer.apple.com/programs/>                            | 99 USD al año |
| Pass Type ID                          | Certificates, Identifiers & Profiles → Identifiers → Pass Type IDs | incluido      |
| Certificado del Pass Type ID (`.cer`) | Dentro del Pass Type ID → Create Certificate                       | incluido      |
| Certificado intermedio WWDR de Apple  | <https://www.apple.com/certificateauthority/>                      | gratis        |
| Team ID                               | Membership details                                                 | incluido      |

Los requisitos y precios pueden cambiar. Confírmalos en la web de Apple antes de pagar.

## Paso a paso

1. **Crea el Pass Type ID**, por ejemplo `pass.com.tuempresa.sellora`. Es el identificador que va en cada pase.
2. **Genera una solicitud de firma (CSR)** en tu computadora y úsala para crear el certificado del Pass Type ID.

   ```bash
   mkdir certs && cd certs
   openssl req -new -newkey rsa:2048 -nodes -keyout signerKey.pem -out request.csr \
     -subj "/emailAddress=tu@correo.com/CN=Sellora Pass/C=PE"
   ```

   Sube `request.csr` en Apple y descarga el `pass.cer` que te dan.

3. **Convierte el certificado a PEM**:

   ```bash
   openssl x509 -inform DER -in pass.cer -out signerCert.pem
   ```

4. **Descarga el WWDR** (la generación G4 es la vigente al escribir esto) y conviértelo:

   ```bash
   openssl x509 -inform DER -in AppleWWDRCAG4.cer -out wwdr.pem
   ```

5. **Guarda los tres PEM fuera del repositorio** (`certs/` ya está ignorado por Git por las reglas `*.pem`, `*.key`, `*.cer`).
6. **Configura el entorno** en `apps/web/.env.local`:

   ```bash
   APPLE_PASS_TYPE_ID=pass.com.tuempresa.sellora
   APPLE_TEAM_ID=ABCDE12345
   APPLE_WWDR_CERT_PATH=./certs/wwdr.pem
   APPLE_SIGNER_CERT_PATH=./certs/signerCert.pem
   APPLE_SIGNER_KEY_PATH=./certs/signerKey.pem
   # Si la clave tiene contraseña:
   # APPLE_SIGNER_KEY_PASSPHRASE=...
   ```

7. **Reinicia el servidor.** La respuesta de `/api/b/<slug>/pkpass` pasa a llevar `X-Sellora-Wallet-Mode: signed` y el
   aviso de vista previa desaparece de la landing.

## Probar en un iPhone real

Wallet exige **HTTPS** tanto para descargar el pase como para el servicio de actualizaciones, así que `localhost` no sirve.

1. Levanta un túnel hacia tu servidor local, por ejemplo con Cloudflare Tunnel o ngrok:

   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

2. Pon la URL https que te dé en `APP_URL` (y en `VITE_PUBLIC_URL` de `apps/app`, para que el QR apunte ahí). Reinicia.
3. Abre `https://<tu-túnel>/b/panaderia-alba` **en Safari del iPhone** y toca “Añadir a Apple Wallet”.
4. Suma un sello desde la app de caja y comprueba que el pase se actualiza y muestra el aviso.

### Avisos al pasar cerca del local

- El iPhone decide solo cuándo mostrar el aviso, según las `locations` del pase. Sellora nunca recibe la posición.
- Para probarlo sin caminar, en el simulador de Xcode usa _Features → Location → Custom Location_ con las coordenadas del local.
- En el iPhone real el aviso puede tardar. Wallet filtra por distancia, hora y uso. Si no aparece, revisa que el pase tenga
  ubicaciones y que _Sugerir en pantalla bloqueada_ esté activo en los ••• del pase.

## Cómo se actualiza un pase

1. Al guardar el pase, Wallet llama a `POST /api/wallet/v1/devices/{device}/registrations/{passTypeId}/{serial}` con su
   token de push. Lo guardamos en `device_registration`.
2. Cuando caja suma un sello, el servidor envía una notificación push **vacía** a Apple (APNs) para ese token.
3. Wallet pregunta `GET /api/wallet/v1/devices/{device}/registrations/{passTypeId}?passesUpdatedSince=…`, y luego
   descarga el pase nuevo desde `GET /api/wallet/v1/passes/{passTypeId}/{serial}` autenticando con
   `Authorization: ApplePass <authenticationToken>`.
4. El mensaje de la pantalla de bloqueo sale del campo `lastMessage` (`changeMessage: "%@"`): cuando su valor cambia, Wallet lo muestra.

## Seguridad

- Los PEM y las contraseñas **nunca** se commitean. Si se filtran, revoca el certificado en el portal de Apple y crea otro.
- El QR del pase contiene solo el número de serie. El `authenticationToken` solo viaja dentro del `.pkpass` y en la cabecera del servicio de Wallet.
- Si borras el Pass Type ID o cambias de Team ID, los pases ya emitidos dejan de actualizarse.
