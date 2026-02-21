/**
 * Auth Store — Session management for registered users
 */
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

function createAuthStore() {
    const { subscribe, set, update } = writable({
        user: null,
        loading: true,
        error: null,
    });

    return {
        subscribe,

        /** Initialize — check for existing session */
        async init() {
            if (!browser) return;

            const { account } = await import('$lib/appwrite.js');
            if (!account) return;

            try {
                const user = await account.get();
                set({ user, loading: false, error: null });
            } catch {
                // No session — just clear user and stop loading
                set({ user: null, loading: false, error: null });
            }
        },


        /** Create a new account */
        async createAccount(email, password, name) {
            const { account } = await import('$lib/appwrite.js');
            const { ID } = await import('appwrite');
            try {
                // Try to clear any existing session first
                try { await account.deleteSession('current'); } catch { }

                await account.create(ID.unique(), email, password, name);
                await account.createEmailPasswordSession(email, password);
                const user = await account.get();
                set({ user, loading: false, error: null });
                return user;
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        /** Login with email */
        async login(email, password) {
            const { account } = await import('$lib/appwrite.js');
            try {
                // Try to clear any existing session first
                try { await account.deleteSession('current'); } catch { }

                await account.createEmailPasswordSession(email, password);
                const user = await account.get();
                set({ user, loading: false, error: null });
                return user;
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        /** Logout */
        async logout() {
            const { account } = await import('$lib/appwrite.js');
            try {
                await account.deleteSession('current');
                set({ user: null, loading: false, error: null });
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
            }
        },

        /** Request password recovery */
        async recoverPassword(email) {
            const { account } = await import('$lib/appwrite.js');
            try {
                // URL where user will be redirected to reset password
                await account.createRecovery(email, `${window.location.origin}/auth/reset`);
                return true;
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        /** Update display name */
        async updateName(name) {
            const { account } = await import('$lib/appwrite.js');
            try {
                await account.updateName(name);
                const user = await account.get();
                update(s => ({ ...s, user }));
                return user;
            } catch (e) {
                update(s => ({ ...s, error: e.message }));
                throw e;
            }
        },

        /** Clear error */
        clearError() {
            update(s => ({ ...s, error: null }));
        },
    };
}

export const auth = createAuthStore();

/** Derived: is the user registered with an email */
export const isRegistered = derived(auth, ($auth) => {
    if (!$auth.user) return false;
    return !!$auth.user.email;
});

/** Derived: is the user authenticated at all */
export const isAuthenticated = derived(auth, ($auth) => !!$auth.user);
