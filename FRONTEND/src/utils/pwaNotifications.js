// Utilitário de PWA (Instalação Desktop, Android e iOS/iPhone) + Notificações em Segundo Plano

let swRegistration = null;
let bgKeepAliveInterval = null;

// Detecta se o usuário está em um dispositivo iOS / iPhone / iPad
export const isIosDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
  const isIpadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isAppleMobile || isIpadOs;
};

// Detecta se o aplicativo já está rodando instalado em modo Standalone (Tela de Início / App)
export const isRunningStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.navigator.standalone === true
  );
};

// Inicia o canal de segundo plano entre a janela aberta/minimizada e o Service Worker
const startBackgroundKeepAlive = (registration) => {
  if (typeof window === 'undefined') return;
  if (bgKeepAliveInterval) clearInterval(bgKeepAliveInterval);

  const sendKeepAlive = () => {
    const activeWorker = registration?.active || navigator.serviceWorker?.controller;
    if (activeWorker) {
      activeWorker.postMessage({
        type: 'KEEP_ALIVE_PING',
        visibility: document.visibilityState,
        timestamp: Date.now()
      });
    }
  };

  // Mantém batimento cardíaco a cada 25 segundos para que o Service Worker processe notificações em 2º plano
  bgKeepAliveInterval = setInterval(sendKeepAlive, 25000);

  document.addEventListener('visibilitychange', () => {
    sendKeepAlive();
  });
};

// Solicita permissões de execução e sincronização em segundo plano (Background Sync / Periodic Sync)
export const requestBackgroundExecutionPermission = async (registrationParam) => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const reg = registrationParam || swRegistration || (await navigator.serviceWorker?.ready.catch(() => null));
  if (!reg) return false;

  try {
    if ('permissions' in navigator && navigator.permissions?.query) {
      try {
        await navigator.permissions.query({ name: 'notifications' });
      } catch (e) {}
      try {
        await navigator.permissions.query({ name: 'periodic-background-sync' });
      } catch (e) {}
      try {
        await navigator.permissions.query({ name: 'background-sync' });
      } catch (e) {}
    }

    if ('periodicSync' in reg && reg.periodicSync?.register) {
      try {
        await reg.periodicSync.register('workflow-periodic-check', {
          minInterval: 15 * 60 * 1000 // 15 minutos
        });
      } catch (e) {}
    }

    if ('sync' in reg && reg.sync?.register) {
      try {
        await reg.sync.register('workflow-bg-sync');
      } catch (e) {}
    }

    startBackgroundKeepAlive(reg);
    localStorage.setItem('wf_bg_permission_granted', 'true');
    return true;
  } catch (err) {
    return false;
  }
};

export const registerWorkflowServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = registration;
    startBackgroundKeepAlive(registration);

    if (getNativeNotificationPermission() === 'granted') {
      requestBackgroundExecutionPermission(registration);
    }
    return registration;
  } catch (err) {
    console.warn('Falha ao registrar Service Worker:', err);
    return null;
  }
};

export const getNativeNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

export const requestNativeNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      await requestBackgroundExecutionPermission();
    }
    return result;
  } catch (err) {
    return Notification.permission;
  }
};

/**
 * Dispara uma notificação nativa no Windows / Android / iOS / macOS em 1º ou 2º plano.
 * Garante que cada ID de notificação só dispare alerta nativo 1 vez por dispositivo (a menos que force=true).
 */
export const dispatchNativeNotification = async (notif, force = false) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  if (!notif || !notif.id) return false;

  const sentKey = 'wf_native_notifs_sent';
  let sentIds = [];
  if (!force) {
    try {
      sentIds = JSON.parse(localStorage.getItem(sentKey) || '[]');
      if (!Array.isArray(sentIds)) sentIds = [];
    } catch (e) {
      sentIds = [];
    }

    if (sentIds.includes(notif.id)) return false;
    sentIds = [notif.id, ...sentIds].slice(0, 80);
    localStorage.setItem(sentKey, JSON.stringify(sentIds));
  }

  const payload = {
    title: notif.title || 'WorkFlow — Gestão Telecom',
    body: notif.desc || '',
    tag: String(notif.id),
    url: '/',
    targetTab: notif.targetTab || null,
    requireInteraction: Boolean(notif.requireInteraction || notif.type === 'ur-overdue-5d')
  };

  try {
    const reg =
      swRegistration ||
      (await ('serviceWorker' in navigator ? navigator.serviceWorker.ready : Promise.resolve(null)));

    if (reg && reg.showNotification) {
      await reg.showNotification(payload.title, {
        body: payload.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: payload.tag,
        renotify: true,
        requireInteraction: payload.requireInteraction,
        vibrate: [200, 100, 200],
        data: { url: payload.url, targetTab: payload.targetTab }
      });
      return true;
    }

    if (reg && reg.active) {
      reg.active.postMessage({ type: 'SHOW_NOTIFICATION', payload });
      return true;
    }

    // Fallback direto via API Notification
    new Notification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      tag: payload.tag
    });
    return true;
  } catch (err) {
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/pwa-192x192.png',
        tag: payload.tag
      });
      return true;
    } catch (e) {
      return false;
    }
  }
};
