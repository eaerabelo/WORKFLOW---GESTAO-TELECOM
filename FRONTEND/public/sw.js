// Service Worker Oficial — WorkFlow Gestão Telecom (PWA & Notificações Nativas Desktop/Mobile)
const SW_VERSION = 'workflow-pwa-v2.6.0';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escuta mensagens da aplicação React para disparar notificações nativas no Windows / Android / iOS / macOS
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NATIVE_NOTIFICATION') {
    const { title, body, tag, data } = event.data.payload || {};
    if (!title) return;

    const options = {
      body: body || '',
      icon: '/logo_WF.png',
      badge: '/logo_WF.png',
      tag: tag || `wf-notif-${Date.now()}`,
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: data || { url: '/' }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Ao clicar na notificação do sistema operacional (PC ou Celular), foca ou abre o App WorkFlow
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
