const CACHE_NAME = 'runica-cache-v7';

// On install, activate immediately
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

// On activation, clean up old caches and take control of open clients.
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            )
        ).then(() => self.clients.claim())
    );
});

// Use a "Stale-While-Revalidate" strategy for all GET requests.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                // Fetch from network in the background to update the cache.
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // We clone the response because it's a stream and can only be consumed once.
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });

                // Return the cached response immediately if available,
                // otherwise wait for the network response.
                return cachedResponse || fetchPromise;
            });
        })
    );
});
