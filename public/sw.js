const CACHE = 'aninoir-v1';
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE)));
self.addEventListener('fetch', e => e.respondWith(
  caches.match(e.request).then(r => r || fetch(e.request))
));
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'AniNoir', body: "Today's daily challenge is ready! 🎌" };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'daily-challenge',
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
