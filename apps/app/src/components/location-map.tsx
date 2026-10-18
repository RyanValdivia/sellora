import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";

// Los iconos por defecto de Leaflet se rompen con los bundlers; usamos un marcador propio en SVG.
const pin = L.divIcon({
  className: "",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  html: `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16 0C7.2 0 0 7 0 15.6 0 27 16 40 16 40s16-13 16-24.4C32 7 24.8 0 16 0z" fill="#FF6B35" stroke="#2A1740" stroke-width="2"/><circle cx="16" cy="15" r="5.5" fill="#FFF6EA"/></svg>`,
});

interface Props {
  center: { lat: number; lng: number };
  onPick(point: { lat: number; lng: number }): void;
  height?: string;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }, [lat, lng, map]);
  return null;
}

function ClickToPick({ onPick }: Pick<Props, "onPick">) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Mapa OpenStreetMap con un punto que se ajusta tocando. Atribución obligatoria por la licencia ODbL. */
export function LocationMap({ center, onPick, height = "16rem" }: Props) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={16}
      style={{ height }}
      className="z-0 w-full rounded-2xl border border-border"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[center.lat, center.lng]} icon={pin} />
      <Recenter lat={center.lat} lng={center.lng} />
      <ClickToPick onPick={onPick} />
    </MapContainer>
  );
}
