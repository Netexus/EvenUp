/**
 * Service Worker for EvenUp PWA
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'evenup-v1.0.2';

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
    const req = event.request;

    // Only handle GET requests via SW cache
    if (req.method !== 'GET') {
        return; // default network
    }

    const url = new URL(req.url);
    const isSameOrigin = url.origin === self.location.origin;
    const isApi = isSameOrigin && url.pathname.startsWith('/api');

    // Always bypass cache for API calls
    if (isApi) {
        return; // let it go to network
    }

    // Network-first for navigations/HTML to avoid stale pages
    const acceptsHtml = req.headers.get('accept')?.includes('text/html');
    if (req.mode === 'navigate' || acceptsHtml) {
        event.respondWith(
            fetch(req)
                .then(res => {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(()=>{});
                    return res;
                })
                .catch(async () => {
                    const cached = await caches.match(req);
                    return cached || caches.match('/index.html');
                })
        );
        return;
    }

    // Network-first for JS and CSS in development to reflect changes immediately
    if (req.destination === 'script' || req.destination === 'style') {
        event.respondWith(
            fetch(req)
                .then(res => {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(()=>{});
                    return res;
                })
                .catch(async () => {
                    const cached = await caches.match(req);
                    return cached;
                })
        );
        return;
    }

    // For images/fonts/etc: stale-while-revalidate
    event.respondWith(
        caches.match(req).then(cached => {
            const fetchPromise = fetch(req)
                .then(res => {
                    // Only cache valid basic responses
                    if (res && res.status === 200 && (res.type === 'basic' || res.type === 'opaque')) {
                        const resClone = res.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(()=>{});
                    }
                    return res;
                })
                .catch(() => cached); // fall back to cache if offline

            return cached || fetchPromise;
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