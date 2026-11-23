import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GAME_CRS, toLatLng, VIEW_BOUNDS } from './GameCRS';
import { buildPopupContent } from './popup';
import { MASTER_META } from '../data/categories';
import type { Marker, MasterId } from '../types';

const TILE_URL = `${import.meta.env.BASE_URL || './'}tiles/yanis,6/{z}/{z},{y},{x}.jpg`;
const TILE_SIZE = 1024;
const MIN_ZOOM = 0;
const MAX_ZOOM = 9;
const MAX_NATIVE_ZOOM = 5;

type Props = {
  markers: Marker[];
  query: string;
  activeMasters: Set<MasterId>;
  activeSubs: Set<string> | null;
  hiddenFound: boolean;
  found: Set<string>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onToggleFound: (id: string) => void;
  onCopy: (text: string) => void;
};

function markerVisible(
  m: Marker,
  query: string,
  activeMasters: Set<MasterId>,
  activeSubs: Set<string> | null,
  hiddenFound: boolean,
  found: Set<string>,
): boolean {
  if (hiddenFound && found.has(m.id)) return false;
  if (!activeMasters.has(m.master)) return false;
  if (activeSubs && !activeSubs.has(m.sub)) return false;
  if (query) {
    const hay = `${m.name} ${m.district} ${m.sub} ${m.master} ${m.code ?? ''}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

export default function MapView({
  markers,
  query,
  activeMasters,
  activeSubs,
  hiddenFound,
  found,
  selectedId,
  onSelect,
  onToggleFound,
  onCopy,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const handlersRef = useRef({ onSelect, onToggleFound, onCopy });
  handlersRef.current = { onSelect, onToggleFound, onCopy };

  // --- init map once ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      crs: GAME_CRS,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: false,
      attributionControl: true,
      maxBounds: VIEW_BOUNDS,
      maxBoundsViscosity: 0.6,
      wheelPxPerZoomLevel: 120,
    });

    L.tileLayer(TILE_URL, {
      tileSize: TILE_SIZE,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxNativeZoom: MAX_NATIVE_ZOOM,
      bounds: VIEW_BOUNDS,
      attribution:
        'Tiles: <a href="https://gta6map.github.io">gta6map</a> · Locais: ' +
        '<a href="https://gta6route.com">gta6route.com</a> (CC BY 4.0)',
      keepBuffer: 2,
    }).addTo(map);

    map.setView(toLatLng(0, 0), 4, { animate: false });

    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;
    mapRef.current = map;

    // Popup action delegation (copy code / toggle found)
    map.on('popupopen', (e) => {
      const root = (e.popup as L.Popup).getElement()?.querySelector('.leaflet-popup-content');
      if (!root) return;

      root.addEventListener('click', (ev) => {
        const btn = (ev.target as HTMLElement).closest('[data-act]');
        if (!btn) return;
        const act = (btn as HTMLElement).dataset.act;
        const id = (btn as HTMLElement).dataset.id;
        const code = (btn as HTMLElement).dataset.code;
        if (act === 'copy' && code) handlersRef.current.onCopy(code);
        if (act === 'found' && id) handlersRef.current.onToggleFound(id);
      });
    });

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // --- (re)create marker objects when the marker list changes ---
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markersRef.current.clear();

    for (const m of markers) {
      const meta = MASTER_META[m.master];
      const color = meta?.color ?? '#888';
      const icon = L.divIcon({
        className: 'g6-marker-wrap',
        html: `<div class="g6-marker" style="--c:${color}"><span>${meta?.emoji ?? '📍'}</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const lm = L.marker(toLatLng(m.x, m.y), {
        icon,
        title: m.name,
        riseOnHover: true,
        keyboard: true,
      });

      lm.bindPopup(() => buildPopupContent(m, found.has(m.id)), {
        maxWidth: 320,
        minWidth: 240,
        closeButton: true,
        autoPanPadding: [30, 30],
      });

      lm.on('click', () => handlersRef.current.onSelect(m.id));
      lm.addTo(layer);
      markersRef.current.set(m.id, lm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  // --- update visibility / found styling without rebuilding ---
  useEffect(() => {
    for (const m of markers) {
      const lm = markersRef.current.get(m.id);
      if (!lm) continue;
      const visible = markerVisible(m, query, activeMasters, activeSubs, hiddenFound, found);
      const el = lm.getElement();
      if (el) {
        el.style.display = visible ? '' : 'none';
        const dot = el.querySelector('.g6-marker');
        if (dot) {
          dot.classList.toggle('is-found', found.has(m.id));
          dot.classList.toggle('is-sel', selectedId === m.id);
        }
      }
      if (!visible && lm.isPopupOpen()) lm.closePopup();
      // refresh popup body so "found" button label stays in sync
      if (lm.isPopupOpen()) lm.setPopupContent(buildPopupContent(m, found.has(m.id)));
    }
  }, [markers, query, activeMasters, activeSubs, hiddenFound, found, selectedId]);

  // --- focus selected marker ---
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const lm = markersRef.current.get(selectedId);
    const m = markers.find((x) => x.id === selectedId);
    if (!lm || !m) return;
    mapRef.current.panTo(toLatLng(m.x, m.y), { animate: true, duration: 0.4 });
    lm.openPopup();
  }, [selectedId, markers]);

  const zoomBy = (d: number) => mapRef.current?.zoomIn(d) ?? mapRef.current?.zoomOut(-d);

  return (
    <div className="map-shell">
      <div ref={containerRef} className="map-el" />
      <div className="map-tools">
        <button type="button" title="Aproximar" onClick={() => zoomBy(1)}>+</button>
        <button type="button" title="Afastar" onClick={() => zoomBy(-1)}>−</button>
        <button
          type="button"
          title="Centralizar em Leonida"
          onClick={() => mapRef.current?.setView(toLatLng(0, 0), 4, { animate: true })}
        >
          ◎
        </button>
        <button
          type="button"
          title="Ver tudo"
          onClick={() => mapRef.current?.fitBounds(VIEW_BOUNDS, { animate: true })}
        >
          ⤢
        </button>
      </div>
      <div className="map-credit">
        Projeto de fã · não afiliado à Rockstar / Take-Two
      </div>
    </div>
  );
}
