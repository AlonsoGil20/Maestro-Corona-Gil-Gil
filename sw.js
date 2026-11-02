/* Service worker: guarda la app para que funcione sin internet.
   Con internet siempre trae la versión más nueva (así nunca se mezclan archivos viejos y nuevos);
   sin internet usa lo guardado. Sube VERSION al publicar cambios. */
const VERSION = 'maestro-corona-v7';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/layout.js',
  './js/staff.js',
  './js/solfeo.js',
  './js/music.js',
  './js/audio.js',
  './js/app.js',
  './js/install.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  // cache: 'reload' evita guardar copias viejas que el navegador tenga en su memoria
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    try {
      const res = await fetch(e.request, { cache: 'no-cache' });
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      return cached || Response.error();
    }
  }));
});
