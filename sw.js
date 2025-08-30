/**
 * Service Worker for EvenUp PWA
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'evenup-v1.0.1';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/signup.html',
    '/profile.html',
    '/dashboard.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/pwa.js',
    '/media/icons/evenup.ico',
    '/media/evenup.png',
    '/media/hero_image.jpg',
    '/media/icons/evenup-192x192.png',
    '/media/icons/evenup-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap'
];

// ========================================
// INSTALL EVENT
// ========================================

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('All resources cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Cache installation failed:', error);
            })
    );
});

// ========================================
// ACTIVATE EVENT
// ========================================

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
            return self.clients.claim();
        })
    );
});

// ========================================
// FETCH EVENT
// ========================================

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then(fetchResponse => {
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }

                    const responseToCache = fetchResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return fetchResponse;
                });
            })
            .catch(() => {
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// ========================================
// BACKGROUND SYNC
// ========================================

self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    console.log('Background sync triggered');
    // Handle offline actions when connection is restored
}