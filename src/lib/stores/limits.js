/**
 * Limits Config Store — User content limits and consent settings
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createLimitsStore() {
    const { subscribe, set, update } = writable({
        config: null,
        loading: false,
        error: null,
    });

    return {
        subscribe,

        /** Load limits config (auto-creates if missing) */
        async loadLimits(userId) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const doc = await databases.getDocument(DB.MAIN, COLLECTIONS.LIMITS_CONFIG, userId);
                set({ config: doc, loading: false, error: null });
                return doc;
            } catch (e) {
                if (e.code === 404) {
                    try {
                        const { Permission, Role } = await import('appwrite');
                        const doc = await databases.createDocument(
                            DB.MAIN, COLLECTIONS.LIMITS_CONFIG, userId,
                            {
                                userId,
                                allowedThemes: [],
                                forbiddenThemes: [],
                                intensityMax: 3,
                                safeWord: '',
                                autoExitEnabled: true,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            },
                            [
                                Permission.read(Role.any()),
                                Permission.update(Role.user(userId)),
                                Permission.delete(Role.user(userId)),
                            ]
                        );
                        set({ config: doc, loading: false, error: null });
                        return doc;
                    } catch (createErr) {
                        update(s => ({ ...s, loading: false, error: createErr.message }));
                        return null;
                    }
                }
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Save limits config */
        async saveLimits(userId, fields) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const doc = await databases.updateDocument(
                    DB.MAIN, COLLECTIONS.LIMITS_CONFIG, userId,
                    { ...fields, updatedAt: new Date().toISOString() }
                );
                set({ config: doc, loading: false, error: null });
                return doc;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Check if two users' limits are compatible */
        checkCompatibility(myLimits, theirLimits) {
            if (!myLimits || !theirLimits) return { compatible: false, conflicts: [] };

            const conflicts = [];

            // Check if my forbidden themes overlap with their allowed themes
            const myForbidden = new Set(myLimits.forbiddenThemes || []);
            const theirAllowed = theirLimits.allowedThemes || [];
            for (const theme of theirAllowed) {
                if (myForbidden.has(theme)) conflicts.push(`Tema conflictivo: ${theme}`);
            }

            // Check intensity compatibility
            const intensityDiff = Math.abs(
                (myLimits.intensityMax || 3) - (theirLimits.intensityMax || 3)
            );
            if (intensityDiff > 2) conflicts.push('Niveles de intensidad muy diferentes');

            return {
                compatible: conflicts.length === 0,
                conflicts,
                agreedIntensity: Math.min(myLimits.intensityMax || 3, theirLimits.intensityMax || 3),
            };
        },

        reset() {
            set({ config: null, loading: false, error: null });
        },
    };
}

export const limits = createLimitsStore();

// ── Theme options for UI ──
export const THEME_OPTIONS = [
    'Romance', 'Seducción', 'Dominación', 'Sumisión',
    'Voyeurismo', 'Fantasía', 'Juego de Roles', 'Tabú',
    'Violencia Narrativa', 'Gore', 'Menores', 'No-con',
    'Humillación', 'Fetiches', 'Exhibicionismo', 'Grupo',
];

// Themes that are ALWAYS forbidden (hard limits)
export const HARD_LIMITS = ['Menores', 'No-con'];
