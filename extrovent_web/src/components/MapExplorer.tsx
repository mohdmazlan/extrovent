import { useEffect, useState, useCallback } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { ApiError } from '../lib/apiClient';
import { listPlaces, parseCoordinate as parsePlaceCoordinate } from '../lib/places';
import type { Place } from '../lib/places';
import { listEvents } from '../lib/events';
import type { EventItem } from '../lib/events';
import { listActivities, parseCoordinate as parseActivityCoordinate } from '../lib/activities';
import type { Activity } from '../lib/activities';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import styles from './MapExplorer.module.scss';

// leaflet types for cluster — fallback to any to avoid hard dep on markercluster types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletType = any;

const FALLBACK_CENTER: [number, number] = [3.139, 101.6869];
const PLACE_CHIPS = ['Restaurant', 'Gym', 'Mall', 'Hall', 'Others'] as const;
const EVENT_CHIPS = ['Concert', 'Tournament', 'Others'] as const;
const ACTIVITY_CHIPS = ['Hangout', 'Hiking', 'Rafting', 'Fishing', 'Cycling', 'Camping', 'Gaming', 'Racing', 'Others'] as const;

type Mode = 'places' | 'events' | 'activities';

interface Props {
  mode?: Mode;
  selectedCategory?: string;
  onPick?: (lat: number, lng: number) => void;
  picked?: [number, number] | null;
  center?: [number, number] | null;
}

function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function getColorFor(category: string | null | undefined, mode: Mode): string {
  const c = (category ?? '').toLowerCase();
  if (mode === 'places') {
    switch (c) {
      case 'restaurant':
        return '#737BAE';
      case 'gym':
        return '#2C4E64';
      case 'mall':
        return '#A4CCD1';
      case 'hall':
        return '#5a6fa0';
      case 'others':
        return '#8a9cc3';
      default:
        return '#737BAE';
    }
  }
  if (mode === 'events') {
    switch (c) {
      case 'concert':
        return '#737BAE';
      case 'tournament':
        return '#2C4E64';
      case 'others':
        return '#A4CCD1';
      default:
        return '#8a9cc3';
    }
  }
  // activities — slate-blue palette
  switch (c) {
    case 'hangout':
      return '#737BAE';
    case 'hiking':
      return '#5a6fa0';
    case 'rafting':
      return '#2C4E64';
    case 'fishing':
      return '#A4CCD1';
    case 'cycling':
      return '#7a8eb5';
    case 'camping':
      return '#737BAE';
    case 'gaming':
      return '#b8c6d9';
    case 'racing':
      return '#2C4E64';
    case 'others':
      return '#8a9cc3';
    default:
      return '#737BAE';
  }
}

// Minimal cluster wrapper that tries to use leaflet.markercluster
function ClusterWrapper({
  enabled,
  markers,
}: {
  enabled: boolean;
  markers: Array<{ pos: [number, number]; color: string; label: string; onClick: () => void }>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || markers.length === 0) return;

    // @ts-ignore markercluster extends leaflet at runtime
    let group: LeafletType | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const L = await import('leaflet');
        // clustering disabled — use fallback CircleMarkers
        throw new Error('skip cluster');
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyL = L as any;
        if (!anyL.markerClusterGroup) return;
        // @ts-ignore
        group = anyL.markerClusterGroup();
        markers.forEach((m) => {
          // @ts-ignore
          const cm = L.circleMarker(m.pos, {
            radius: 8,
            color: m.color,
            fillColor: m.color,
            fillOpacity: 0.9,
            weight: 2,
          });
          cm.bindTooltip(m.label);
          cm.on('click', m.onClick);
          // @ts-ignore
          group!.addLayer(cm);
        });
        // @ts-ignore
        map.addLayer(group);
      } catch {
        // fallback silently
      }
    })();

    return () => {
      cancelled = true;
      if (group) {
        try {
          // @ts-ignore
          map.removeLayer(group);
        } catch {
          // ignore
        }
      }
    };
  }, [enabled, map, markers]);

  // when clustering is enabled we render nothing declaratively — imperative layer handles it
  if (enabled) return null;
  return null;
}

interface MarkerDatum {
  id: string;
  pos: [number, number];
  label: string;
  category: string | null | undefined;
  to: string;
}

export default function MapExplorer({ mode: modeProp, selectedCategory: selectedCategoryProp, onPick, picked, center }: Props) {
  const navigate = useNavigate();
  const [internalMode, setInternalMode] = useState<Mode>(modeProp ?? 'places');
  const [internalCategory, setInternalCategory] = useState<string>(selectedCategoryProp ?? '');

  // sync props if provided
  useEffect(() => {
    if (modeProp) setInternalMode(modeProp);
  }, [modeProp]);
  useEffect(() => {
    if (selectedCategoryProp !== undefined) setInternalCategory(selectedCategoryProp);
  }, [selectedCategoryProp]);

  const mode: Mode = modeProp ?? internalMode;
  const activeCategory: string = selectedCategoryProp ?? internalCategory;

  const setCategory = useCallback(
    (cat: string) => {
      if (selectedCategoryProp === undefined) {
        setInternalCategory((prev) => (prev === cat ? '' : cat));
      }
    },
    [selectedCategoryProp],
  );

  const setMode = useCallback(
    (m: Mode) => {
      if (modeProp === undefined) setInternalMode(m);
      // reset category when switching mode if uncontrolled
      if (selectedCategoryProp === undefined) setInternalCategory('');
    },
    [modeProp, selectedCategoryProp],
  );

  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clusterReady, setClusterReady] = useState(false);

  // clustering optional — keep disabled until package installed
  // leaflet.markercluster is listed in package.json but not installed in CI; fallback to CircleMarkers
  useEffect(() => {
    setClusterReady(false);
  }, []);

  const chips: readonly string[] = mode === 'places' ? PLACE_CHIPS : mode === 'events' ? EVENT_CHIPS : ACTIVITY_CHIPS;

  // fetch per mode
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        if (mode === 'places') {
          const data = await listPlaces(activeCategory || undefined);
          if (!cancelled) {
            setPlaces(Array.isArray(data) ? data : []);
          }
        } else if (mode === 'events') {
          // listEvents doesn't support category filter — filter client side if needed
          const data = await listEvents();
          if (!cancelled) {
            const arr = Array.isArray(data) ? data : [];
            const filtered = activeCategory
              ? arr.filter((e) => (e.category ?? '').toLowerCase() === activeCategory.toLowerCase())
              : arr;
            setEvents(filtered);
          }
        } else {
          const data = await listActivities(activeCategory || undefined);
          if (!cancelled) {
            setActivities(Array.isArray(data) ? data : []);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load map data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [mode, activeCategory]);

  const markerData: MarkerDatum[] = (() => {
    if (mode === 'places') {
      return places
        .map((p) => {
          const pos = parsePlaceCoordinate(p.coordinate);
          if (!pos) return null;
          return {
            id: `place-${p.id}`,
            pos,
            label: p.name ?? `Place #${p.id}`,
            category: p.category_location,
            to: `/places/${p.id}`,
          } as MarkerDatum;
        })
        .filter((x): x is MarkerDatum => x !== null);
    }
    if (mode === 'activities') {
      return activities
        .map((a) => {
          const pos = parseActivityCoordinate(a.coordinate);
          if (!pos) return null;
          const aid = a.activity_id ?? a.id;
          if (aid === undefined || aid === null) return null;
          const title = a.title ?? a.name ?? `Activity #${aid}`;
          return {
            id: `activity-${aid}`,
            pos,
            label: title,
            category: a.category ?? a.category_activity ?? null,
            to: `/activities/${aid}`,
          } as MarkerDatum;
        })
        .filter((x): x is MarkerDatum => x !== null);
    }
    // events
    return events
      .map((e) => {
        // events may carry coordinate under different keys — try common ones
        const raw = (e as unknown as { coordinate?: string | null; place_coordinate?: string | null; coordinate_place?: string | null }).coordinate
          ?? (e as unknown as { coordinate?: string | null }).coordinate
          ?? null;
        // also support place lookup later — for now skip if missing
        const alt = (e as unknown as Record<string, unknown>).coordinate as string | null | undefined;
        const coordStr = (raw ?? alt ?? null) as string | null | undefined;
        // fallback attempt to parse any coordinate-like field on event
        let pos: [number, number] | null = null;
        if (coordStr) {
          const parts = coordStr.split(',').map((s) => Number(s.trim()));
          if (parts.length === 2 && parts.every(Number.isFinite)) {
            const [lat, lng] = parts as [number, number];
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) pos = [lat, lng];
          }
        }
        // also check if event has explicit place coordinate joined — try generic
        if (!pos) {
          const maybe = (e as unknown as { place_coordinate?: string | null }).place_coordinate;
          if (maybe) {
            const p = parsePlaceCoordinate(maybe);
            if (p) pos = p;
          }
        }
        if (!pos) return null;
        return {
          id: `event-${e.event_id}`,
          pos,
          label: e.title ?? `Event #${e.event_id}`,
          category: e.category,
          to: `/events/${e.event_id}`,
        } as MarkerDatum;
      })
      .filter((x): x is MarkerDatum => x !== null);
  })();

  const mapCenter: [number, number] = center ?? markerData[0]?.pos ?? FALLBACK_CENTER;

  const clusterMarkers = markerData.map((m) => ({
    pos: m.pos,
    color: getColorFor(m.category, mode),
    label: m.label,
    onClick: () => navigate(m.to),
  }));

  const showEmpty = !loading && !error && markerData.length === 0;

  return (
    <div className={styles.wrapper}>
      {/* when uncontrolled show internal mode switcher */}
      {modeProp === undefined && (
        <div className={styles.chipBar} role="tablist" aria-label="Explorer mode">
          {(['places', 'events', 'activities'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`${styles.chip} ${mode === m ? styles.active : ''}`}
              onClick={() => setMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className={styles.chipBar} aria-label="Category filter">
        {chips.map((chip) => {
          const isActive = activeCategory.toLowerCase() === chip.toLowerCase();
          return (
            <button
              key={chip}
              type="button"
              className={`${styles.chip} ${isActive ? styles.active : ''}`}
              onClick={() => setCategory(chip)}
              aria-pressed={isActive}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.mapFrame}>
        <MapContainer center={mapCenter} zoom={12} style={{ height: 420, width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* clustering layer — imperative, only when available */}
          {clusterReady && markerData.length > 0 && <ClusterWrapper enabled={clusterReady} markers={clusterMarkers} />}

          {/* fallback plain CircleMarkers when cluster not ready */}
          {!clusterReady &&
            markerData.map((m) => (
              <CircleMarker
                key={m.id}
                center={m.pos}
                radius={8}
                pathOptions={{ color: getColorFor(m.category, mode), fillColor: getColorFor(m.category, mode), fillOpacity: 0.85 }}
                eventHandlers={{ click: () => navigate(m.to) }}
              >
                <Tooltip>{m.label}</Tooltip>
              </CircleMarker>
            ))}

          {picked && (
            <CircleMarker center={picked} radius={8} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.9 }}>
              <Tooltip>Selected location</Tooltip>
            </CircleMarker>
          )}
          {onPick && <ClickPicker onPick={onPick} />}
          {center && <Recenter center={center} />}
        </MapContainer>

        {loading && (
          <div className={styles.loadingOverlay} aria-busy="true" aria-label="Loading map">
            <div className={styles.skeletonBox}>
              <Skeleton variant="image" />
            </div>
          </div>
        )}

        {showEmpty && (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon={mode === 'places' ? '🗺️' : mode === 'events' ? '⛺' : '🎯'}
              title="No markers found"
              description={
                activeCategory ? `No ${mode} found for "${activeCategory}". Try another category.` : `No ${mode} with locations to display.`
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
