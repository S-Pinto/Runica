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
    
    const url = new URL(event.request.url);

    // IMPORTANT: Do not cache API requests to Firebase or other dynamic services.
    // Always fetch them from the network.
    if (url.hostname.includes('googleapis.com')) {
        // Respond with a network request and do not cache it.
        return;
    }

    // For other requests (your app's assets: HTML, CSS, JS, images),
    // use the Stale-While-Revalidate strategy.
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                // Fetch from network in the background to update the cache.
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // Check if we received a valid response before caching
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });

                // Return the cached response immediately if available,
                // otherwise wait for the network response.
                return cachedResponse || fetchPromise;
            });
        })
    );
});
