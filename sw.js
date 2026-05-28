// ─── SERVICE WORKER FOR ARO PLUS APP ───
// เมื่ออัปเดตโค้ด ให้เปลี่ยน CACHE_NAME (เช่น v1.0.3) เพื่อให้แอปแจ้งเตือนอัปเดต
const CACHE_NAME = 'aro-plus-cache-v1.0.3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './manifest.webmanifest',
  './images/logo.png',
  './icon/facebook.png',
  './icon/youtube-official.png',
  './icon/youtube-channel.png',
  './icon/line.png',
  './icon/tiktok.png',
  './icon/shopee.png',
  './icon/lazada.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[ARO PLUS SW] cache.addAll partial fail:', err);
        return Promise.allSettled(ASSETS_TO_CACHE.map(url => cache.add(url).catch(() => null)));
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      const networkFetch = fetch(req).then(res => {
        if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);

      if (cached) {
        networkFetch.catch(() => {});
        return cached;
      }
      return networkFetch.catch(() => {
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
