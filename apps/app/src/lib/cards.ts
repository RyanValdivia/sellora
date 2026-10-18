import type { CardActionResponse, CardDto } from "@sellora/shared/api/contracts";
import { api } from "./api";

export const fetchCard = (serial: string) =>
  api<{ card: CardDto }>(`/api/passes/${encodeURIComponent(serial)}`).then((r) => r.card);

export const stampCard = (serial: string) =>
  api<CardActionResponse>(`/api/passes/${encodeURIComponent(serial)}/stamp`, { method: "POST" });

export const redeemCard = (serial: string) =>
  api<CardActionResponse>(`/api/passes/${encodeURIComponent(serial)}/redeem`, { method: "POST" });
