const CACHE_NAME = 'olprog-v4';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/iconk.png'
];

// Устанавливаем кэш
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кэшируем файлы...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.warn('⚠️ Ошибка кэширования:', err))
  );
  self.skipWaiting();
});

// Отдаём из кэша или из сети
self.addEventListener('fetch', event => {
  // Пропускаем запросы к Supabase и внешним API
  if (event.request.url.includes('supabase') || 
      event.request.url.includes('telegram') ||
      event.request.url.includes('cdnjs') ||
      event.request.url.includes('jsdelivr')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match('/');
      })
  );
});

// Обновляем кэш при новой версии
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});