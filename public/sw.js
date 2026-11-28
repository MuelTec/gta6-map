/* Service worker do Mapa GTA VI (PWA offline).
 *
 * Estratégia:
 * - Instalação: pré-cache do shell (index), dados, mapa-base e ícones.
 * - Navegação: rede primeiro, com fallback para o index em cache (offline).
 * - Tiles, imagens e assets com hash: cache primeiro (visitas ficam guardadas).
 * - Dados (markers/codes.json): cache primeiro + revalidação em segundo plano.
 * - Cache antigo é removido na ativação (VERSION muda a cada deploy).
 */
const VERSION = 'gta6-v2';
const CACHE = `gta6-map-${VERSION}`;

const PRECACHE = ['./', './leonida.webp', './data/markers.json', './data/codes.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) {
    const c = await caches.open(CACHE);
    c.put(request, res.clone());
  }
  return res;
}

/** Cache primeiro, mas atualiza o cache em segundo plano (dados que mudam com deploys). */
async function cacheThenRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async (res) => {
      if (res.ok) {
        const c = await caches.open(CACHE);
        c.put(request, res.clone());
      }
      return res;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

async function networkFirstNavigation(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const c = await caches.open(CACHE);
      c.put('./', res.clone());
      return res;
    }
    // resposta não-OK (ex.: proxy devolvendo 502 com o servidor fora):
    // cai para o shell em cache, que é o que o offline precisa
    const shell = await caches.match('./');
    if (shell) return shell;
    return res;
  } catch {
    const shell = await caches.match('./');
    if (shell) return shell;
    throw new Error('offline e sem shell em cache');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  // dados: atualizam com o deploy — cache + revalidação
  if (url.pathname.endsWith('.json')) {
    event.respondWith(cacheThenRevalidate(request));
    return;
  }
  // tiles, imagens, js/css: imutáveis por URL (hash) ou mudam raramente
  event.respondWith(cacheFirst(request));
});
