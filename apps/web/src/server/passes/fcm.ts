import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { env } from "../../lib/env";

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export const fcmEnabled = Boolean(env.FCM_SERVICE_ACCOUNT_PATH);

let account: ServiceAccount | undefined;
let cachedToken: { value: string; expiresAt: number } | undefined;

const b64url = (data: string | Buffer) => Buffer.from(data).toString("base64url");

function loadAccount(): ServiceAccount {
  account ??= JSON.parse(readFileSync(env.FCM_SERVICE_ACCOUNT_PATH!, "utf8")) as ServiceAccount;
  return account;
}

/** Token OAuth2 de la cuenta de servicio (JWT firmado con RS256, válido 1 h). Se reutiliza hasta que caduca. */
async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) return cachedToken.value;
  const sa = loadAccount();
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claims))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${b64url(signature)}`,
    }),
  });
  if (!res.ok) throw new Error(`FCM: no se pudo obtener el token (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

export type FcmResult = "sent" | "unregistered" | "failed";

/** Envía una notificación a un token de la app. "unregistered" indica que hay que olvidar ese token. */
export async function sendFcm(
  token: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<FcmResult> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${loadAccount().project_id}/messages:send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { token, notification: { title, body }, data } }),
    },
  );
  if (res.ok) return "sent";
  return res.status === 404 ? "unregistered" : "failed";
}
