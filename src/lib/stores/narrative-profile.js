/**
 * Narrative Profile Store — Narrative DNA profile per user
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createNarrativeProfileStore() {
    const { subscribe, set, update } = writable({
        profile: null,
        loading: false,
        error: null,
    });

    return {
        subscribe,

        /** Load narrative profile (auto-creates if missing) */
        async loadProfile(userId) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const doc = await databases.getDocument(DB.MAIN, COLLECTIONS.NARRATIVE_PROFILES, userId);
                set({ profile: doc, loading: false, error: null });
                return doc;
            } catch (e) {
                if (e.code === 404) {
                    // Auto-create with defaults
                    try {
                        const { Permission, Role } = await import('appwrite');
                        const doc = await databases.createDocument(
                            DB.MAIN, COLLECTIONS.NARRATIVE_PROFILES, userId,
                            {
                                userId,
                                writingStyle: 'descriptivo',
                                emotionalPace: 'progresivo',
                                roleType: 'explorador',
                                improvisationLevel: 3,
                                plotPreferences: [],
                                narrativeInitiative: 3,
                                preferredIntensity: 3,
                                preferredGenres: [],
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            },
                            [
                                Permission.read(Role.any()),
                                Permission.update(Role.user(userId)),
                                Permission.delete(Role.user(userId)),
                            ]
                        );
                        set({ profile: doc, loading: false, error: null });
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

        /** Save narrative profile fields */
        async saveProfile(userId, fields) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const doc = await databases.updateDocument(
                    DB.MAIN, COLLECTIONS.NARRATIVE_PROFILES, userId,
                    { ...fields, updatedAt: new Date().toISOString() }
                );
                set({ profile: doc, loading: false, error: null });
                return doc;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        reset() {
            set({ profile: null, loading: false, error: null });
        },
    };
}

export const narrativeProfile = createNarrativeProfileStore();

// ── Constants for UI dropdowns ──
export const WRITING_STYLES = [
    { value: 'poetico', label: 'Poético' },
    { value: 'directo', label: 'Directo' },
    { value: 'descriptivo', label: 'Descriptivo' },
    { value: 'minimalista', label: 'Minimalista' },
];

export const EMOTIONAL_PACES = [
    { value: 'lento', label: 'Lento' },
    { value: 'progresivo', label: 'Progresivo' },
    { value: 'intenso', label: 'Intenso' },
];

export const ROLE_TYPES = [
    { value: 'guia', label: 'Guía — Llevo la historia' },
    { value: 'reactivo', label: 'Reactivo — Respondo a lo que pasa' },
    { value: 'explorador', label: 'Explorador — Descubro mientras avanzo' },
];

export const PLOT_OPTIONS = [
    'Romántica', 'Oscura', 'Misteriosa', 'Fantasía',
    'Sci-Fi', 'Thriller', 'Comedia', 'Drama',
    'Aventura', 'Slice of Life', 'Horror', 'Erótica',
];

export const GENRE_OPTIONS = [
    'Fantasía Medieval', 'Urbano Moderno', 'Cyberpunk',
    'Histórico', 'Sobrenatural', 'Post-Apocalíptico',
    'Escolar', 'Corporativo', 'Piratas', 'Espacial',
];
