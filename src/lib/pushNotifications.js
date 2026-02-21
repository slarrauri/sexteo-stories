/**
 * Browser Push Notifications — Uses the Notification API
 * Shows desktop notifications when app is not focused.
 * Integrates with existing Appwrite realtime subscription.
 */
import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// Permission state: 'default' | 'granted' | 'denied'
export const pushPermission = writable(
    browser ? (Notification?.permission || 'default') : 'default'
);

/**
 * Request notification permission from the user.
 * Returns 'granted', 'denied', or 'default'.
 */
export async function requestPushPermission() {
    if (!browser || !('Notification' in window)) return 'denied';

    const result = await Notification.requestPermission();
    pushPermission.set(result);
    return result;
}

/**
 * Show a browser notification.
 * Only shows if permission is granted AND the page is not focused.
 */
export function showBrowserNotification(title, options = {}) {
    if (!browser || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (document.hasFocus()) return; // Don't show if user is looking at the app

    const notif = new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: options.tag || 'sexteo-notif',
        renotify: true,
        ...options,
    });

    // Auto-close after 6 seconds
    setTimeout(() => notif.close(), 6000);

    // Focus app on click
    notif.onclick = () => {
        window.focus();
        if (options.url) {
            window.location.href = options.url;
        }
        notif.close();
    };

    return notif;
}

/**
 * Map notification types to browser notification content
 */
export function notifToBrowserPush(doc) {
    const typeMap = {
        match_request: { icon: '⚡', url: '/match' },
        match_accepted: { icon: '🎉', url: '/match' },
        new_message: { icon: '💬', url: doc.referenceId ? `/chat/${doc.referenceId}` : '/stories' },
        room_invite: { icon: '🏠', url: '/stories?tab=EN_CURSO' },
    };

    const info = typeMap[doc.type] || { icon: '🔔', url: '/notifications' };

    return {
        title: doc.title || 'Nueva notificación',
        body: doc.body || '',
        tag: `sexteo-${doc.type}-${doc.$id}`,
        url: info.url,
    };
}
