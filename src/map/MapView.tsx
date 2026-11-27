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

// --- última vista (zoom/centro restaurados ao abrir) ---
const LS_VIEW = 'gta6:view:v1';
type SavedView = { z: number; lat: number; lng: number };

function loadSavedView(): SavedView | null {
  try {
    const raw = localStorage.getItem(LS_VIEW);
    if (!raw) return null;
    const v = JSON.parse(raw) as SavedView;
    if (!v || typeof v.z !== 'number' || typeof v.lat !== 'number' || typeof v.lng !== 'number') return null;
    if (!Number.isFinite(v.z) || !Number.isFinite(v.lat) || !Number.isFinite(v.lng)) return null;
    if (v.z < MIN_ZOOM || v.z > MAX_ZOOM) return null;
    return v;
  } catch {
    return null;
  }
}

type Props = {
  markers: Marker[];
  query: string;
  activeMasters: Set<MasterId>;
  activeSubs: Set<string> | null;
  hiddenFound: boolean;
  found: Set<string>;
  selectedId: string | null;
  /** senhas deixadas pelo usuário por local */
  customCodes: Record<string, string>;
  /** modo "escolher posição" para adicionar um local */
  picking: boolean;
  onAddClick: () => void;
  onPick: (x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onToggleFound: (id: string) => void;
  onCopy: (text: string) => void;
  onRemove: (id: string) => void;
  onSaveCode: (id: string, code: string) => void;
  onClearCode: (id: string) => void;
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
  customCodes,
  picking,
  onAddClick,
  onPick,
  onSelect,
  onToggleFound,
  onCopy,
  onRemove,
  onSaveCode,
  onClearCode,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const baseLayersRef = useRef<{ image: L.ImageOverlay; tiles: L.TileLayer } | null>(null);
  const [base, setBase] = useState<BaseMode>('tiles');
  const handlersRef = useRef({
    onSelect,
    onToggleFound,
    onCopy,
    onPick,
    onRemove,
    onSaveCode,
    onClearCode,
  });
  handlersRef.current = { onSelect, onToggleFound, onCopy, onPick, onRemove, onSaveCode, onClearCode };
  // estado "vivo" para o conteúdo do popup (avaliado a cada abertura)
  const liveRef = useRef({ found, customCodes });
  liveRef.current = { found, customCodes };

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

    // restaura a última vista do usuário; senão, enquadra Leonida inteira
    const savedView = loadSavedView();
    if (savedView) {
      map.setView(L.latLng(savedView.lat, savedView.lng), savedView.z, { animate: false });
    } else {
      map.fitBounds(LEONIDA_BOUNDS, { animate: false, padding: [12, 12] });
    }

    // persiste a vista (debounce) a cada fim de pan/zoom
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    const saveView = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const c = map.getCenter();
        try {
          localStorage.setItem(LS_VIEW, JSON.stringify({ z: map.getZoom(), lat: c.lat, lng: c.lng }));
        } catch {
          /* localStorage indisponível — sem problema */
        }
      }, 400);
    };
    map.on('moveend', saveView);

    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;
    mapRef.current = map;
    // instância do mapa à mão para depuração (uso pessoal)
    (window as unknown as { __g6?: unknown }).__g6 = { map, tileLayer };

    // Popup action delegation (copy code / toggle found / remove / password)
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
        if (act === 'remove' && id) {
          map.closePopup();
          handlersRef.current.onRemove(id);
        }
        if (act === 'savecode' && id) {
          const input = (root as HTMLElement).querySelector('[data-code-input]') as HTMLInputElement | null;
          const value = (input?.value ?? '').trim();
          if (!value) return;
          handlersRef.current.onSaveCode(id, value);
          map.closePopup();
        }
        if (act === 'clearcode' && id) {
          handlersRef.current.onClearCode(id);
          map.closePopup();
        }
      });
    });

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      map.off('moveend', saveView);
      clearTimeout(saveTimer);
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

  // --- modo "escolher posição" para adicionar um local ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!picking) {
      containerRef.current?.classList.remove('is-picking');
      return;
    }
    containerRef.current?.classList.add('is-picking');
    const onClick = (e: L.LeafletMouseEvent) => {
      // x → lng, y → lat (GameCRS)
      handlersRef.current.onPick(e.latlng.lng, e.latlng.lat);
    };
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
      containerRef.current?.classList.remove('is-picking');
    };
  }, [picking]);

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

      lm.bindPopup(() => buildPopupContent(m, liveRef.current.found.has(m.id), liveRef.current.customCodes[m.id]), {
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
      // refresh popup body so "found" button and password stay in sync
      // (função, não string — para sempre ler o estado vivo ao reabrir)
      if (lm.isPopupOpen()) {
        // (cast: o Leaflet aceita função em runtime, mas o tipo só declara string/HTMLElement)
        lm.setPopupContent((() =>
          buildPopupContent(m, liveRef.current.found.has(m.id), liveRef.current.customCodes[m.id])) as unknown as string);
      }
    }
  }, [markers, query, activeMasters, activeSubs, hiddenFound, found, selectedId]);

  // --- virtualização: esconde marcadores fora do viewport ---
  // Fora da tela não há o que pintar; sem isso, a animação de zoom precisa
  // interpolar transform de 716 elementos e o mapa trava (medido: 23fps → 60fps).
  // Cálculo é matemática pura (latLngToContainerPoint), sem leitura de layout.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const size = map.getSize();
      const pad = 300;
      for (const m of markers) {
        const lm = markersRef.current.get(m.id);
        const el = lm?.getElement();
        if (!lm || !el) continue;
        // marcador com popup aberto nunca é escondido (evita popup órfão)
        if (lm.isPopupOpen()) {
          el.classList.remove('is-offvp');
          continue;
        }
        const p = map.latLngToContainerPoint(lm.getLatLng());
        const off = p.x < -pad || p.y < -pad || p.x > size.x + pad || p.y > size.y + pad;
        el.classList.toggle('is-offvp', off);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    // zoomstart/zoom (fim) cobrem o salto de escala; move cobre o pan.
    // zoomanim é omitido de propósito: durante a animação a posição calculada
    // ainda é a antiga e mudaria errado; o zoom no fim corrige.
    map.on('move zoom zoomstart resize', schedule);
    // rede de segurança síncrona: garante a consistência no fim de qualquer
    // interação (mesmo se um agendamento rAF se perder em transição rápida)
    map.on('zoomend moveend viewreset', update);
    schedule();
    return () => {
      map.off('move zoom zoomstart resize', schedule);
      map.off('zoomend moveend viewreset', update);
      if (raf) cancelAnimationFrame(raf);
      for (const m of markers) {
        markersRef.current.get(m.id)?.getElement()?.classList.remove('is-offvp');
      }
    };
  }, [markers]);

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

  // --- atalhos de zoom (+ / -) — ignorados ao digitar em campos ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
      )
        return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        mapRef.current?.zoomIn(1);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        mapRef.current?.zoomOut(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="map-shell">
      <div ref={containerRef} className="map-el" />
      <div className="map-tools">
        <button type="button" title="Aproximar" onClick={() => zoomBy(1)}>+</button>
        <button type="button" title="Afastar" onClick={() => zoomBy(-1)}>−</button>
        <button
          type="button"
          title="Adicionar um local no mapa (atalho: A)"
          onClick={onAddClick}
        >
          ➕
        </button>
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
