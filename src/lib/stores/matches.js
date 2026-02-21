/**
 * Matches Store — Finding and managing narrative matches
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createMatchesStore() {
    const { subscribe, set, update } = writable({
        matches: [],
        currentMatch: null,
        searching: false,
        loading: false,
        error: null,
    });

    return {
        subscribe,

        /** Find potential matches for a user based on narrative compatibility */
        async findMatches(userId) {
            if (!browser || !userId) return;
            update(s => ({ ...s, searching: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                // Get my narrative profile
                let myProfile;
                try {
                    myProfile = await databases.getDocument(DB.MAIN, COLLECTIONS.NARRATIVE_PROFILES, userId);
                } catch {
                    update(s => ({ ...s, searching: false, error: 'Completá tu perfil narrativo primero' }));
                    return [];
                }

                // Get all other narrative profiles
                const profiles = await databases.listDocuments(DB.MAIN, COLLECTIONS.NARRATIVE_PROFILES, [
                    Query.notEqual('userId', userId),
                    Query.limit(50),
                ]);

                // Calculate compatibility for each
                const scored = profiles.documents.map(profile => ({
                    ...profile,
                    compatibilityScore: calculateCompatibility(myProfile, profile),
                    matchType: determineMatchType(myProfile, profile),
                    matchLabel: getMatchLabel(calculateCompatibility(myProfile, profile)),
                }));

                // Sort by score descending
                scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

                update(s => ({ ...s, matches: scored, searching: false }));
                return scored;
            } catch (e) {
                update(s => ({ ...s, searching: false, error: e.message }));
                throw e;
            }
        },

        /** Create a match request */
        async createMatch(matchData) {
            if (!browser) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                const doc = await databases.createDocument(
                    DB.MAIN, COLLECTIONS.MATCHES, ID.unique(),
                    {
                        ...matchData,
                        status: 'pending',
                        limitsAgreed: false,
                        createdAt: new Date().toISOString(),
                    },
                    [
                        Permission.read(Role.any()),
                        Permission.update(Role.user(matchData.userIdA)),
                        Permission.update(Role.user(matchData.userIdB)),
                    ]
                );
                update(s => ({ ...s, currentMatch: doc, loading: false }));

                // 🔔 Notify userIdB about the match request
                try {
                    const { notifications } = await import('$lib/stores/notifications.js');
                    await notifications.createNotification({
                        userId: matchData.userIdB,
                        type: 'match_request',
                        title: '⚡ Nueva solicitud de match',
                        body: `Alguien quiere escribir una historia con vos (${doc.compatibilityScore || 0}% compatible)`,
                        referenceId: doc.$id,
                    });
                } catch { /* non-critical */ }

                return doc;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Accept or reject a match */
        async respondToMatch(matchId, accept) {
            if (!browser) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const matchDoc = await databases.getDocument(DB.MAIN, COLLECTIONS.MATCHES, matchId);
                const doc = await databases.updateDocument(
                    DB.MAIN, COLLECTIONS.MATCHES, matchId,
                    { status: accept ? 'accepted' : 'rejected' }
                );
                update(s => ({ ...s, currentMatch: doc, loading: false }));

                // 🔔 Notify userIdA that the match was accepted
                if (accept && matchDoc.userIdA) {
                    try {
                        const { notifications } = await import('$lib/stores/notifications.js');
                        await notifications.createNotification({
                            userId: matchDoc.userIdA,
                            type: 'match_accepted',
                            title: '🎉 ¡Match aceptado!',
                            body: 'Tu solicitud fue aceptada. ¡A escribir!',
                            referenceId: matchId,
                        });
                    } catch { /* non-critical */ }
                }

                return doc;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Get pending matches for a user */
        async getPendingMatches(userId) {
            if (!browser || !userId) return [];

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(DB.MAIN, COLLECTIONS.MATCHES, [
                    Query.equal('userIdB', userId),
                    Query.equal('status', 'pending'),
                    Query.orderDesc('createdAt'),
                ]);
                return result.documents;
            } catch {
                return [];
            }
        },

        /** Agree on limits for a match (consent panel) */
        async agreeLimits(matchId) {
            if (!browser) return;
            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                return await databases.updateDocument(
                    DB.MAIN, COLLECTIONS.MATCHES, matchId,
                    { limitsAgreed: true }
                );
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        reset() {
            set({ matches: [], currentMatch: null, searching: false, loading: false, error: null });
        },
    };
}

// ── Compatibility Algorithm ──
// Score 0–100 based on 5 layers from product spec

function calculateCompatibility(profileA, profileB) {
    let score = 0;

    // 1. Writing style match (15%)
    if (profileA.writingStyle === profileB.writingStyle) score += 15;
    else score += 7; // partial points for different-but-complementary styles

    // 2. Emotional pace (15%)
    if (profileA.emotionalPace === profileB.emotionalPace) score += 15;
    else score += 5;

    // 3. Plot preferences overlap (25%)
    const plotA = new Set(profileA.plotPreferences || []);
    const plotB = new Set(profileB.plotPreferences || []);
    const plotOverlap = [...plotA].filter(p => plotB.has(p)).length;
    const plotTotal = Math.max(plotA.size, plotB.size, 1);
    score += Math.round((plotOverlap / plotTotal) * 25);

    // 4. Intensity compatibility (30%) — closer = better
    const intA = profileA.preferredIntensity || 3;
    const intB = profileB.preferredIntensity || 3;
    const intDiff = Math.abs(intA - intB);
    score += Math.max(0, 30 - intDiff * 10);

    // 5. Role complementarity (15%) — opposites attract
    const roleCompat = getRoleCompatibility(profileA.roleType, profileB.roleType);
    score += Math.round(roleCompat * 15);

    return Math.min(100, Math.max(0, score));
}

function getRoleCompatibility(roleA, roleB) {
    // Guide + Reactive = great chemistry
    const combos = {
        'guia-reactivo': 1.0,
        'reactivo-guia': 1.0,
        'explorador-explorador': 0.8,
        'guia-explorador': 0.7,
        'explorador-guia': 0.7,
        'reactivo-explorador': 0.6,
        'explorador-reactivo': 0.6,
        'guia-guia': 0.3,        // both want to lead → tension
        'reactivo-reactivo': 0.3, // both passive → slow
    };
    return combos[`${roleA}-${roleB}`] ?? 0.5;
}

function determineMatchType(profileA, profileB) {
    const score = calculateCompatibility(profileA, profileB);

    if (score >= 85) return 'spark';
    if (profileA.emotionalPace === 'lento' && profileB.emotionalPace === 'lento') return 'slow_burn';
    if (profileA.writingStyle !== profileB.writingStyle &&
        profileA.roleType !== profileB.roleType) return 'opposites';
    if (profileA.writingStyle === profileB.writingStyle &&
        profileA.roleType === profileB.roleType) return 'mirror';
    return 'chaos';
}

function getMatchLabel(score) {
    if (score >= 90) return 'Destino Narrativo';
    if (score >= 75) return 'Alquimia';
    if (score >= 60) return 'Tensión';
    if (score >= 45) return 'Conexión';
    if (score >= 30) return 'Intriga';
    return 'Neutral';
}

export const matches = createMatchesStore();

// Export helpers for use in components
export { getMatchLabel, determineMatchType };

// ── Match type display info ──
export const MATCH_TYPES = {
    spark: { emoji: '⚡', label: 'Spark Match', desc: 'Alta química instantánea' },
    slow_burn: { emoji: '🕯️', label: 'Slow Burn', desc: 'Compatibilidad a largo plazo' },
    chaos: { emoji: '🌪️', label: 'Chaos Match', desc: 'Historias impredecibles' },
    mirror: { emoji: '🪞', label: 'Mirror Match', desc: 'Estilos casi idénticos' },
    opposites: { emoji: '🔄', label: 'Opposites', desc: 'Tensión por contraste' },
};
