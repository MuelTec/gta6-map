import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GAME_CRS, toLatLng, VIEW_BOUNDS, LEONIDA_BOUNDS } from './GameCRS';
import { buildPopupContent } from './popup';
import { subColor, subIconHtml } from '../data/categories';
import type { Marker, MasterId } from '../types';

const BASE = import.meta.env.BASE_URL || './';
// Tiles do map.gtadb.org (tileSet "day") espelhados localmente — nativos até z6.
const TILE_URL = `${BASE}tiles/day/{z}/{z},{y},{x}.jpg`;
const MAP_IMAGE = `${BASE}leonida.webp`;
const TILE_SIZE = 256;
const MIN_ZOOM = 0;
const MAX_ZOOM = 8;
const MAX_NATIVE_ZOOM = 6;

type BaseMode = 'image' | 'tiles';

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
  const baseLayersRef = useRef<{ image: L.ImageOverlay; tiles: L.TileLayer } | null>(null);
  const [base, setBase] = useState<BaseMode>('tiles');
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

    const tileLayer = L.tileLayer(TILE_URL, {
      tileSize: TILE_SIZE,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxNativeZoom: MAX_NATIVE_ZOOM,
      bounds: LEONIDA_BOUNDS,
      attribution:
        'Tiles: <a href="https://map.gtadb.org">map.gtadb.org</a> · ' +
        '<a href="https://github.com/rolux/gtadb.org">GTA VI Mapping Community</a> (CC BY 4.0) · ' +
        'Locais: <a href="https://gta6route.com">gta6route.com</a> (CC BY 4.0)',
      keepBuffer: 2,
    });

    // Imagem única do mapa completo de Leonida (alternativa à camada de tiles)
    const imageLayer = L.imageOverlay(MAP_IMAGE, LEONIDA_BOUNDS, {
      opacity: 1,
      interactive: false,
      attribution:
        'Mapa: <a href="https://gta6route.com">gta6route.com</a> · ' +
        '<a href="https://map.gtadb.org">GTA VI Mapping Community</a> (CC BY 4.0)',
    });

    // Padrão: tiles do gtadb (nítidos até o zoom 6, depois escalados)
    tileLayer.addTo(map);
    baseLayersRef.current = { image: imageLayer, tiles: tileLayer };
    setBase('tiles');

    // enquadra o mapa inteiro de Leonida
    map.fitBounds(LEONIDA_BOUNDS, { animate: false, padding: [12, 12] });

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
      baseLayersRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // --- alterna entre a imagem única do mapa e os tiles de detalhe ---
  useEffect(() => {
    const map = mapRef.current;
    const layers = baseLayersRef.current;
    if (!map || !layers) return;
    const show = base === 'image' ? layers.image : layers.tiles;
    const hide = base === 'image' ? layers.tiles : layers.image;
    if (map.hasLayer(hide)) map.removeLayer(hide);
    if (!map.hasLayer(show)) show.addTo(map);
    // a camada base entra por cima — reaplica os marcadores para ficarem acima
    const markersLayer = layerRef.current;
    if (markersLayer && map.hasLayer(markersLayer)) {
      map.removeLayer(markersLayer);
      markersLayer.addTo(map);
    }
  }, [base]);

  // --- (re)create marker objects when the marker list changes ---
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markersRef.current.clear();

    for (const m of markers) {
      const color = subColor(m.sub, m.master);
      const icon = L.divIcon({
        className: 'g6-marker-wrap',
        html: `<div class="g6-marker" style="--c:${color}">${subIconHtml(m.sub, m.master)}</div>`,
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
          onClick={() => mapRef.current?.fitBounds(LEONIDA_BOUNDS, { animate: true, padding: [12, 12] })}
        >
          ◎
        </button>
        <button
          type="button"
          title="Ver tudo"
          onClick={() => mapRef.current?.fitBounds(LEONIDA_BOUNDS, { animate: true })}
        >
          ⤢
        </button>
        <button
          type="button"
          className={base === 'tiles' ? 'is-active' : ''}
          title={
            base === 'tiles'
              ? 'Tiles do gtadb ativos — toque para ver o mapa ilustrado'
              : 'Mapa ilustrado ativo — toque para ver os tiles do gtadb'
          }
          onClick={() => setBase((b) => (b === 'tiles' ? 'image' : 'tiles'))}
        >
          {base === 'tiles' ? '🛰️' : '🗺️'}
        </button>
      </div>
      <div className="map-credit">
        Projeto de fã · não afiliado à Rockstar / Take-Two
      </div>
    </div>
  );
}
