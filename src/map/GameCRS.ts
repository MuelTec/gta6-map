import L from 'leaflet';

/**
 * CRS do mapa do GTA 6.
 *
 * As coordenadas de jogo (x → leste, y → norte) são usadas como (lng, lat).
 * O mundo tem 32768 unidades centradas em (0,0); a escala 2^zoom / 32 faz com
 * que no zoom 6 existam 2 px por unidade (no zoom 5, 1 px ≈ 1 metro).
 *
 * Tiles no formato "tiles/day/{z}/{z},{y},{x}.jpg" (256 px, do map.gtadb.org),
 * nativos até o zoom 6 (com overzoom depois dele).
 */
export const GAME_CRS = Object.assign({}, L.CRS.Simple, {
  code: 'GTA6',
  transformation: new L.Transformation(1, 16384, -1, 16384),
  scale: (zoom: number) => Math.pow(2, zoom) / 32,
  zoom: (scale: number) => Math.log2(scale * 32),
}) as L.CRS;

/** Mundo completo. */
export const WORLD_BOUNDS = L.latLngBounds([-16384, -16384], [16384, 16384]);

/** Região onde existem tiles nativos (zooms 3–5 cobrem exatamente isso). */
export const TILE_BOUNDS = L.latLngBounds([-8192, -16384], [12288, 4096]);

/** Região de interesse (Vice City, Keys, Port Gellhorn, etc.) — vista inicial. */
export const VIEW_BOUNDS = L.latLngBounds([-12000, -18000], [14000, 6000]);

/**
 * Limites exatos do mapa completo de Leonida (imagem "leonida.webp" e faixa
 * de tiles nativos). A proporção da imagem (1400×1787 = 0.7834) coincide com
 * esta área (14100×18000 = 0.7833), então ela encaixa sem distorção.
 */
export const LEONIDA_BOUNDS = L.latLngBounds([-8400, -10200], [9600, 3900]);

export function toLatLng(x: number, y: number): L.LatLng {
  // x → leste (lng), y → norte (lat)
  return L.latLng(y, x);
}
