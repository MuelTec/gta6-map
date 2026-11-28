import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GAME_CRS, toLatLng, VIEW_BOUNDS, LEONIDA_BOUNDS } from './GameCRS';
import { buildPopupContent } from './popup';
import { nearestNeighborOrder, pathDistance, fmtMeters, type Pt } from './route';
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
  /** modo seleção em lote (clique seleciona em vez de abrir o popup) */
  selectMode: boolean;
  selectedIds: Set<string>;
  onAddClick: () => void;
  onPick: (x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onToggleSelect: (id: string) => void;
  onSelectMany: (ids: string[]) => void;
  onClearSelection: () => void;
  onMarkSelected: (mark: boolean) => void;
  onExitSelect: () => void;
  favorites: Set<string>;
  notes: Record<string, string>;
  onToggleFavorite: (id: string) => void;
  onSaveNote: (id: string, text: string) => void;
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
  selectMode,
  selectedIds,
  onAddClick,
  onPick,
  onSelect,
  onToggleSelect,
  onSelectMany,
  onClearSelection,
  onMarkSelected,
  onExitSelect,
  favorites,
  notes,
  onToggleFavorite,
  onSaveNote,
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
  // --- coordenadas e medidor de distância ---
  const [measuring, setMeasuring] = useState(false);
  const [measurePts, setMeasurePts] = useState<Array<{ x: number; y: number }>>([]);
  const [rectArm, setRectArm] = useState(false);
  const [jumpVal, setJumpVal] = useState('');
  const coordRef = useRef<HTMLSpanElement>(null);
  /** última coordenada exibida, no formato "x, y" (pronto para copiar/colar) */
  const lastCoordRef = useRef('');
  const handlersRef = useRef({
    onSelect,
    onToggleSelect,
    selectMode,
    onToggleFound,
    onToggleFavorite,
    onSaveNote,
    onCopy,
    onPick,
    onRemove,
    onSaveCode,
    onClearCode,
  });
  handlersRef.current = {
    onSelect,
    onToggleSelect,
    selectMode,
    onToggleFound,
    onToggleFavorite,
    onSaveNote,
    onCopy,
    onPick,
    onRemove,
    onSaveCode,
    onClearCode,
  };
  // estado "vivo" para o conteúdo do popup (avaliado a cada abertura)
  const liveRef = useRef({ found, customCodes, favorites, notes });
  liveRef.current = { found, customCodes, favorites, notes };

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
        if (act === 'fav' && id) {
          handlersRef.current.onToggleFavorite(id);
        }
        if (act === 'savenote' && id) {
          const ta = (root as HTMLElement).querySelector('[data-note-input]') as HTMLTextAreaElement | null;
          handlersRef.current.onSaveNote(id, ta?.value ?? '');
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

      lm.bindPopup(
        () =>
          buildPopupContent(
            m,
            liveRef.current.found.has(m.id),
            liveRef.current.customCodes[m.id],
            liveRef.current.favorites.has(m.id),
            liveRef.current.notes[m.id],
          ),
        {
          maxWidth: 320,
          minWidth: 240,
          closeButton: true,
          autoPanPadding: [30, 30],
        },
      );

      lm.on('click', () => {
        if (handlersRef.current.selectMode) {
          // modo seleção: alterna a seleção e fecha o popup que o Leaflet
          // abriu no mesmo tick (sem chegar a ser pintado)
          handlersRef.current.onToggleSelect(m.id);
          mapRef.current?.closePopup();
          return;
        }
        handlersRef.current.onSelect(m.id);
      });
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
          dot.classList.toggle('is-picked', selectedIds.has(m.id));
          dot.classList.toggle('is-fav', favorites.has(m.id));
        }
      }
      if (!visible && lm.isPopupOpen()) lm.closePopup();
      // refresh popup body so "found" button and password stay in sync
      // (função, não string — para sempre ler o estado vivo ao reabrir)
      if (lm.isPopupOpen()) {
        // (cast: o Leaflet aceita função em runtime, mas o tipo só declara string/HTMLElement)
        lm.setPopupContent((() =>
          buildPopupContent(
            m,
            liveRef.current.found.has(m.id),
            liveRef.current.customCodes[m.id],
            liveRef.current.favorites.has(m.id),
            liveRef.current.notes[m.id],
          )) as unknown as string);
      }
    }
  }, [markers, query, activeMasters, activeSubs, hiddenFound, found, selectedId, selectedIds, favorites]);

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

  // --- leitura de coordenadas do cursor (escreve direto no DOM, sem re-render) ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const show = (x: number, y: number) => {
      const xi = Math.round(x);
      const yi = Math.round(y);
      lastCoordRef.current = `${xi}, ${yi}`;
      if (coordRef.current) coordRef.current.textContent = `X ${xi} · Y ${yi}`;
    };
    const onMove = (e: L.LeafletMouseEvent) => show(e.latlng.lng, e.latlng.lat);
    const onOut = () => {
      const c = map.getCenter();
      show(c.lng, c.lat);
    };
    map.on('mousemove', onMove);
    map.on('mouseout', onOut);
    onOut();
    return () => {
      map.off('mousemove', onMove);
      map.off('mouseout', onOut);
    };
  }, []);

  // --- modo medir: cada clique no mapa adiciona um ponto ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (picking) {
      // escolher posição para adicionar local tem prioridade
      setMeasuring(false);
      setMeasurePts([]);
      return;
    }
    if (!measuring) return;
    const onClick = (e: L.LeafletMouseEvent) => {
      setMeasurePts((prev) => [...prev, { x: e.latlng.lng, y: e.latlng.lat }]);
    };
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [measuring, picking]);

  // --- desenha a linha e os vértices do medidor ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !measuring || measurePts.length === 0) return;
    const latlngs = measurePts.map((p) => toLatLng(p.x, p.y));
    const line = L.polyline(latlngs, { color: '#22d3ee', weight: 3, dashArray: '6 6' });
    const dots = measurePts.map((p) =>
      L.circleMarker(toLatLng(p.x, p.y), {
        radius: 5,
        color: '#fff',
        weight: 2,
        fillColor: '#22d3ee',
        fillOpacity: 1,
      }),
    );
    line.addTo(map);
    for (const d of dots) d.addTo(map);
    return () => {
      map.removeLayer(line);
      for (const d of dots) map.removeLayer(d);
    };
  }, [measuring, measurePts]);

  // --- Esc sai do modo medir (captura: não deixa o Esc global fechar outras camadas) ---
  useEffect(() => {
    if (!measuring) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setMeasuring(false);
        setMeasurePts([]);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [measuring]);

  // --- Esc cancela a seleção por retângulo (mantém o modo seleção ativo) ---
  useEffect(() => {
    if (!rectArm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setRectArm(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [rectArm]);

  // --- rota: liga os locais selecionados (ordem do vizinho mais próximo a partir do centro) ---
  const routePoints = useMemo(() => {
    const pts: Pt[] = [];
    for (const m of markers) if (selectedIds.has(m.id)) pts.push({ x: m.x, y: m.y });
    return pts;
  }, [markers, selectedIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || routePoints.length < 2) return;
    const c = map.getCenter();
    const order = nearestNeighborOrder(routePoints, { x: c.lng, y: c.lat });
    const line = L.polyline(
      order.map((i) => toLatLng(routePoints[i].x, routePoints[i].y)),
      { color: '#ff3d81', weight: 3, opacity: 0.9 },
    );
    line.addTo(map);
    return () => {
      map.removeLayer(line);
    };
  }, [routePoints]);

  const routeInfo = useMemo(() => {
    if (routePoints.length < 2) return null;
    const c = mapRef.current?.getCenter();
    const order = nearestNeighborOrder(routePoints, c ? { x: c.lng, y: c.lat } : routePoints[0]);
    const ordered = order.map((i) => routePoints[i]);
    return { n: routePoints.length, d: fmtMeters(pathDistance(ordered)) };
  }, [routePoints]);

  // --- seleção por retângulo: um arraste seleciona uma área inteira ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !rectArm) return;
    map.dragging.disable();
    let startPt: L.Point | null = null;
    let rect: L.Rectangle | null = null;
    const bounds = (a: L.Point, b: L.Point) =>
      L.latLngBounds(
        map.containerPointToLatLng(L.point(Math.min(a.x, b.x), Math.min(a.y, b.y))),
        map.containerPointToLatLng(L.point(Math.max(a.x, b.x), Math.max(a.y, b.y))),
      );
    const finish = (b: L.Point) => {
      const a = startPt;
      if (rect) {
        map.removeLayer(rect);
        rect = null;
      }
      startPt = null;
      // um retângulo por vez — volta a permitir pan em seguida
      setRectArm(false);
      if (!a) return;
      // clique puro (sem arrastar) não seleciona nada
      if (Math.abs(a.x - b.x) < 6 && Math.abs(a.y - b.y) < 6) return;
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      const ids: string[] = [];
      for (const m of markers) {
        if (!markerVisible(m, query, activeMasters, activeSubs, hiddenFound, found)) continue;
        const lm = markersRef.current.get(m.id);
        if (!lm) continue;
        const p = map.latLngToContainerPoint(lm.getLatLng());
        if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) ids.push(m.id);
      }
      if (ids.length) onSelectMany(ids);
    };
    const onDown = (e: L.LeafletMouseEvent) => {
      // clicar num marcador não inicia retângulo
      if ((e.originalEvent.target as HTMLElement | null)?.closest?.('.leaflet-marker-icon')) return;
      startPt = e.containerPoint.clone();
      rect = L.rectangle(bounds(startPt, startPt), {
        color: '#22d3ee',
        weight: 2,
        dashArray: '4 4',
        fillColor: '#22d3ee',
        fillOpacity: 0.08,
      }).addTo(map);
    };
    const onMove = (e: L.LeafletMouseEvent) => {
      if (!startPt || !rect) return;
      rect.setBounds(bounds(startPt, e.containerPoint));
    };
    const onUp = (e: L.LeafletMouseEvent) => finish(e.containerPoint);
    const onWinUp = (ev: MouseEvent) => {
      if (startPt) finish(map.mouseEventToContainerPoint(ev));
    };
    map.on('mousedown', onDown);
    map.on('mousemove', onMove);
    map.on('mouseup', onUp);
    window.addEventListener('mouseup', onWinUp);
    return () => {
      map.off('mousedown', onDown);
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
      window.removeEventListener('mouseup', onWinUp);
      if (rect) map.removeLayer(rect);
      map.dragging.enable();
    };
  }, [rectArm, markers, query, activeMasters, activeSubs, hiddenFound, found, onSelectMany]);

  // distância total (unidade de jogo ≈ metro — ver GameCRS.ts)
  const measureTotal = useMemo(() => {
    let t = 0;
    for (let i = 1; i < measurePts.length; i++) {
      t += Math.hypot(measurePts[i].x - measurePts[i - 1].x, measurePts[i].y - measurePts[i - 1].y);
    }
    return t;
  }, [measurePts]);

  const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);

  const toggleMeasure = () => {
    setMeasuring((v) => {
      if (v) setMeasurePts([]);
      return !v;
    });
  };

  const onJump = (e: FormEvent) => {
    e.preventDefault();
    const m = jumpVal.match(/^\s*(-?\d+(?:[.,]\d+)?)\s*[,; ]\s*(-?\d+(?:[.,]\d+)?)\s*$/);
    if (!m) return;
    const x = parseFloat(m[1].replace(',', '.'));
    const y = parseFloat(m[2].replace(',', '.'));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const map = mapRef.current;
    if (!map) return;
    map.setView(toLatLng(x, y), Math.max(map.getZoom(), 6), { animate: true });
    setJumpVal('');
  };

  // --- próximo alvo / sorteio: locais não achados que passam nos filtros ---
  const targetPool = (onlyNew: boolean): Marker[] => {
    const pool = markers.filter((m) =>
      markerVisible(m, query, activeMasters, activeSubs, hiddenFound, found) &&
      (!onlyNew || !found.has(m.id)),
    );
    if (pool.length || !onlyNew) return pool;
    return targetPool(false);
  };

  const focusOn = (m: Marker) => {
    onSelect(m.id);
    mapRef.current?.panTo(toLatLng(m.x, m.y), { animate: true, duration: 0.45 });
    markersRef.current.get(m.id)?.openPopup();
  };

  const goNearest = () => {
    const map = mapRef.current;
    const pool = targetPool(true);
    if (!map || !pool.length) return;
    const c = map.getCenter();
    let best = pool[0];
    let bestD = Infinity;
    for (const m of pool) {
      const d = Math.hypot(m.x - c.lng, m.y - c.lat);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    focusOn(best);
  };

  const goRandom = () => {
    const pool = targetPool(true);
    if (!pool.length) return;
    focusOn(pool[Math.floor(Math.random() * pool.length)]);
  };

  // --- seleção em lote: seleciona todos os locais que passam nos filtros ---
  const selectVisibleNow = () => {
    const ids: string[] = [];
    for (const m of markers) {
      if (markerVisible(m, query, activeMasters, activeSubs, hiddenFound, found)) ids.push(m.id);
    }
    onSelectMany(ids);
  };

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
          title="Ir para o local não achado mais próximo do centro"
          onClick={goNearest}
        >
          🎯
        </button>
        <button
          type="button"
          title="Sortear um local não achado (respeita os filtros)"
          onClick={goRandom}
        >
          🎲
        </button>
        <button
          type="button"
          className={measuring ? 'is-active' : ''}
          title="Medir distância — clique no mapa para adicionar pontos"
          onClick={toggleMeasure}
        >
          📐
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
      {selectMode && (
        <div className="select-bar">
          <span className="select-count">
            ☑ <strong>{selectedIds.size}</strong> selecionado(s)
            {routeInfo && (
              <>
                {' '}
                · rota {routeInfo.n} locais · <strong>{routeInfo.d}</strong>
              </>
            )}
          </span>
          <button type="button" title="Arraste no mapa para selecionar uma área" onClick={() => setRectArm(true)}>
            ▭ Área
          </button>
          <button type="button" title="Selecionar todos os locais visíveis (respeita os filtros)" onClick={selectVisibleNow}>
            Filtrados
          </button>
          <button
            type="button"
            className="select-primary"
            disabled={selectedIds.size === 0}
            onClick={() => onMarkSelected(true)}
          >
            ✓ Marcar
          </button>
          <button type="button" disabled={selectedIds.size === 0} onClick={() => onMarkSelected(false)}>
            ✗ Desmarcar
          </button>
          <button type="button" disabled={selectedIds.size === 0} onClick={onClearSelection}>
            Limpar
          </button>
          <button type="button" onClick={onExitSelect}>
            Sair
          </button>
        </div>
      )}
      {rectArm && (
        <div className="select-hint">Arraste no mapa para selecionar os locais da área · Esc cancela</div>
      )}
      {measuring && (
        <div className="measure-chip">
          <span>
            📐 {measurePts.length} {measurePts.length === 1 ? 'ponto' : 'pontos'} ·{' '}
            <strong>{fmtDist(measureTotal)}</strong>
          </span>
          <button type="button" onClick={() => setMeasurePts([])} disabled={measurePts.length === 0}>
            Limpar
          </button>
          <button
            type="button"
            onClick={() => {
              setMeasuring(false);
              setMeasurePts([]);
            }}
          >
            Sair
          </button>
        </div>
      )}
      <div className="coord-panel">
        <button
          type="button"
          className="coord-readout"
          title="Copiar coordenadas (x, y)"
          onClick={() => onCopy(lastCoordRef.current)}
        >
          📍 <span ref={coordRef}>—</span>
        </button>
        <form className="coord-jump" onSubmit={onJump}>
          <input
            value={jumpVal}
            onChange={(e) => setJumpVal(e.target.value)}
            placeholder="ir para: x, y"
            aria-label="Ir para coordenada"
          />
          <button type="submit">Ir</button>
        </form>
      </div>
      <div className="map-credit">
        Projeto de fã · não afiliado à Rockstar / Take-Two
      </div>
    </div>
  );
}
