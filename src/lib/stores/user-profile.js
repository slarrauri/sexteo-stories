/**
 * User Profile Store — Extended profile data from the 'users' collection
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createUserProfileStore() {
    const { subscribe, set, update } = writable({
        profile: null,
        loading: false,
        error: null,
    });

    return {
        subscribe,

        /** Load user profile from Appwrite DB — auto-creates if missing */
        async loadProfile(userId) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');

            try {
                const doc = await databases.getDocument(DB.MAIN, COLLECTIONS.USERS, userId);
                set({ profile: doc, loading: false, error: null });
                return doc;
            } catch (e) {
                if (e.code === 404) {
                    // Auto-create profile for new users
                    try {
                        const { ID, Permission, Role } = await import('appwrite');
                        const doc = await databases.createDocument(
                            DB.MAIN, COLLECTIONS.USERS, userId,
                            {
                                globalState: 'REGISTERED',
                                monetizationTier: 'FREE',
                                engagementLevel: 'NEW',
                                storiesCompleted: 0,
                                isVerified: false,
                                isOnline: true,
                                createdAt: new Date().toISOString(),
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

        /** Create or update profile in Appwrite DB */
        async saveProfile(userId, fields) {
            if (!browser || !userId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                let doc;
                try {
                    // Try to update existing
                    doc = await databases.updateDocument(DB.MAIN, COLLECTIONS.USERS, userId, fields);
                } catch (e) {
                    if (e.code === 404) {
                        // Create new profile
                        doc = await databases.createDocument(
                            DB.MAIN, COLLECTIONS.USERS, userId,
                            {
                                ...fields,
                                globalState: fields.globalState || 'REGISTERED',
                                monetizationTier: 'FREE',
                                engagementLevel: 'NEW',
                                storiesCompleted: 0,
                                isVerified: false,
                                isOnline: true,
                                createdAt: new Date().toISOString(),
                            },
                            [
                                Permission.read(Role.any()),
                                Permission.update(Role.user(userId)),
                                Permission.delete(Role.user(userId)),
                            ]
                        );
                    } else throw e;
                }

                set({ profile: doc, loading: false, error: null });
                return doc;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /** Upload avatar to storage and update profile */
        async uploadAvatar(userId, file) {
            if (!browser || !userId || !file) return;

            const { storage, databases, DB, COLLECTIONS, BUCKETS } = await import('$lib/appwrite.js');
            const { ID } = await import('appwrite');

            try {
                // Upload file
                const uploaded = await storage.createFile(BUCKETS.AVATARS, ID.unique(), file);

                // Update profile with file ID
                await this.saveProfile(userId, { avatarFileId: uploaded.$id });

                return uploaded.$id;
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        /** Get avatar URL from file ID */
        getAvatarUrl(fileId) {
            if (!fileId || !browser) return null;
            try {
                const { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT_ID } = import.meta.env;
                return `${PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/avatars/files/${fileId}/preview?project=${PUBLIC_APPWRITE_PROJECT_ID}&width=400&height=400`;
            } catch {
                return null;
            }
        },

        /** Update online status */
        async setOnline(userId, isOnline) {
            if (!browser || !userId) return;
            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            try {
                await databases.updateDocument(DB.MAIN, COLLECTIONS.USERS, userId, {
                    isOnline,
                    lastActiveAt: new Date().toISOString(),
                });
            } catch {
                // Silently fail — non-critical
            }
        },

        reset() {
            set({ profile: null, loading: false, error: null });
        },
    };
}

export const userProfile = createUserProfileStore();
