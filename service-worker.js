const CACHE_NAME = 'runica-cache-v6';

self.addEventListener('install', (event) => {
    // This forces the waiting service worker to become the active service worker.
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete all caches that aren't in the whitelist
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            )
        // This claims all open clients, allowing the new service worker to control them immediately.
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // We only process GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    // For navigation requests (loading the HTML page), we use a network-first strategy.
    // This ensures the user always gets the most up-to-date app shell.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // If the fetch is successful, we cache a clone of the response.
                    // This is crucial so that if the user goes offline later, they still
                    // have a working version of the app.
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // If the network request fails (e.g., user is offline),
                    // we try to serve the page from the cache.
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For all other requests (JS, CSS, fonts, images), we use a cache-first strategy.
    // This is faster as it serves assets from the local cache immediately if available.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // If the resource is in the cache, return it.
            if (cachedResponse) {
                return cachedResponse;
            }

            // If it's not in the cache, fetch it from the network.
            return fetch(event.request).then((networkResponse) => {
                // We clone the response and store it in the cache for next time.
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            });
        })
    );
});
