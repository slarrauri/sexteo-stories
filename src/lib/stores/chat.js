/**
 * Chat Store — Real-time messaging via Appwrite Realtime
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Detect message type from content format:
 * - *text* → ACTION
 * - —text or -text → DIALOGUE
 * - >text or [NARR] → NARRATION
 * - default → DIALOGUE
 */
export function detectMessageType(content) {
    const trimmed = content.trim();
    if (trimmed.startsWith('*') && trimmed.endsWith('*')) return 'ACTION';
    if (trimmed.startsWith('—') || trimmed.startsWith('- ')) return 'DIALOGUE';
    if (trimmed.startsWith('>') || trimmed.startsWith('[NARR]')) return 'NARRATION';
    return 'DIALOGUE';
}

function createChatStore() {
    const { subscribe, set, update } = writable({
        messages: [],
        loading: false,
        error: null,
        hasMore: true,
    });

    let unsubscribeRealtime = null;

    return {
        subscribe,

        /** Load messages for a room with pagination */
        async loadMessages(roomId, limit = 50) {
            if (!browser || !roomId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.MESSAGES,
                    [
                        Query.equal('roomId', roomId),
                        Query.orderAsc('createdAt'),
                        Query.limit(limit),
                    ]
                );

                set({
                    messages: result.documents,
                    loading: false,
                    error: null,
                    hasMore: result.documents.length === limit,
                });

                return result.documents;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Load older messages (pagination) */
        async loadOlderMessages(roomId, beforeMessageId, limit = 50) {
            if (!browser || !roomId || !beforeMessageId) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.MESSAGES,
                    [
                        Query.equal('roomId', roomId),
                        Query.orderAsc('createdAt'),
                        Query.cursorBefore(beforeMessageId),
                        Query.limit(limit),
                    ]
                );

                update(s => ({
                    ...s,
                    messages: [...result.documents, ...s.messages],
                    hasMore: result.documents.length === limit,
                }));

                return result.documents;
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        /** Send a message */
        async sendMessage(roomId, content, senderId, characterId = null, { replyToId, mediaFileId } = {}) {
            if (!browser || !roomId || (!content.trim() && !mediaFileId)) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            const messageType = mediaFileId ? 'MEDIA' : detectMessageType(content);

            try {
                const message = await databases.createDocument(
                    DB.MAIN, COLLECTIONS.MESSAGES, ID.unique(),
                    {
                        roomId,
                        senderId,
                        characterId: characterId || '',
                        content: content.trim() || '📎',
                        messageType,
                        isNarratorAI: false,
                        mediaFileId: mediaFileId || '',
                        replyToId: replyToId || '',
                        reactions: '',
                        createdAt: new Date().toISOString(),
                    },
                    [
                        Permission.read(Role.users()),
                    ]
                );

                // Update room's lastMessageAt and messageCount
                try {
                    const room = await databases.getDocument(DB.MAIN, COLLECTIONS.ROOMS, roomId);
                    await databases.updateDocument(DB.MAIN, COLLECTIONS.ROOMS, roomId, {
                        lastMessageAt: new Date().toISOString(),
                        messageCount: (room.messageCount || 0) + 1,
                    });
                } catch {
                    // Non-critical — room stats update failed
                }

                return message;
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        /** Toggle an emoji reaction on a message */
        async toggleReaction(messageId, emoji, userId) {
            if (!browser || !messageId || !emoji || !userId) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const msg = await databases.getDocument(DB.MAIN, COLLECTIONS.MESSAGES, messageId);
                const reactions = msg.reactions ? JSON.parse(msg.reactions) : {};

                if (!reactions[emoji]) reactions[emoji] = [];

                if (reactions[emoji].includes(userId)) {
                    reactions[emoji] = reactions[emoji].filter(id => id !== userId);
                    if (reactions[emoji].length === 0) delete reactions[emoji];
                } else {
                    reactions[emoji].push(userId);
                }

                const updated = await databases.updateDocument(
                    DB.MAIN, COLLECTIONS.MESSAGES, messageId,
                    { reactions: JSON.stringify(reactions) }
                );

                // Update local state
                update(s => ({
                    ...s,
                    messages: s.messages.map(m => m.$id === messageId ? { ...m, reactions: updated.reactions } : m),
                }));

                return updated;
            } catch (e) {
                console.error('Failed to toggle reaction:', e.message);
            }
        },

        /** Upload media file to chat_media bucket */
        async uploadMedia(file) {
            if (!browser || !file) return null;

            const { storage, BUCKETS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                const uploaded = await storage.createFile(
                    BUCKETS.CHAT_MEDIA, ID.unique(), file,
                    [Permission.read(Role.users())]
                );
                return uploaded.$id;
            } catch (e) {
                console.error('Failed to upload media:', e.message);
                return null;
            }
        },

        /** Send a system message */
        async sendSystemMessage(roomId, content) {
            if (!browser || !roomId) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                return await databases.createDocument(
                    DB.MAIN, COLLECTIONS.MESSAGES, ID.unique(),
                    {
                        roomId,
                        senderId: 'system',
                        characterId: '',
                        content,
                        messageType: 'SYSTEM',
                        isNarratorAI: false,
                        createdAt: new Date().toISOString(),
                    },
                    [Permission.read(Role.users())]
                );
            } catch (e) {
                console.error('Failed to send system message:', e.message);
            }
        },

        /** Subscribe to new messages in a room via Appwrite Realtime */
        subscribeToMessages(roomId) {
            if (!browser || !roomId) return;

            import('$lib/appwrite.js').then(({ client }) => {
                if (!client) return;
                const channel = `databases.sexteo_main.collections.messages.documents`;

                unsubscribeRealtime = client.subscribe(channel, (event) => {
                    const message = event.payload;

                    // Only process messages for this room
                    if (message.roomId !== roomId) return;

                    if (event.events.some(e => e.includes('.create'))) {
                        update(s => {
                            // Avoid duplicates (message might already be in state from sendMessage)
                            if (s.messages.some(m => m.$id === message.$id)) return s;
                            return { ...s, messages: [...s.messages, message] };
                        });
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
            set({ messages: [], loading: false, error: null, hasMore: true });
        },
    };
}

export const chat = createChatStore();
