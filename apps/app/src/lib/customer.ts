import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomerCardDto } from "@sellora/shared/api/contracts";
import { api, json } from "./api";

export function useMyCards() {
  return useQuery({
    queryKey: ["my-cards"],
    queryFn: () => api<{ cards: CustomerCardDto[] }>("/api/customer/cards").then((r) => r.cards),
    // Sin push, las tarjetas se refrescan solas mientras la pantalla está abierta.
    refetchInterval: 15_000,
  });
}

export function useMyCard(serial: string | undefined) {
  return useQuery({
    queryKey: ["my-card", serial],
    enabled: !!serial,
    queryFn: () => api<{ card: CustomerCardDto }>(`/api/customer/cards/${serial}`).then((r) => r.card),
    refetchInterval: 10_000,
  });
}

export function useAddCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      api<{ card: CustomerCardDto }>("/api/customer/cards", { method: "POST", ...json({ slug }) }).then(
        (r) => r.card,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-cards"] }),
  });
}

export function useRenameCard(serial: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (holderName: string) =>
      api<{ card: CustomerCardDto }>(`/api/customer/cards/${serial}`, {
        method: "PATCH",
        ...json({ holderName: holderName.trim() || null }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-card", serial] });
      void qc.invalidateQueries({ queryKey: ["my-cards"] });
    },
  });
}
