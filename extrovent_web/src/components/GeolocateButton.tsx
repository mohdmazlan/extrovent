import Button from './Button';

interface Props {
  onLocate: (pos: [number, number]) => void;
  onError?: (msg: string) => void;
}

export default function GeolocateButton({ onLocate, onError }: Props) {
  function handleClick() {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocate([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        onError?.(err.message || 'Could not get your location.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick} type="button" aria-label="Use my location">
      📍 Locate me
    </Button>
  );
}
