/**
 * Baixa os tiles do tileSet "day" do map.gtadb.org para public/tiles/day/.
 * Uso: node scripts/download-day-tiles.mjs
 * Reenvia Referer do gtadb (anti-hotlink). Pulou arquivos já existentes.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'tiles', 'day');

// Limites do mapa de Leonida (mesmos do LEONIDA_BOUNDS no GameCRS.ts)
const X0 = -10200, X1 = 3900, Y0 = -8400, Y1 = 9600;
const Z_FROM = 0, Z_TO = 6;
const V = 6; // versão de jogo no gtadb
const CONCURRENCY = 32;

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  referer: 'https://map.gtadb.org/',
  accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

function tilesForZoom(z) {
  const mppx = Math.pow(2, z) / 32; // pixels por unidade de jogo (idêntico ao gtadb)
  const tx0 = Math.floor(((X0 + 16384) * mppx) / 256);
  const tx1 = Math.floor(((X1 + 16384) * mppx) / 256);
  const ty0 = Math.floor(((16384 - Y1) * mppx) / 256);
  const ty1 = Math.floor(((16384 - Y0) * mppx) / 256);
  const list = [];
  for (let y = ty0; y <= ty1; y++) {
    for (let x = tx0; x <= tx1; x++) list.push([z, y, x]);
  }
  return list;
}

const jobs = [];
for (let z = Z_FROM; z <= Z_TO; z++) jobs.push(...tilesForZoom(z));

let done = 0, downloaded = 0, skipped = 0, missing = 0, failed = 0, bytes = 0;
const errors = [];
const t0 = Date.now();

async function fetchTile([z, y, x], attempt = 0) {
  const url = `https://maps.gtadb.org/tiles/${V}/day/${z}/${z},${y},${x}.jpg`;
  const rel = join(String(z), `${z},${y},${x}.jpg`);
  const dest = join(OUT, rel);

  if (existsSync(dest)) {
    skipped++;
    done++;
    return;
  }

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 200) {
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, buf);
      downloaded++;
      bytes += buf.length;
    } else if (res.status === 404) {
      missing++;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    if (errors.length < 20) {
      errors.push(`${z},${y},${x}: ${e.message} | cause: ${e.cause?.code || e.cause?.message || '-'}`);
      if (errors.length <= 3) console.log('ERRO:', errors[errors.length - 1]);
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      return fetchTile([z, y, x], attempt + 1);
    }
    failed++;
  }
  done++;
  if (done % 1000 === 0) {
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`${done}/${jobs.length} (${((100 * done) / jobs.length).toFixed(0)}%) · baixados ${downloaded} · pulados ${skipped} · 404 ${missing} · falhas ${failed} · ${(bytes / 1e6).toFixed(1)} MB · ${secs}s`);
  }
}

// fila de trabalhadores
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++];
    await fetchTile(job);
  }
}

console.log(`Total de tiles a verificar: ${jobs.length} (z${Z_FROM}..z${Z_TO})`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\nConcluído em ${secs}s`);
console.log(`  baixados: ${downloaded} (${(bytes / 1e6).toFixed(1)} MB)`);
console.log(`  já existentes: ${skipped}`);
console.log(`  sem tile (404): ${missing}`);
console.log(`  falhas: ${failed}`);
if (errors.length) console.log('  erros:', errors.join('\n    '));
