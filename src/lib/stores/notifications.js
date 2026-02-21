/**
 * Notifications Store — CRUD + Realtime
 */
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

function createNotificationsStore() {
    const { subscribe, set, update } = writable({
        items: [],
        loading: false,
        error: null,
    });

    let unsubscribeRealtime = null;

    return {
        subscribe,

        /** Load notifications for a user */
        async loadNotifications(userId) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.NOTIFICATIONS,
                    [
                        Query.equal('userId', userId),
                        Query.orderDesc('createdAt'),
                        Query.limit(50),
                    ]
                );

                set({ items: result.documents, loading: false, error: null });
                return result.documents;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
            }
        },

        /** Create a notification */
        async createNotification({ userId, type, title, body = '', referenceId = '' }) {
            if (!browser || !userId) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                return await databases.createDocument(
                    DB.MAIN, COLLECTIONS.NOTIFICATIONS, ID.unique(),
                    {
                        userId,
                        type,
                        title,
                        body,
                        referenceId,
                        read: false,
                        createdAt: new Date().toISOString(),
                    },
                    [
                        Permission.read(Role.user(userId)),
                        Permission.update(Role.user(userId)),
                        Permission.delete(Role.user(userId)),
                    ]
                );
            } catch (e) {
                console.error('Failed to create notification:', e.message);
            }
        },

        /** Mark a single notification as read */
        async markAsRead(notifId) {
            if (!browser || !notifId) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                await databases.updateDocument(DB.MAIN, COLLECTIONS.NOTIFICATIONS, notifId, { read: true });
                update(s => ({
                    ...s,
                    items: s.items.map(n => n.$id === notifId ? { ...n, read: true } : n),
                }));
            } catch (e) {
                console.error('Failed to mark as read:', e.message);
            }
        },

        /** Mark all of a user's notifications as read */
        async markAllRead(userId) {
            if (!browser || !userId) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const unread = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.NOTIFICATIONS,
                    [
                        Query.equal('userId', userId),
                        Query.equal('read', false),
                        Query.limit(100),
                    ]
                );

                await Promise.all(
                    unread.documents.map(n =>
                        databases.updateDocument(DB.MAIN, COLLECTIONS.NOTIFICATIONS, n.$id, { read: true })
                    )
                );

                update(s => ({
                    ...s,
                    items: s.items.map(n => ({ ...n, read: true })),
                }));
            } catch (e) {
                console.error('Failed to mark all read:', e.message);
            }
        },

        /** Subscribe to new notifications in realtime */
        subscribeRealtime(userId) {
            if (!browser || !userId) return;

            import('$lib/appwrite.js').then(({ client }) => {
                if (!client) return;
                const channel = `databases.sexteo_main.collections.notifications.documents`;

                unsubscribeRealtime = client.subscribe(channel, (event) => {
                    const doc = event.payload;
                    if (doc.userId !== userId) return;

                    if (event.events.some(e => e.includes('.create'))) {
                        update(s => {
                            if (s.items.some(n => n.$id === doc.$id)) return s;
                            return { ...s, items: [doc, ...s.items] };
                        });

                        // 🔔 Show browser push notification
                        import('$lib/pushNotifications.js').then(({ showBrowserNotification, notifToBrowserPush }) => {
                            const push = notifToBrowserPush(doc);
                            showBrowserNotification(push.title, {
                                body: push.body,
                                tag: push.tag,
                                url: push.url,
                            });
                        }).catch(() => { });
                    }

                    if (event.events.some(e => e.includes('.update'))) {
                        update(s => ({
                            ...s,
                            items: s.items.map(n => n.$id === doc.$id ? doc : n),
                        }));
                    }
                });
            });
        },

        /** Unsubscribe from realtime */
        unsubscribeRealtime() {
            if (unsubscribeRealtime) {
                unsubscribeRealtime();
                unsubscribeRealtime = null;
            }
        },

        reset() {
            this.unsubscribeRealtime();
            set({ items: [], loading: false, error: null });
        },
    };
}

export const notifications = createNotificationsStore();

/** Derived store: count of unread notifications */
export const unreadCount = derived(notifications, ($n) =>
    $n.items.filter(i => !i.read).length
);

// ── Notification type helpers ──
export const NOTIF_TYPES = {
    match_request: { emoji: '⚡', label: 'Solicitud de match' },
    match_accepted: { emoji: '🎉', label: 'Match aceptado' },
    new_message: { emoji: '💬', label: 'Nuevo mensaje' },
    room_invite: { emoji: '🏠', label: 'Invitación a sala' },
};
