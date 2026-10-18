import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BusinessSummary, LocationDto, LocationInput } from "@sellora/shared/api/contracts";
import type { BusinessConfig } from "@sellora/shared/business/config";
import { api, json } from "./api";

export function useBusinesses() {
  return useQuery({
    queryKey: ["businesses"],
    queryFn: () => api<{ businesses: BusinessSummary[] }>("/api/business").then((r) => r.businesses),
  });
}

/** Negocio activo: por ahora el primero de la lista. */
export function useActiveBusiness() {
  const q = useBusinesses();
  return { ...q, business: q.data?.[0] };
}

export function useConfig(businessId: string | undefined) {
  return useQuery({
    queryKey: ["config", businessId],
    enabled: !!businessId,
    queryFn: () =>
      api<{ config: BusinessConfig; role: "owner" | "staff" }>(`/api/business/${businessId}/config`),
  });
}

export function useSaveConfig(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: BusinessConfig) =>
      api<{ config: BusinessConfig }>(`/api/business/${businessId}/config`, {
        method: "PUT",
        ...json(config),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["config", businessId] });
      void qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}

export function useCreateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api<{ business: BusinessSummary }>("/api/business", { method: "POST", ...json({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["businesses"] }),
  });
}

export function useLocations(businessId: string | undefined) {
  return useQuery({
    queryKey: ["locations", businessId],
    enabled: !!businessId,
    queryFn: () =>
      api<{ locations: LocationDto[] }>(`/api/business/${businessId}/locations`).then((r) => r.locations),
  });
}

export function useAddLocation(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LocationInput) =>
      api<{ location: LocationDto }>(`/api/business/${businessId}/locations`, {
        method: "POST",
        ...json(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations", businessId] }),
  });
}

export function useDeleteLocation(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/business/${businessId}/locations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations", businessId] }),
  });
}
