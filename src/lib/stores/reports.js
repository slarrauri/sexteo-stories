/**
 * Reports Store — User reporting system
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createReportsStore() {
    const { subscribe, set, update } = writable({
        submitting: false,
        error: null,
        success: false,
    });

    return {
        subscribe,

        /** Create a report */
        async createReport(reporterId, reportedId, roomId, reason, description) {
            if (!browser) return;
            update(s => ({ ...s, submitting: true, error: null, success: false }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                const report = await databases.createDocument(
                    DB.MAIN, COLLECTIONS.REPORTS, ID.unique(),
                    {
                        reporterId,
                        reportedId,
                        roomId: roomId || '',
                        reason,
                        description: description || '',
                        status: 'OPEN',
                        createdAt: new Date().toISOString(),
                    },
                    [
                        Permission.read(Role.user(reporterId)),
                    ]
                );

                set({ submitting: false, error: null, success: true });
                return report;
            } catch (e) {
                update(s => ({ ...s, submitting: false, error: e.message, success: false }));
                throw e;
            }
        },

        reset() {
            set({ submitting: false, error: null, success: false });
        },
    };
}

export const reports = createReportsStore();
