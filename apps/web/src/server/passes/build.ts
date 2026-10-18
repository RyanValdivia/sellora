import { PKPass, PassType } from "passkit-generator";
import type { BusinessConfig } from "@sellora/shared/business/config";
import { renderMessage, varsFromCard } from "@sellora/shared/business/messages";
import { encodeCardQr } from "@sellora/shared/business/qr";
import { env } from "../../lib/env";
import { loadCertificates, walletMode, type WalletMode } from "./certificates";
import { staticImages, stripImages } from "./images";

export type PassEvent = "welcome" | "stamp" | "redeem";

export interface PassContext {
  business: { name: string; config: BusinessConfig };
  locations: { label: string; lat: number; lng: number; alertText: string | null }[];
  pass: {
    serial: string;
    authToken: string;
    stamps: number;
    rewardReady: boolean;
    holderName: string | null;
    expiresAt: Date | null;
  };
  /** Qué acaba de pasar: decide el texto del aviso que Wallet muestra al cambiar el pase. */
  event: PassEvent;
}

/** "#FF6B35" → "rgb(255, 107, 53)", el formato que pide pass.json. */
export function hexToRgb(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

const MESSAGE_FOR_EVENT = {
  welcome: "welcome",
  stamp: "stampAdded",
  redeem: "redeemed",
} as const;

/** Texto del cambio de estado. Cuando la tarjeta se completa, ese mensaje tiene prioridad. */
export function messageFor(ctx: PassContext): string {
  const { config } = ctx.business;
  const key = ctx.event === "stamp" && ctx.pass.rewardReady ? "rewardReady" : MESSAGE_FOR_EVENT[ctx.event];
  return renderMessage(config.messages[key], cardVars(ctx));
}

function cardVars(ctx: PassContext) {
  const { config, name } = ctx.business;
  return varsFromCard({
    stamps: ctx.pass.stamps,
    stampsRequired: config.rules.stampsRequired,
    reward: config.rules.reward,
    businessName: name,
    holderName: ctx.pass.holderName,
  });
}

export interface BuiltPass {
  buffer: Buffer;
  mode: WalletMode;
}

/** Genera el .pkpass (storeCard) de una tarjeta con su estado actual. */
export async function buildPkpass(ctx: PassContext): Promise<BuiltPass> {
  const { config, name } = ctx.business;
  const { design } = { design: config.passDesign };
  const total = config.rules.stampsRequired;
  const vars = cardVars(ctx);

  const pass = new PKPass(
    { ...staticImages(), ...stripImages(design, total, Math.min(ctx.pass.stamps, total)) },
    await loadCertificates(),
    {
      formatVersion: 1,
      passTypeIdentifier: env.APPLE_PASS_TYPE_ID,
      teamIdentifier: env.APPLE_TEAM_ID,
      organizationName: name,
      description: `Tarjeta de sellos de ${name}`,
      serialNumber: ctx.pass.serial,
      logoText: name,
      backgroundColor: hexToRgb(design.backgroundColor),
      foregroundColor: hexToRgb(design.foregroundColor),
      labelColor: hexToRgb(design.labelColor),
      // Wallet llama a este servicio para registrarse y bajar las actualizaciones (PassKit web service v1).
      webServiceURL: `${env.APP_URL}/api/wallet`,
      authenticationToken: ctx.pass.authToken,
      ...(ctx.pass.expiresAt ? { expirationDate: ctx.pass.expiresAt } : {}),
    },
  );

  const card = new PassType("storeCard");
  card.headerFields.push({
    key: "stamps",
    label: "SELLOS",
    value: `${Math.min(ctx.pass.stamps, total)}/${total}`,
  });
  card.secondaryFields.push({ key: "reward", label: "PREMIO", value: config.rules.reward });
  card.auxiliaryFields.push({
    key: "status",
    label: "ESTADO",
    value: ctx.pass.rewardReady ? "¡Premio listo!" : `Te faltan ${vars.sellos_faltantes}`,
  });
  // Wallet muestra el changeMessage en la pantalla de bloqueo cuando este valor cambia.
  card.backFields.push(
    { key: "lastMessage", label: "ÚLTIMO MENSAJE", value: messageFor(ctx), changeMessage: "%@" },
    {
      key: "howItWorks",
      label: "CÓMO FUNCIONA",
      value: `Junta ${total} sellos y llévate: ${config.rules.reward}. Muestra este código en caja en cada visita.`,
    },
    {
      key: "privacy",
      label: "AVISOS CERCA DEL LOCAL",
      value:
        "Tu celular compara tu posición con la del local por su cuenta; nunca la recibimos. Para apagarlos, abre ••• y desactiva “Sugerir en pantalla bloqueada”.",
    },
  );
  if (config.identity.phone) {
    card.backFields.push({
      key: "phone",
      label: "TELÉFONO",
      value: config.identity.phone,
      dataDetectorTypes: ["PKDataDetectorTypePhoneNumber"],
    });
  }
  pass.types.push(card);

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: encodeCardQr(ctx.pass.serial),
    messageEncoding: "iso-8859-1",
    altText: ctx.pass.serial.slice(0, 8).toUpperCase(),
  });

  // Hasta 10 ubicaciones; el texto aparece en la pantalla de bloqueo cuando el celular está cerca.
  const nearby = renderMessage(config.messages.nearby, vars);
  if (ctx.locations.length > 0) {
    pass.setLocations(
      ...ctx.locations.slice(0, 10).map((l) => ({
        latitude: l.lat,
        longitude: l.lng,
        relevantText: l.alertText ? renderMessage(l.alertText, vars) : nearby,
      })),
    );
  }

  return { buffer: pass.getAsBuffer(), mode: walletMode };
}
