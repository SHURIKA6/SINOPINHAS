const CACHE_NAME = 'sinopinhas-v1';
const ASSETS = [
    '/',
    '/manifest.json',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((response) => {
                // Cache valid responses for static assets only
                if (response.status === 200 && url.pathname.includes('/_next/')) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            });
        }).catch(() => {
            if (event.request.mode === 'navigate') return caches.match('/');
            return null;
        })
    );
});

self.addEventListener('push', (event) => {
    let data = { title: 'SINOPINHAS', body: 'Você tem uma nova atualização!' };

    // Se vier com payload (criptografado), tenta ler
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    // Promessa para garantir que o SW não morra antes de mostrar a notificação
    const promiseChain = Promise.resolve().then(async () => {
        // Se não houver dados específicos (push vazio para economizar bateria/cpu/complexidade)
        // O SW poderia buscar do servidor aqui, mas vamos usar o que temos ou o padrão
        return self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: data.url || '/',
            vibrate: [100, 50, 100],
            tag: 'sinopinhas-notif',
            renotify: true
        });
    });

    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data || '/')
    );
});
