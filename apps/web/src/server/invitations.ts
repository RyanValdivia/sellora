import { createHash, randomBytes } from "node:crypto";

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const newInvitationToken = () => randomBytes(32).toString("base64url");

/** En la base solo se guarda el hash: un volcado de la tabla no permite aceptar invitaciones. */
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
