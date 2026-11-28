/**
 * Utilitários puros de rota (coordenadas de jogo em unidades ≈ metros — ver GameCRS.ts).
 */

export interface Pt {
  x: number;
  y: number;
}

/** Distância euclidiana entre dois pontos, em metros. */
export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Comprimento total do caminho que visita os pontos na ordem dada. */
export function pathDistance(points: Pt[]): number {
  let t = 0;
  for (let i = 1; i < points.length; i++) t += dist(points[i - 1], points[i]);
  return t;
}

/**
 * Reordena os pontos pelo vizinho mais próximo partindo de `start`
 * (guloso: sempre o mais próximo do ponto atual). Retorna os índices
 * da ordenação — não muta a lista original.
 */
export function nearestNeighborOrder(points: Pt[], start: Pt): number[] {
  const rest = points.map((_, i) => i);
  const order: number[] = [];
  let cur = start;
  while (rest.length) {
    let bestAt = 0;
    let bestD = Infinity;
    for (let k = 0; k < rest.length; k++) {
      const d = dist(cur, points[rest[k]]);
      if (d < bestD) {
        bestD = d;
        bestAt = k;
      }
    }
    const idx = rest.splice(bestAt, 1)[0];
    order.push(idx);
    cur = points[idx];
  }
  return order;
}

/** Formata metros como "123 m" ou "12.34 km". */
export function fmtMeters(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}
