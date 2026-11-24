/**
 * Atualiza as fontes do gta6route.com:
 *  - data-source/places.json          (locais)
 *  - data-source/gta6route-cats.json  (categorias: nome, cor, ícone SVG)
 * Uso: node scripts/fetch-gta6route.mjs
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const H = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36' };

// ── places.json ───────────────────────────────────────────────────────────────
const cfgHtml = await (await fetch('https://gta6route.com/', { headers: H })).text();
const m = cfgHtml.match(/<script type="application\/json" id="map-config">([\s\S]*?)<\/script>/);
if (!m) throw new Error('map-config não encontrado');
const cfg = JSON.parse(m[1]);

const dataUrl = `https://gta6route.com${cfg.data}`;
const placesRes = await fetch(dataUrl, { headers: H });
if (!placesRes.ok) throw new Error(`places.json HTTP ${placesRes.status}`);
const places = await placesRes.json();

// snapshot anterior para comparação
const oldPath = join(root, 'data-source', 'places.json');
const old = existsSync(oldPath) ? JSON.parse(readFileSync(oldPath, 'utf8')) : null;

writeFileSync(oldPath, JSON.stringify(places), 'utf8');
writeFileSync(
  join(root, 'data-source', 'gta6route-cats.json'),
  JSON.stringify({ source: dataUrl, cats: cfg.cats }, null, 1),
  'utf8',
);

// ── módulo TS com cores + ícones SVG das categorias (marcadores) ──────────────
const catsMap = {};
for (const c of cfg.cats) {
  catsMap[c.id] = { id: c.id, name: c.name ?? c.id, one: c.one ?? c.name ?? c.id, color: c.color ?? '#94a3b8', icon: c.icon ?? '' };
}
const ts = `/* AUTOGERADO por scripts/fetch-gta6route.mjs — não edite à mão.
 * Fonte: gta6route.com (map-config.cats): nome PT-BR, cor e ícone SVG por categoria. */
export interface GtaCat {
  id: string;
  name: string;
  one: string;
  color: string;
  icon: string;
}

export const GTA_CATS: Record<string, GtaCat> = ${JSON.stringify(catsMap, null, 1)};
`;
writeFileSync(join(root, 'src', 'data', 'gtacats.ts'), ts, 'utf8');

console.log(`✔ places.json: ${places.pts.length} locais (antes: ${old?.pts?.length ?? '—'})`);
console.log(`✔ gta6route-cats.json: ${cfg.cats.length} categorias`);
console.log('  ids:', cfg.cats.map((c) => c.id).join(', '));

const oldCats = new Set(old?.cats ?? []);
const newCats = new Set(places.cats);
const added = places.cats.filter((c) => !oldCats.has(c));
const removed = [...oldCats].filter((c) => !newCats.has(c));
if (added.length) console.log('  categorias novas:', added.join(', '));
if (removed.length) console.log('  categorias removidas:', removed.join(', '));
