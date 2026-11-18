// Utilitário de PWA (Instalação App) e Espelhamento de Notificações Nativas (PC & Mobile)

let swRegistration = null;

export const registerWorkflowServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Falha ao registrar Service Worker PWA:', err);
    return null;
  }
};

export const getNativeNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

export const requestNativeNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Erro ao solicitar permissão de notificação:', err);
    return Notification.permission;
  }
};

export const dispatchNativeNotification = async (notif, force = false) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (!notif || !notif.title) return false;
  if (Notification.permission !== 'granted') return false;

  const notifKey = String(notif.id || `${notif.title}-${notif.time || ''}`);

  if (!force) {
    try {
      const rawSent = localStorage.getItem('CLARO_NATIVE_NOTIF_SENT');
      const sentList = rawSent ? JSON.parse(rawSent) : [];
      if (Array.isArray(sentList) && sentList.includes(notifKey)) {
        return false; // Já disparada anteriormente no sistema operacional
      }
      const nextSent = [notifKey, ...(Array.isArray(sentList) ? sentList : [])].slice(0, 80);
      localStorage.setItem('CLARO_NATIVE_NOTIF_SENT', JSON.stringify(nextSent));
    } catch {}
  }

  const title = `WorkFlow • ${notif.title}`;
  const body = notif.desc || '';
  const tag = `wf-${notifKey}`;

  try {
    const reg = swRegistration || (await navigator.serviceWorker?.getRegistration?.());
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(title, {
        body,
        icon: '/logo_WF.png',
        badge: '/logo_WF.png',
        tag,
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: window.location.origin }
      });
      return true;
    }
  } catch {}

  try {
    const n = new Notification(title, {
      body,
      icon: '/logo_WF.png',
      tag
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
};
