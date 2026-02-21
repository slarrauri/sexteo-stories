/**
 * Published Stories Store — Publish, browse, and read finished stories
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createPublishedStoriesStore() {
    const { subscribe, set, update } = writable({
        stories: [],
        currentStory: null,
        loading: false,
        error: null,
    });

    return {
        subscribe,

        /**
         * Publish a finished room as a story.
         * Exports all messages as content, links to the room, and sets visibility.
         */
        async publishStory({ roomId, title, genre, intensity, summary, visibility = 'public', publisherId, authorIds }) {
            if (!browser) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role, Query } = await import('appwrite');

            try {
                // 1. Fetch all messages from the room to build content
                const msgs = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.MESSAGES,
                    [
                        Query.equal('roomId', roomId),
                        Query.orderAsc('$createdAt'),
                        Query.limit(500),
                    ]
                );

                // 2. Format messages into readable story text
                const content = msgs.documents
                    .filter(m => m.messageType !== 'SYSTEM')
                    .map(m => {
                        const prefix = m.messageType === 'ACTION' ? '*'
                            : m.messageType === 'NARRATION' ? '>'
                                : '—';
                        return `${prefix} ${m.content}`;
                    })
                    .join('\n\n');

                // 3. Create published story document
                const story = await databases.createDocument(
                    DB.MAIN, COLLECTIONS.STORIES, ID.unique(),
                    {
                        roomId,
                        title: title || 'Historia sin título',
                        genre: genre || '',
                        intensity: intensity || 3,
                        content,
                        summary: summary || '',
                        authorIds: authorIds || [],
                        publisherId,
                        visibility,
                        readCount: 0,
                        likeCount: 0,
                        createdAt: new Date().toISOString(),
                    },
                    [
                        Permission.read(Role.users()),
                        Permission.update(Role.user(publisherId)),
                    ]
                );

                update(s => ({
                    ...s,
                    stories: [story, ...s.stories],
                    loading: false,
                }));

                return story;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Load public stories for browsing */
        async loadPublicStories({ genre, search, limit = 20 } = {}) {
            if (!browser) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            const queries = [
                Query.equal('visibility', 'public'),
                Query.orderDesc('$createdAt'),
                Query.limit(limit),
            ];
            if (genre) queries.push(Query.equal('genre', genre));
            if (search) queries.push(Query.search('title', search));

            try {
                const result = await databases.listDocuments(DB.MAIN, COLLECTIONS.STORIES, queries);
                set({ stories: result.documents, currentStory: null, loading: false, error: null });
                return result.documents;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                return [];
            }
        },

        /** Load stories shared with a specific user (user is in authorIds but not the publisher) */
        async loadSharedStories(userId) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.STORIES,
                    [
                        Query.contains('authorIds', [userId]),
                        Query.notEqual('publisherId', userId),
                        Query.orderDesc('$createdAt'),
                        Query.limit(50),
                    ]
                );
                set({ stories: result.documents, currentStory: null, loading: false, error: null });
                return result.documents;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                return [];
            }
        },

        /** Load stories published by a specific user */
        async loadMyStories(userId) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.STORIES,
                    [
                        Query.equal('publisherId', userId),
                        Query.orderDesc('$createdAt'),
                        Query.limit(50),
                    ]
                );
                set({ stories: result.documents, currentStory: null, loading: false, error: null });
                return result.documents;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                return [];
            }
        },

        /** Load a single story by ID and increment read count */
        async loadStory(storyId) {
            if (!browser || !storyId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const story = await databases.getDocument(DB.MAIN, COLLECTIONS.STORIES, storyId);

                // Increment read count
                databases.updateDocument(DB.MAIN, COLLECTIONS.STORIES, storyId, {
                    readCount: (story.readCount || 0) + 1,
                }).catch(() => { }); // fire-and-forget

                update(s => ({ ...s, currentStory: story, loading: false }));
                return story;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Like a story */
        async likeStory(storyId) {
            if (!browser || !storyId) return;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const story = await databases.getDocument(DB.MAIN, COLLECTIONS.STORIES, storyId);
                const updated = await databases.updateDocument(DB.MAIN, COLLECTIONS.STORIES, storyId, {
                    likeCount: (story.likeCount || 0) + 1,
                });

                update(s => ({
                    ...s,
                    currentStory: s.currentStory?.$id === storyId ? updated : s.currentStory,
                    stories: s.stories.map(st => st.$id === storyId ? updated : st),
                }));
                return updated;
            } catch (e) {
                console.error('Failed to like story:', e.message);
            }
        },

        reset() {
            set({ stories: [], currentStory: null, loading: false, error: null });
        },
    };
}

export const publishedStories = createPublishedStoriesStore();
