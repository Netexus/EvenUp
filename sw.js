const CACHE_NAME = 'evenup-v1.0.0';
const urlsToCache = [
    // '/',
    '/frontend/index.html',
    '/frontend/login.html',
    '/frontend/signup.html',
    '/frontend/balances.html',
    '/frontend/dashboard.html',
    '/frontend/ui.html',
    '/frontend/css/styles.css',
    '/frontend/css/theme.css',
    '/frontend/js/main.js',
    '/frontend/js/auth.js',
    '/frontend/js/balances.js',
    '/frontend/js/expenses.js',
    '/frontend/media/icons/evenup.ico',
    '/frontend/media/evenup.png',
    '/frontend/media/hero_image.jpg',
    // PWA Icons
    '/frontend/media/icons/evenup-192x192.png',
    '/frontend/media/icons/evenup-512x512.png',
    // CDN resources
    'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap'
];

// Install event - Cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('All resources cached');
                return self.skipWaiting(); // Force activate new SW
            })
    );
});

// Activate event - Clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Cache cleanup complete');
            return self.clients.claim(); // Take control of all pages
        })
    );
});

// Fetch event - Serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request).then(fetchResponse => {
                    // Don't cache non-successful responses
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }

                    // Clone the response as it can only be consumed once
                    const responseToCache = fetchResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return fetchResponse;
                });
            })
            .catch(() => {
                // Offline fallback for HTML pages
                if (event.request.destination === 'document') {
                    return caches.match('/frontend/index.html');
                }
            })
    );
});

// Background sync for offline actions (optional)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Handle offline actions when connection is restored
    console.log('Background sync triggered');
}