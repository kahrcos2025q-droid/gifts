// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'Abrir site' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  try {
    const data = event.data ? JSON.parse(event.data.text()) : {};
    if (data.title) {
      event.waitUntil(
        self.registration.showNotification(data.title, {
          ...options,
          body: data.body || options.body,
          icon: data.icon || options.icon
        })
      );
    } else {
      event.waitUntil(
        self.registration.showNotification('Avakin Gifts', options)
      );
    }
  } catch (e) {
    event.waitUntil(
      self.registration.showNotification('Avakin Gifts', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
