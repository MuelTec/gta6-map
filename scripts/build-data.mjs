#!/usr/bin/env node
/**
 * Gera public/data/markers.json a partir de:
 *  - data-source/places.json     (locais do gta6route.com — CC BY 4.0)
 *  - data-source/extra-markers.json (marcadores curados à mão, opcional)
 *
 * Uso: npm run data
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── Categorias originais (gta6route) → nossa categoria principal ──────────────
const MASTER_BY_CAT = {
  guns: 'armas',
  // carros raros e easter eggs (guias com coordenada)
  car: 'carros',
  egg: 'colecionaveis',
  // lojas e serviços
  fence: 'lojas', clothes: 'lojas', shoes: 'lojas', hair: 'lojas',
  tattoos: 'lojas', electronics: 'lojas', store: 'lojas', shop: 'lojas',
  food: 'lojas', bar: 'lojas', club: 'lojas', gas: 'lojas',
  modshop: 'lojas', spray: 'lojas', carwash: 'lojas',
  // transporte
  airport: 'transporte', train: 'transporte', metro: 'transporte',
  bus: 'transporte', marina: 'transporte',
};
const DEFAULT_MASTER = 'outros';

// Nomes exatos de bancos → categoria cofres (cofres dos 8 grandes bancos
// liberados pela missão "That's Where the Money Is")
const BANK_NAMES = new Set(['Fleeca', 'Lombank', 'Riverbank', 'Limit HQ', 'Maze Bank', 'Alpha']);

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const places = readJson(join(root, 'data-source', 'places.json'));
const extraPath = join(root, 'data-source', 'extra-markers.json');
const extra = existsSync(extraPath) ? readJson(extraPath).markers ?? [] : [];
const guidesPath = join(root, 'data-source', 'guides.json');
const guides = existsSync(guidesPath) ? readJson(guidesPath).guides ?? [] : [];

const markers = [];
const seen = new Set();

const add = (m) => {
  if (!m || !m.id || seen.has(m.id)) return;
  if (typeof m.x !== 'number' || typeof m.y !== 'number') return;
  seen.add(m.id);
  markers.push(m);
};

// ── Pontos do gta6route ────────────────────────────────────────────────────────
for (const pt of places.pts) {
  const [rawId, catIdx, x, y, name, district, real] = pt;
  const cat = places.cats[catIdx] ?? 'other';
  const isBank = BANK_NAMES.has(name);
  add({
    id: `g${rawId}`,
    master: isBank ? 'cofres' : MASTER_BY_CAT[cat] ?? DEFAULT_MASTER,
    cat: isBank ? 'cofre' : cat,
    sub: isBank ? 'cofre' : cat,
    name: name || `Local #${rawId}`,
    district: district || '',
    real: real || '',
    x,
    y,
    ...(isBank
      ? { note: 'Cofre de banco — liberado após a missão secundária "That\'s Where the Money Is" (Yasmani). São 8 bancos no total.' }
      : {}),
  });
}

// ── Guias com coordenada (easter eggs + carros raros) ──────────────────────────
for (const g of guides) {
  add({
    id: g.id,
    master: MASTER_BY_CAT[g.cat] ?? 'outros',
    cat: g.cat,
    sub: g.cat,
    name: g.name,
    district: g.area || '',
    real: '',
    x: g.x,
    y: g.y,
    ...(g.exact
      ? {}
      : { note: `Região aproximada (raio ~${g.r} unidades). ${g.sum ?? ''}`.trim() }),
    ...(g.exact && g.sum ? { note: g.sum } : {}),
    ...(g.href ? { source: `https://gta6route.com${g.href}` } : {}),
  });
}

// ── Marcadores curados à mão ──────────────────────────────────────────────────
for (const m of extra) add(m);

const doc = {
  generatedAt: new Date().toISOString(),
  source:
    'Locais: gta6route.com/map-data/places.json (CC BY 4.0) · Mapa-base: GTA VI Mapping Community / gtadb.org (CC BY 4.0)',
  total: markers.length,
  markers,
};

const outDir = join(root, 'public', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'markers.json'), JSON.stringify(doc, null, 1), 'utf8');

// copia o guia de códigos para onde o app lê
const codes = readJson(join(root, 'data-source', 'codes.json'));
writeFileSync(
  join(outDir, 'codes.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), entries: codes.entries }, null, 1),
  'utf8'
);

const byMaster = {};
for (const m of markers) byMaster[m.master] = (byMaster[m.master] ?? 0) + 1;
console.log(`✔ ${markers.length} marcadores gerados em public/data/markers.json`);
console.log('  por categoria:', byMaster);
console.log(`✔ ${codes.entries.length} entradas de códigos em public/data/codes.json`);
