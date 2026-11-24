// Service Worker Oficial — WorkFlow Gestão Telecom
// Suporte para instalação PWA (Desktop, Android e iOS/iPhone) e Notificações Nativas em Segundo Plano

const CACHE_NAME = 'workflow-pwa-v3';
const PENDING_NOTIFS_QUEUE = [];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Função central para exibir notificação nativa do sistema operacional em 1º ou 2º plano
const showNativeOsNotification = (data = {}) => {
  const title = data.title || 'WorkFlow — Gestão Telecom';
  const options = {
    body: data.body || 'Você tem uma nova atualização no sistema.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || `wf-notif-${Date.now()}`,
    renotify: true,
    requireInteraction: Boolean(data.requireInteraction),
    vibrate: [200, 100, 200],
    silent: false,
    data: {
      url: data.url || '/',
      targetTab: data.targetTab || null
    }
  };
  return self.registration.showNotification(title, options);
};

// Recebe solicitações da aplicação para disparar notificações nativas e manter segundo plano ativo
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, url, targetTab, requireInteraction } = event.data.payload || {};
    event.waitUntil(
      showNativeOsNotification({ title, body, tag, url, targetTab, requireInteraction })
    );
  }

  if (event.data.type === 'QUEUE_BACKGROUND_NOTIFICATION') {
    const payload = event.data.payload || {};
    PENDING_NOTIFS_QUEUE.push(payload);
    event.waitUntil(showNativeOsNotification(payload));
  }

  if (event.data.type === 'KEEP_ALIVE_PING') {
    // Mantém o Service Worker acordado enquanto o sistema estiver com janela aberta ou em segundo plano
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: 'KEEP_ALIVE_PONG', timestamp: Date.now() });
    }
  }
});

// Suporte a Web Push API (para alertas mesmo com a aba minimizada ou no iOS 16.4+ / Android / Desktop)
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {
      title: 'WorkFlow — Gestão Telecom',
      body: event.data ? event.data.text() : 'Novo alerta importante no sistema WorkFlow.'
    };
  }
  event.waitUntil(showNativeOsNotification(payload));
});

// Suporte a Background Sync e Periodic Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'workflow-bg-sync') {
    event.waitUntil(
      (async () => {
        while (PENDING_NOTIFS_QUEUE.length > 0) {
          const next = PENDING_NOTIFS_QUEUE.shift();
          await showNativeOsNotification(next);
        }
      })()
    );
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'workflow-periodic-check') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'BACKGROUND_CHECK_UR_AND_ALERTS', timestamp: Date.now() });
        });
      })
    );
  }
});

// Ao clicar na notificação do Windows / macOS / Android / iOS, foca a aba ou abre o sistema
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  const targetTab = event.notification.data && event.notification.data.targetTab;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (targetTab) {
            client.postMessage({ type: 'NAVIGATE_TO_TAB', tab: targetTab });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
