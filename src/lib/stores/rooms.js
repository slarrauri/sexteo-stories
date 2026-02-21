/**
 * Rooms Store — Room CRUD and realtime subscriptions
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createRoomsStore() {
    const { subscribe, set, update } = writable({
        rooms: [],
        currentRoom: null,
        loading: false,
        error: null,
    });

    let unsubscribeRealtime = null;

    return {
        subscribe,

        /** Create a new room */
        async createRoom({ type = 'PRIVATE', title, genre, worldCategory, intensity, participantIds, narrativeContext, maxParticipants }) {
            if (!browser) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                const room = await databases.createDocument(
                    DB.MAIN, COLLECTIONS.ROOMS, ID.unique(),
                    {
                        type,
                        title: title || 'Historia sin título',
                        genre: genre || '',
                        worldCategory: worldCategory || '',
                        intensity: intensity || 3,
                        status: 'ACTIVE',
                        participantIds: participantIds || [],
                        maxParticipants: maxParticipants || (type === 'PRIVATE' ? 2 : 5),
                        creatorId: participantIds?.[0] || '',
                        narrativeContext: narrativeContext || '',
                        messageCount: 0,
                        startedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                    },
                    [
                        Permission.read(Role.users()),
                        Permission.update(Role.users()),
                    ]
                );

                update(s => ({
                    ...s,
                    rooms: [room, ...s.rooms],
                    loading: false,
                    error: null,
                }));

                return room;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Load rooms for a specific user */
        async loadMyRooms(userId) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.ROOMS,
                    [
                        Query.contains('participantIds', [userId]),
                        Query.orderDesc('$updatedAt'),
                        Query.limit(50),
                    ]
                );

                set({
                    rooms: result.documents,
                    currentRoom: null,
                    loading: false,
                    error: null,
                });

                return result.documents;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Load a single room by ID */
        async loadRoom(roomId) {
            if (!browser || !roomId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const room = await databases.getDocument(DB.MAIN, COLLECTIONS.ROOMS, roomId);
                update(s => ({ ...s, currentRoom: room, loading: false, error: null }));
                return room;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Update room status (ACTIVE, PAUSED, FINISHED, ABANDONED) */
        async updateStatus(roomId, status) {
            if (!browser || !roomId) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            const updateData = { status };
            if (status === 'FINISHED' || status === 'ABANDONED') {
                updateData.finishedAt = new Date().toISOString();
            }

            try {
                const room = await databases.updateDocument(DB.MAIN, COLLECTIONS.ROOMS, roomId, updateData);
                update(s => ({
                    ...s,
                    currentRoom: s.currentRoom?.$id === roomId ? room : s.currentRoom,
                    rooms: s.rooms.map(r => r.$id === roomId ? room : r),
                }));
                return room;
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        /** Join an existing room */
        async joinRoom(roomId, userId) {
            if (!browser || !roomId || !userId) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const room = await databases.getDocument(DB.MAIN, COLLECTIONS.ROOMS, roomId);
                if (room.participantIds.includes(userId)) return room; // Already in room

                // Check capacity
                if (room.participantIds.length >= (room.maxParticipants || 5)) {
                    throw new Error('La sala está llena');
                }

                const updatedParticipants = [...room.participantIds, userId];
                const updated = await databases.updateDocument(DB.MAIN, COLLECTIONS.ROOMS, roomId, {
                    participantIds: updatedParticipants,
                });

                update(s => ({
                    ...s,
                    currentRoom: updated,
                    rooms: s.rooms.map(r => r.$id === roomId ? updated : r),
                }));

                // 🔔 Notify room creator
                if (room.creatorId && room.creatorId !== userId) {
                    try {
                        const { notifications } = await import('$lib/stores/notifications.js');
                        await notifications.createNotification({
                            userId: room.creatorId,
                            type: 'room_invite',
                            title: '🏠 Alguien se unió a tu sala',
                            body: `Un narrador se sumó a "${room.title}"`,
                            referenceId: roomId,
                        });
                    } catch { /* non-critical */ }
                }

                return updated;
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        /** Load public/open group rooms */
        async loadPublicRooms() {
            if (!browser) return [];

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.ROOMS,
                    [
                        Query.equal('type', 'GROUP'),
                        Query.equal('status', 'ACTIVE'),
                        Query.orderDesc('$createdAt'),
                        Query.limit(30),
                    ]
                );

                // Filter client-side: only rooms with available spots
                return result.documents.filter(
                    r => r.participantIds.length < (r.maxParticipants || 5)
                );
            } catch (e) {
                console.error('Failed to load public rooms:', e.message);
                return [];
            }
        },

        /** Subscribe to realtime room updates */
        subscribeToRooms() {
            if (!browser) return;

            import('$lib/appwrite.js').then(({ client }) => {
                if (!client) return;
                const channel = `databases.sexteo_main.collections.rooms.documents`;

                unsubscribeRealtime = client.subscribe(channel, (event) => {
                    const room = event.payload;
                    if (event.events.some(e => e.includes('.update'))) {
                        update(s => ({
                            ...s,
                            currentRoom: s.currentRoom?.$id === room.$id ? room : s.currentRoom,
                            rooms: s.rooms.map(r => r.$id === room.$id ? room : r),
                        }));
                    }
                });
            });
        },

        /** Unsubscribe from realtime */
        unsubscribe() {
            if (unsubscribeRealtime) {
                unsubscribeRealtime();
                unsubscribeRealtime = null;
            }
        },

        reset() {
            this.unsubscribe();
            set({ rooms: [], currentRoom: null, loading: false, error: null });
        },
    };
}

export const rooms = createRoomsStore();
