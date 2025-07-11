
const CACHE_NAME = 'runica-cache-v4'; // Incremented version to ensure old cache is cleared

// The install event is now focused on ensuring the new service worker activates quickly.
self.addEventListener('install', event => {
  // self.skipWaiting() forces the waiting service worker to become the
  // active service worker. This is useful for getting the latest updates
  // to the user faster.
  self.skipWaiting();
});

// The fetch event handler remains the same. It uses a cache-first, then network
// strategy with dynamic caching. This is robust for an app with hashed assets.
self.addEventListener('fetch', event => {
  // This service worker uses a cache-first strategy with dynamic caching.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response.
            // We cache successful same-origin requests and all opaque (cross-origin) requests.
            if(!response || (response.status !== 200 && response.type === 'basic')) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // We only cache GET requests.
                if (event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
    );
});

// The activate event cleans up old caches, which is crucial when a new
// service worker with a new CACHE_NAME is activated.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
