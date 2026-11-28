/**
 * Gera os ícones do PWA (public/icon-192.png e public/icon-512.png)
 * sem dependências: PNG mínimo (RGBA + zlib) desenhado por pixel.
 *
 * Desenho: fundo em degradê azul-noite + alfinete de localização rosa
 * (mesmo accent do mapa) com ponto branco — reconhecível a qualquer tamanho.
 *
 * Uso: node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- CRC32 (obrigatório para chunks do PNG) ---
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // scanlines com filtro 0 (None)
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- desenho ---
const lerp = (a, b, t) => a + (b - a) * t;

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const S = size / 512; // todo o desenho é pensado para 512 e escalado

  // geometria do alfinete (pensada para 512)
  const cx = 256;
  const cy = 200;
  const r = 110 * S;
  const dot = 44 * S;
  const tipY = 452 * S; // ponta do alfinete

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // amostra 2x2 para antialiasing
      let covPin = 0;
      let covDot = 0;
      for (const [ox, oy] of [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ]) {
        const fx = x + ox;
        const fy = y + oy;
        const dx = fx - cx * S;
        const dy = fy - cy * S;
        // cabeça circular
        let inside = Math.hypot(dx, dy) <= r;
        // corpo em gota até a ponta
        if (!inside && dy > 0 && fy <= tipY) {
          const t = dy / (tipY - cy * S);
          const w = r * Math.pow(1 - t, 1.4);
          if (Math.abs(dx) <= w) inside = true;
        }
        if (inside) covPin++;
        if (Math.hypot(fx - cx * S, fy - (cy - 6) * S) <= dot) covDot++;
      }
      covPin /= 4;
      covDot /= 4;

      // fundo: degradê azul-noite
      const t = y / size;
      let R = lerp(11, 22, t);
      let G = lerp(18, 32, t);
      let B = lerp(32, 58, t);
      let A = 255;

      // alfinete rosa
      R = lerp(R, 255, covPin);
      G = lerp(G, 61, covPin);
      B = lerp(B, 129, covPin);
      // ponto branco
      R = lerp(R, 255, covDot);
      G = lerp(G, 255, covDot);
      B = lerp(B, 255, covDot);

      const i = (y * size + x) * 4;
      px[i] = Math.round(R);
      px[i + 1] = Math.round(G);
      px[i + 2] = Math.round(B);
      px[i + 3] = A;
    }
  }
  return encodePNG(size, size, px);
}

for (const size of [192, 512]) {
  const file = join(ROOT, 'public', `icon-${size}.png`);
  writeFileSync(file, drawIcon(size));
  console.log(`✓ ${file}`);
}
