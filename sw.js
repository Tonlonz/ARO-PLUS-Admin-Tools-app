// ─── SERVICE WORKER FOR ARO PLUS APP ───
// เมื่อผู้พัฒนาเปลี่ยนโค้ดใหม่ ให้มาแก้ไขเลขเวอร์ชันตรงนี้ (เช่น v1.0.1) ตัวแอปในเครื่องผู้ใช้จะร้องขอการอัปเดตทันที
const CACHE_NAME = 'aro-plus-cache-v1.0.0';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // ทำการดึง Google Fonts มาเก็บไว้ในเครื่องของผู้ใช้ถาวรเพื่อรันออฟไลน์ได้สมบูรณ์แบบ
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap'
];

// ขั้นตอนติดตั้ง Service Worker (ลงไฟล์แคชลงเครื่องครั้งแรก)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ARO PLUS SW] กำลังดาวน์โหลดและบันทึกทรัพยากรลงในเครื่อง...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ขั้นตอนเปิดใช้งานและเคลียร์แคชเก่าเมื่อมีการเปลี่ยน CACHE_NAME เวอร์ชันใหม่
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[ARO PLUS SW] ลบแคชเวอร์ชันเก่าที่หมดอายุ:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ดึงข้อมูลด้วยกลยุทธ์ Stale-While-Revalidate (เปิดเร็วที่สุดผ่านแคชในเครื่อง พร้อมอัปเดตเบื้องหลังหากมีเน็ต)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // ดึงข้อมูลเวอร์ชันล่าสุดจากเน็ตมาบันทึกอัปเดตใส่แคชเงียบๆ เผื่อกรณีมีการแก้ไข
        fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => { /* ออฟไลน์อยู่: ใช้ไฟล์ในแคชเครื่องต่อไปอย่างเสถียร */ });
        
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// คอยฟังคำสั่งข้ามขั้นตอนการรอเมื่อผู้ใช้กดตกลงอัปเดตจากปุ่มบนหน้าเว็บ
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});