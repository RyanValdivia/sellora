/**
 * Prueba de humo de punta a punta contra un servidor en marcha (pnpm dev) con la base sembrada:
 * alta del pase, registro del dispositivo como Wallet, sellos, canje y actualización.
 * Uso: node apps/web/scripts/smoke-flow.mjs   (necesita "unzip" en el PATH)
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const H = process.env.API_URL ?? "http://localhost:3000";
const ok = (cond, label, extra = "") => console.log(`${cond ? "OK  " : "FAIL"} ${label} ${extra}`);

async function login(email) {
  const r = await fetch(`${H}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
    body: JSON.stringify({ email, password: "sellora-dev-123" }),
  });
  return r.headers.get("set-auth-token");
}
const j = (token, body) => ({
  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

const owner = await login("alba@sellora.test");
const other = await login("otro@sellora.test");

// Config permisiva para poder sellar varias veces en la prueba
const { businesses } = await (await fetch(`${H}/api/business`, j(owner))).json();
const bid = businesses.find((b) => b.slug === "panaderia-alba").id;
const { config } = await (await fetch(`${H}/api/business/${bid}/config`, j(owner))).json();
const original = JSON.parse(JSON.stringify(config));
config.rules.maxStampsPerDay = 10;
config.rules.stampsRequired = 3;
await fetch(`${H}/api/business/${bid}/config`, { method: "PUT", ...j(owner, config) });

// 1. Descargar pase (crea la tarjeta)
const res = await fetch(`${H}/api/b/panaderia-alba/pkpass`);
const buf = Buffer.from(await res.arrayBuffer());
const dir = mkdtempSync(path.join(tmpdir(), "pk-"));
writeFileSync(path.join(dir, "p.zip"), buf);
const passJson = JSON.parse(execFileSync("unzip", ["-p", path.join(dir, "p.zip"), "pass.json"]).toString());
const serial = passJson.serialNumber;
const authToken = passJson.authenticationToken;
ok(res.status === 200 && serial?.length >= 16, "pkpass descargado", serial);

// 2. Registro del dispositivo como lo haría Wallet
const dev = "device-abc123";
const base = `${H}/api/wallet/v1/devices/${dev}/registrations/pass.app.sellora.dev`;
let r = await fetch(`${base}/${serial}`, {
  method: "POST",
  ...j(null, { pushToken: "aabbcc" }),
  headers: { "Content-Type": "application/json", Authorization: "ApplePass wrong" },
});
ok(r.status === 401, "registro con token malo -> 401");
r = await fetch(`${base}/${serial}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `ApplePass ${authToken}` },
  body: JSON.stringify({ pushToken: "aabbcc" }),
});
ok(r.status === 201, "registro con token bueno -> 201", String(r.status));
r = await fetch(`${base}/${serial}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `ApplePass ${authToken}` },
  body: JSON.stringify({ pushToken: "aabbcc" }),
});
ok(r.status === 200, "registro repetido -> 200");

// 3. Sin cambios todavía
r = await fetch(`${base}?passesUpdatedSince=${Date.now() + 1000}`);
ok(r.status === 204, "sin cambios -> 204", String(r.status));

// 4. Caja: seguridad
r = await fetch(`${H}/api/passes/${serial}`);
ok(r.status === 401, "caja sin sesión -> 401");
r = await fetch(`${H}/api/passes/${serial}`, j(other));
ok(r.status === 404, "caja de otro negocio -> 404 (no revela que existe)");
r = await fetch(`${H}/api/passes/${"x".repeat(24)}`, j(owner));
ok(r.status === 404, "serial inexistente -> 404");

// 5. Sellar
r = await fetch(`${H}/api/passes/${serial}`, j(owner));
let card = (await r.json()).card;
ok(card.stamps === 0 && card.stampsRequired === 3, "tarjeta nueva 0/3");
const t0 = Date.now();
for (let i = 1; i <= 2; i++) {
  r = await fetch(`${H}/api/passes/${serial}/stamp`, { method: "POST", ...j(owner) });
  const b = await r.json();
  ok(r.status === 200 && b.card.stamps === i && !b.completed, `sello ${i}`, b.message);
}
r = await fetch(`${H}/api/passes/${serial}/stamp`, { method: "POST", ...j(owner) });
let b = await r.json();
ok(r.status === 200 && b.completed && b.card.rewardReady, "sello 3 completa la tarjeta", b.message);
r = await fetch(`${H}/api/passes/${serial}/stamp`, { method: "POST", ...j(owner) });
b = await r.json();
ok(
  r.status === 409 && b.error.code === "reward_pending",
  "sellar con premio pendiente -> 409",
  b.error?.message,
);

// 6. Wallet ve el cambio y baja el pase nuevo
r = await fetch(`${base}?passesUpdatedSince=${t0 - 1000}`);
b = await r.json();
ok(r.status === 200 && b.serialNumbers.includes(serial), "Wallet detecta el cambio", JSON.stringify(b));
const tag = b.lastUpdated;
r = await fetch(`${base}?passesUpdatedSince=${tag}`);
ok(r.status === 204, "con la etiqueta nueva ya no hay cambios -> 204");
r = await fetch(`${H}/api/wallet/v1/passes/pass.app.sellora.dev/${serial}`, {
  headers: { Authorization: `ApplePass ${authToken}` },
});
const lastMod = r.headers.get("last-modified");
const buf2 = Buffer.from(await r.arrayBuffer());
writeFileSync(path.join(dir, "p2.zip"), buf2);
const pass2 = JSON.parse(execFileSync("unzip", ["-p", path.join(dir, "p2.zip"), "pass.json"]).toString());
ok(
  r.status === 200 && pass2.storeCard.headerFields[0].value === "3/3",
  "pase actualizado muestra 3/3",
  pass2.storeCard.backFields[0].value,
);
r = await fetch(`${H}/api/wallet/v1/passes/pass.app.sellora.dev/${serial}`, {
  headers: { Authorization: `ApplePass ${authToken}`, "If-Modified-Since": lastMod },
});
ok(r.status === 304, "If-Modified-Since -> 304");
r = await fetch(`${H}/api/wallet/v1/passes/pass.app.sellora.dev/${serial}`, {
  headers: { Authorization: "ApplePass nope" },
});
ok(r.status === 401, "descarga con token malo -> 401");

// 7. Canjear
r = await fetch(`${H}/api/passes/${serial}/redeem`, { method: "POST", ...j(owner) });
b = await r.json();
ok(r.status === 200 && b.card.stamps === 0 && b.card.redemptions === 1, "canje reinicia sellos", b.message);
r = await fetch(`${H}/api/passes/${serial}/redeem`, { method: "POST", ...j(owner) });
b = await r.json();
ok(r.status === 409 && b.error.code === "reward_not_ready", "canjear sin premio -> 409", b.error?.message);

// 8. Baja del dispositivo
r = await fetch(`${base}/${serial}`, {
  method: "DELETE",
  headers: { Authorization: `ApplePass ${authToken}` },
});
ok(r.status === 200, "baja del dispositivo");
r = await fetch(`${base}?passesUpdatedSince=0`);
ok(r.status === 204, "dispositivo ya no tiene pases registrados");

// restaurar config
await fetch(`${H}/api/business/${bid}/config`, { method: "PUT", ...j(owner, original) });

// 9. Cliente nativo sin Origin pero con una cookie vieja (Android): debe poder iniciar sesión.
//    Un navegador de otro sitio (Origin ajeno) sigue bloqueado por CSRF.
//    Se usa node:http porque fetch añade cabeceras Sec-Fetch-* que el cliente HTTP de Android no envía.
const { request: httpRequest } = await import("node:http");
const signIn = (extra) =>
  new Promise((resolve, reject) => {
    const req = httpRequest(
      new URL(`${H}/api/auth/sign-in/email`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "better-auth.session_token=vieja", ...extra },
      },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode));
      },
    );
    req.on("error", reject);
    req.end(JSON.stringify({ email: "alba@sellora.test", password: "sellora-dev-123" }));
  });
ok((await signIn({})) === 200, "app nativa (sin Origin, cookie vieja) inicia sesión");
ok(
  (await signIn({ Origin: "http://evil.example" })) === 403,
  "Origen ajeno con cookie sigue bloqueado (CSRF)",
);
