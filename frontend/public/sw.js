// Minimal Service Worker for PWA compliance
self.addEventListener('install', (event) => {
    console.log('SW installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('SW activated');
});

self.addEventListener('fetch', (event) => {
    // Basic fetch handler (bypass for now to avoid caching issues during dev)
    event.respondWith(fetch(event.request));
});
