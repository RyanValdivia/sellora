import { readFileSync } from "node:fs";
import http2 from "node:http2";
import { eq, inArray } from "drizzle-orm";
import { env } from "../../lib/env";
import { dbPromise, schema } from "../db";
import { walletMode } from "./certificates";
import { fcmEnabled, sendFcm } from "./fcm";

const APNS_ORIGIN = "https://api.push.apple.com";

export interface PushOutcome {
  token: string;
  status: number;
}

/**
 * Envía el push vacío con el que Wallet sabe que debe pedir el pase de nuevo.
 * Se autentica con el mismo certificado del Pass Type ID y el topic es el Pass Type ID.
 */
export async function sendWalletPushes(tokens: string[]): Promise<PushOutcome[]> {
  if (tokens.length === 0) return [];
  const client = http2.connect(APNS_ORIGIN, {
    cert: readFileSync(env.APPLE_SIGNER_CERT_PATH!),
    key: readFileSync(env.APPLE_SIGNER_KEY_PATH!),
    passphrase: env.APPLE_SIGNER_KEY_PASSPHRASE,
  });
  client.on("error", () => undefined);

  const send = (token: string) =>
    new Promise<PushOutcome>((resolve) => {
      const req = client.request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        "apns-topic": env.APPLE_PASS_TYPE_ID,
      });
      let status = 0;
      req.on("response", (headers) => (status = Number(headers[":status"] ?? 0)));
      req.on("error", () => resolve({ token, status: 0 }));
      req.on("close", () => resolve({ token, status }));
      req.setTimeout(10_000, () => req.close());
      req.end("{}");
    });

  try {
    return await Promise.all(tokens.map(send));
  } finally {
    client.close();
  }
}

export interface PassChange {
  /** Nombre del negocio y texto que verá el cliente en la notificación de la app. */
  title: string;
  message: string;
}

/**
 * Avisa de que una tarjeta cambió: a Wallet (push vacío por APNs, el texto sale del campo changeMessage del pase)
 * y a la app del cliente (FCM con el mensaje). Nunca lanza: un fallo de push no debe deshacer un sello,
 * el pase igual se actualiza la próxima vez que Wallet o la app consulten.
 */
export async function notifyPassUpdated(serial: string, change?: PassChange): Promise<void> {
  await Promise.allSettled([notifyWallet(serial), notifyApp(serial, change)]).then((results) => {
    for (const r of results) if (r.status === "rejected") console.error("[push] falló un canal", r.reason);
  });
}

async function notifyWallet(serial: string): Promise<void> {
  const db = await dbPromise;
  const { pass, deviceRegistration } = schema;
  const rows = await db
    .select({ token: deviceRegistration.pushToken, id: deviceRegistration.id })
    .from(deviceRegistration)
    .innerJoin(pass, eq(pass.id, deviceRegistration.passId))
    .where(eq(pass.serial, serial));
  if (rows.length === 0) return;

  if (walletMode !== "signed") {
    console.info(`[wallet] vista previa: ${rows.length} push(es) omitidos para ${serial.slice(0, 6)}…`);
    return;
  }

  const outcomes = await sendWalletPushes(rows.map((r) => r.token));
  // 410 = Apple dice que el dispositivo ya no tiene el pase: lo olvidamos.
  const gone = outcomes.filter((o) => o.status === 410).map((o) => o.token);
  if (gone.length > 0) {
    const ids = rows.filter((r) => gone.includes(r.token)).map((r) => r.id);
    await db.delete(deviceRegistration).where(inArray(deviceRegistration.id, ids));
  }
  const failed = outcomes.filter((o) => o.status !== 200 && o.status !== 410);
  if (failed.length > 0)
    console.warn(
      `[wallet] APNs falló en ${failed.length} dispositivo(s)`,
      failed.map((f) => f.status),
    );
}

async function notifyApp(serial: string, change?: PassChange): Promise<void> {
  if (!fcmEnabled || !change) return;
  const db = await dbPromise;
  const { pass, pushDevice } = schema;
  const rows = await db
    .select({ id: pushDevice.id, token: pushDevice.token })
    .from(pushDevice)
    .innerJoin(pass, eq(pass.customerId, pushDevice.customerId))
    .where(eq(pass.serial, serial));

  for (const row of rows) {
    const result = await sendFcm(row.token, change.title, change.message, { serial });
    if (result === "unregistered") await db.delete(pushDevice).where(eq(pushDevice.id, row.id));
  }
}
