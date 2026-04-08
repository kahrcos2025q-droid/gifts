// Service Worker para Push Notifications - AvknGifts

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'Nova atualização disponível!',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ],
      tag: 'avkngifts-notification',
      renotify: true
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'AvknGifts', options)
    )
  } catch (err) {
    console.error('Error showing notification:', err)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tem uma janela aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      // Se não, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
