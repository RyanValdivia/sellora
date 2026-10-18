export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

interface NominatimRow {
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Búsqueda de direcciones con Nominatim (OpenStreetMap), limitada a Perú.
 * Política de uso: máx. 1 petición por segundo y sin autocompletado automático;
 * por eso la búsqueda se lanza solo al pulsar el botón. https://operations.osmfoundation.org/policies/nominatim/
 */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    countrycodes: "pe",
    limit: "5",
    "accept-language": "es",
  }).toString();
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("No pudimos buscar la dirección. Inténtalo de nuevo en unos segundos.");
  const rows = (await res.json()) as NominatimRow[];
  return rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
}
