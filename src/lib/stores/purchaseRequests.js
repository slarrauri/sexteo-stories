/**
 * Purchase Requests Store — Handle paid story purchase flow
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createPurchaseRequestsStore() {
    const { subscribe, set, update } = writable({
        requests: [],
        loading: false,
        error: null,
    });

    return {
        subscribe,

        /**
         * Buyer submits a purchase request with receipt
         */
        async submitRequest({ storyId, buyerId, publisherId, receiptFileId, message }) {
            if (!browser) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                const request = await databases.createDocument(
                    DB.MAIN, COLLECTIONS.PURCHASE_REQUESTS, ID.unique(),
                    {
                        storyId,
                        buyerId,
                        publisherId,
                        receiptFileId: receiptFileId || '',
                        message: message || '',
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                    },
                    [
                        Permission.read(Role.user(buyerId)),
                        Permission.read(Role.user(publisherId)),
                        Permission.update(Role.user(publisherId)),
                    ]
                );

                // Send notification to publisher
                try {
                    await databases.createDocument(
                        DB.MAIN, COLLECTIONS.NOTIFICATIONS, ID.unique(),
                        {
                            userId: publisherId,
                            type: 'PURCHASE_REQUEST',
                            title: '💲 Nueva solicitud de compra',
                            body: 'Un usuario quiere comprar una de tus historias. Revisá el comprobante.',
                            referenceId: request.$id,
                            read: false,
                            createdAt: new Date().toISOString(),
                        },
                        [
                            Permission.read(Role.user(publisherId)),
                            Permission.update(Role.user(publisherId)),
                        ]
                    );
                } catch (e) {
                    console.error('Failed to send notification:', e.message);
                }

                update(s => ({
                    ...s,
                    requests: [request, ...s.requests],
                    loading: false,
                }));

                return request;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /**
         * Publisher loads pending requests for their stories
         */
        async loadMyRequests(publisherId) {
            if (!browser || !publisherId) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { Query } = await import('appwrite');

            try {
                const result = await databases.listDocuments(
                    DB.MAIN, COLLECTIONS.PURCHASE_REQUESTS,
                    [
                        Query.equal('publisherId', publisherId),
                        Query.orderDesc('$createdAt'),
                        Query.limit(50),
                    ]
                );
                set({ requests: result.documents, loading: false, error: null });
                return result.documents;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                return [];
            }
        },

        /**
         * Publisher approves a purchase request — grants access to buyer
         */
        async approveRequest(requestId, storyId, buyerId) {
            if (!browser) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                // 1. Update request status
                await databases.updateDocument(
                    DB.MAIN, COLLECTIONS.PURCHASE_REQUESTS, requestId,
                    { status: 'approved' }
                );

                // 2. Add buyer to story's accessUserIds
                const story = await databases.getDocument(DB.MAIN, COLLECTIONS.STORIES, storyId);
                const currentAccess = story.accessUserIds || [];
                if (!currentAccess.includes(buyerId)) {
                    await databases.updateDocument(
                        DB.MAIN, COLLECTIONS.STORIES, storyId,
                        { accessUserIds: [...currentAccess, buyerId] }
                    );
                }

                // 3. Notify buyer
                try {
                    await databases.createDocument(
                        DB.MAIN, COLLECTIONS.NOTIFICATIONS, ID.unique(),
                        {
                            userId: buyerId,
                            type: 'PURCHASE_APPROVED',
                            title: '✅ Compra aprobada',
                            body: '¡Tu compra fue aprobada! Ya podés leer la historia.',
                            referenceId: storyId,
                            read: false,
                            createdAt: new Date().toISOString(),
                        },
                        [
                            Permission.read(Role.user(buyerId)),
                            Permission.update(Role.user(buyerId)),
                        ]
                    );
                } catch (e) {
                    console.error('Failed to send approval notification:', e.message);
                }

                // 4. Update local state
                update(s => ({
                    ...s,
                    requests: s.requests.map(r =>
                        r.$id === requestId ? { ...r, status: 'approved' } : r
                    ),
                    loading: false,
                }));
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        /**
         * Publisher rejects a purchase request
         */
        async rejectRequest(requestId, buyerId, storyId) {
            if (!browser) return;
            update(s => ({ ...s, loading: true, error: null }));

            const { databases, DB, COLLECTIONS } = await import('$lib/appwrite.js');
            const { ID, Permission, Role } = await import('appwrite');

            try {
                await databases.updateDocument(
                    DB.MAIN, COLLECTIONS.PURCHASE_REQUESTS, requestId,
                    { status: 'rejected' }
                );

                // Notify buyer
                try {
                    await databases.createDocument(
                        DB.MAIN, COLLECTIONS.NOTIFICATIONS, ID.unique(),
                        {
                            userId: buyerId,
                            type: 'PURCHASE_REJECTED',
                            title: '❌ Compra rechazada',
                            body: 'Tu solicitud de compra fue rechazada. Verificá tu comprobante.',
                            referenceId: storyId,
                            read: false,
                            createdAt: new Date().toISOString(),
                        },
                        [
                            Permission.read(Role.user(buyerId)),
                            Permission.update(Role.user(buyerId)),
                        ]
                    );
                } catch (e) {
                    console.error('Failed to send rejection notification:', e.message);
                }

                update(s => ({
                    ...s,
                    requests: s.requests.map(r =>
                        r.$id === requestId ? { ...r, status: 'rejected' } : r
                    ),
                    loading: false,
                }));
            } catch (e) {
                update(s => ({ ...s, loading: false, error: e.message }));
                throw e;
            }
        },

        reset() {
            set({ requests: [], loading: false, error: null });
        },
    };
}

export const purchaseRequests = createPurchaseRequestsStore();
