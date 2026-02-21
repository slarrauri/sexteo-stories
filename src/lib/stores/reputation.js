/**
 * Reputation Store — Ratings + Karma calculation
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Rating tag options
export const RATING_TAGS = [
    { id: 'creatividad', label: '✨ Creatividad', desc: 'Historias originales e imaginativas' },
    { id: 'respeto', label: '🤝 Respeto', desc: 'Respeta límites y acuerdos' },
    { id: 'ritmo', label: '🎵 Ritmo', desc: 'Buen timing narrativo' },
    { id: 'inmersion', label: '🌊 Inmersión', desc: 'Te hace sentir dentro de la historia' },
];

function createReputationStore() {
    const { subscribe, set, update } = writable({
        ratings: [],
        karma: null,
        loading: false,
        error: null,
    });

    return {
        subscribe,

        /** Submit a rating for another user */
        async submitRating({ raterId, ratedId, roomId, score, tags = [], comment = '' }) {
            if (!browser || !raterId || !ratedId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                const doc = await databases.createDocument(
                    DB.MAIN, COLLECTIONS.RATINGS, ID.unique(),
                    {
                        raterId,
                        ratedId,
                        roomId,
                        score,
                        tags: JSON.stringify(tags),
                        comment: comment.trim(),
                        createdAt: new Date().toISOString(),
                    },
                    [
                        Permission.read(Role.users()),
                    ]
                );

                update(s => ({ ...s, loading: false }));

                // 🔔 Notify the rated user
                try {
                    const { notifications } = await import('$lib/stores/notifications.js');
                    const starEmoji = '⭐'.repeat(Math.min(score, 5));
                    await notifications.createNotification({
                        userId: ratedId,
                        type: 'rating_received',
                        title: `${starEmoji} Nueva calificación`,
                        body: score >= 4
                            ? '¡Alguien valoró mucho tu narrativa!'
                            : 'Recibiste una nueva calificación',
                        referenceId: roomId,
                    });
                } catch { /* non-critical */ }

                return doc;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Load reputation for a user (all their received ratings) */
        async getUserReputation(userId) {
            if (!browser || !userId) return null;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.RATINGS,
                    [
                        Query.equal('ratedId', userId),
                        Query.orderDesc('createdAt'),
                        Query.limit(100),
                    ]
                );

                const ratings = result.documents;
                const karma = calculateKarma(ratings);

                set({ ratings, karma, loading: false, error: null });
                return karma;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                return null;
            }
        },

        /** Check if current user already rated this room */
        async hasRated(raterId, roomId) {
            if (!browser) return false;

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.RATINGS,
                    [
                        Query.equal('raterId', raterId),
                        Query.equal('roomId', roomId),
                        Query.limit(1),
                    ]
                );
                return result.documents.length > 0;
            } catch {
                return false;
            }
        },

        reset() {
            set({ ratings: [], karma: null, loading: false, error: null });
        },
    };
}

/**
 * Calculate karma from ratings.
 * 
 * Formula:
 *  - base = average score (1-5)
 *  - bonus = +0.1 per rating (capped at +0.5)
 *  - karma = base + bonus (capped at 5.0)
 * 
 * Also calculates tag counts for badges.
 */
function calculateKarma(ratings) {
    if (!ratings.length) {
        return { score: 0, total: 0, average: 0, level: 'nuevo', tags: {} };
    }

    const scores = ratings.map(r => r.score);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bonus = Math.min(ratings.length * 0.1, 0.5);
    const karma = Math.min(average + bonus, 5.0);

    // Count tag occurrences
    const tagCounts = {};
    for (const r of ratings) {
        try {
            const tags = JSON.parse(r.tags || '[]');
            for (const t of tags) {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
            }
        } catch { /* ignore parse errors */ }
    }

    // Karma level
    let level;
    if (karma >= 4.5) level = 'legendario';
    else if (karma >= 4.0) level = 'brillante';
    else if (karma >= 3.0) level = 'confiable';
    else if (karma >= 2.0) level = 'aprendiz';
    else level = 'nuevo';

    return {
        score: Math.round(karma * 10) / 10,
        total: ratings.length,
        average: Math.round(average * 10) / 10,
        level,
        tags: tagCounts,
    };
}

export const KARMA_LEVELS = {
    legendario: { emoji: '👑', color: '#fbbf24', label: 'Legendario' },
    brillante: { emoji: '💎', color: '#a855f7', label: 'Brillante' },
    confiable: { emoji: '✅', color: '#22c55e', label: 'Confiable' },
    aprendiz: { emoji: '🌱', color: '#60a5fa', label: 'Aprendiz' },
    nuevo: { emoji: '🆕', color: '#9ca3af', label: 'Nuevo' },
};

export const reputation = createReputationStore();
