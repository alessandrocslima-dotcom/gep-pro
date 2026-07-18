/* ═══════════════════════════════════════════
   GEP — Gestão de Eventos Pro
   sw.js — Service Worker
   ═══════════════════════════════════════════ */

const VERSAO    = 'gep-v2-001';
const CACHE     = 'gep-cache-' + VERSAO;

const ARQUIVOS = [
  './',
  './index.html',
  './css/styles.css',
  './js/utils.js',
  './js/firebase.js',
  './js/auth.js',
  './js/nav.js',
  './manifest.json'
];

/* Instalação — cachear arquivos */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

/* Ativação — remover caches antigos */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Requisições — cache first para assets, network first para HTML */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Ignorar Firebase e APIs externas
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('google') ||
      url.hostname.includes('fonts')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

/* Notificar clientes sobre nova versão */
self.addEventListener('message', e => {
  if (e.data === 'CHECK_VERSION') {
    e.source.postMessage({ type: 'VERSION', version: VERSAO });
  }
});
