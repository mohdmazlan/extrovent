import { CircleMarker, MapContainer, TileLayer, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { parseCoordinate } from '../lib/places';
import type { Place } from '../lib/places';

const FALLBACK_CENTER: [number, number] = [3.139, 101.6869]; // Kuala Lumpur

function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  places?: Place[];
  center?: [number, number];
  zoom?: number;
  onPick?: (lat: number, lng: number) => void;
  picked?: [number, number] | null;
}

export default function PlaceMap({ places = [], center, onPick, picked }: Props) {
  const markers = places
    .map((p) => ({ place: p, pos: parseCoordinate(p.coordinate) }))
    .filter((m) => m.pos !== null);
  const mapCenter = center ?? markers[0]?.pos ?? FALLBACK_CENTER;

  return (
    <MapContainer center={mapCenter} zoom={12} style={{ height: 320, width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map(({ place, pos }) => (
        <CircleMarker key={place.id} center={pos as [number, number]} radius={8}>
          <Tooltip>{place.name ?? `Place #${place.id}`}</Tooltip>
        </CircleMarker>
      ))}
      {picked && (
        <CircleMarker center={picked} radius={8} pathOptions={{ color: 'red' }}>
          <Tooltip>Selected location</Tooltip>
        </CircleMarker>
      )}
      {onPick && <ClickPicker onPick={onPick} />}
    </MapContainer>
  );
}
