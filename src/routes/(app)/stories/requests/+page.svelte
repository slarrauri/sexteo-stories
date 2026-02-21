<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import { purchaseRequests } from "$lib/stores/purchaseRequests.js";
    import { browser } from "$app/environment";

    let user = $state(null);
    let requests = $state([]);
    let loading = $state(true);
    let storyCache = $state({});
    let processingId = $state(null);
    let activeFilter = $state("pending"); // pending | approved | rejected | all

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                user = state.user;
                await loadRequests();
            }
        });
        const unsubReqs = purchaseRequests.subscribe((s) => {
            requests = s.requests || [];
            loading = s.loading;
        });
        return () => {
            unsub();
            unsubReqs();
        };
    });

    async function loadRequests() {
        if (!user) return;
        const reqs = await purchaseRequests.loadMyRequests(user.$id);

        // Load story titles for each request
        if (browser && reqs?.length) {
            const { databases, DB, COLLECTIONS } = await import(
                "$lib/appwrite.js"
            );
            const storyIds = [...new Set(reqs.map((r) => r.storyId))];
            for (const sid of storyIds) {
                try {
                    const story = await databases.getDocument(
                        DB.MAIN,
                        COLLECTIONS.STORIES,
                        sid,
                    );
                    storyCache[sid] = story;
                } catch {}
            }
            storyCache = { ...storyCache };
        }
    }

    let filteredRequests = $derived(
        activeFilter === "all"
            ? requests
            : requests.filter((r) => r.status === activeFilter),
    );

    async function handleApprove(req) {
        processingId = req.$id;
        try {
            await purchaseRequests.approveRequest(
                req.$id,
                req.storyId,
                req.buyerId,
            );
        } catch (e) {
            console.error(e);
        }
        processingId = null;
    }

    async function handleReject(req) {
        if (!confirm("¿Rechazar esta solicitud?")) return;
        processingId = req.$id;
        try {
            await purchaseRequests.rejectRequest(
                req.$id,
                req.buyerId,
                req.storyId,
            );
        } catch (e) {
            console.error(e);
        }
        processingId = null;
    }

    function getReceiptUrl(fileId) {
        if (!fileId || !browser) return null;
        // Build Appwrite file preview URL
        try {
            const endpoint =
                import.meta.env.VITE_APPWRITE_ENDPOINT ||
                "https://cloud.appwrite.io/v1";
            const proj = import.meta.env.VITE_APPWRITE_PROJECT;
            return `${endpoint}/storage/buckets/chat_media/files/${fileId}/view?project=${proj}`;
        } catch {
            return null;
        }
    }
</script>

<svelte:head>
    <title>Solicitudes de Compra — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 650px; padding-top: var(--space-lg);"
>
    <header class="req-header">
        <div>
            <h1>💲 Solicitudes de Compra</h1>
            <p class="text-muted">
                Revisá los comprobantes y habilitá acceso a tus historias pagas
            </p>
        </div>
    </header>

    <!-- Filter tabs -->
    <div class="filter-tabs">
        <button
            class="filter-tab"
            class:active={activeFilter === "pending"}
            onclick={() => (activeFilter = "pending")}
        >
            ⏳ Pendientes
        </button>
        <button
            class="filter-tab"
            class:active={activeFilter === "approved"}
            onclick={() => (activeFilter = "approved")}
        >
            ✅ Aprobadas
        </button>
        <button
            class="filter-tab"
            class:active={activeFilter === "rejected"}
            onclick={() => (activeFilter = "rejected")}
        >
            ❌ Rechazadas
        </button>
        <button
            class="filter-tab"
            class:active={activeFilter === "all"}
            onclick={() => (activeFilter = "all")}
        >
            Todas
        </button>
    </div>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else if filteredRequests.length === 0}
        <div
            class="card"
            style="text-align: center; padding: var(--space-3xl); border-style: dashed;"
        >
            <p style="font-size: 2rem; margin-bottom: var(--space-md);">📭</p>
            <p class="text-muted">
                No hay solicitudes {activeFilter === "pending"
                    ? "pendientes"
                    : activeFilter === "all"
                      ? ""
                      : activeFilter === "approved"
                        ? "aprobadas"
                        : "rechazadas"}
            </p>
        </div>
    {:else}
        <div class="req-list">
            {#each filteredRequests as req, i}
                {@const story = storyCache[req.storyId]}
                <div
                    class="req-card"
                    class:approved={req.status === "approved"}
                    class:rejected={req.status === "rejected"}
                    style="animation-delay: {i * 0.04}s"
                >
                    <div class="req-top">
                        <div class="req-info">
                            <span class="req-story-title">
                                📖 {story?.title || "Historia"}
                            </span>
                            <span
                                class="text-subtle"
                                style="font-size: 0.8rem;"
                            >
                                Comprador: {req.buyerId.slice(0, 8)}…
                            </span>
                        </div>
                        <span
                            class="status-badge"
                            class:status-pending={req.status === "pending"}
                            class:status-approved={req.status === "approved"}
                            class:status-rejected={req.status === "rejected"}
                        >
                            {req.status === "pending"
                                ? "⏳ Pendiente"
                                : req.status === "approved"
                                  ? "✅ Aprobada"
                                  : "❌ Rechazada"}
                        </span>
                    </div>

                    {#if req.message}
                        <p class="req-message">{req.message}</p>
                    {/if}

                    {#if req.receiptFileId}
                        {@const url = getReceiptUrl(req.receiptFileId)}
                        {#if url}
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="receipt-link"
                            >
                                📎 Ver comprobante
                            </a>
                        {/if}
                    {/if}

                    {#if req.status === "pending"}
                        <div class="req-actions">
                            <button
                                class="btn btn-primary btn-sm"
                                disabled={processingId === req.$id}
                                onclick={() => handleApprove(req)}
                            >
                                {processingId === req.$id
                                    ? "..."
                                    : "✅ Habilitar acceso"}
                            </button>
                            <button
                                class="btn btn-ghost btn-sm"
                                style="color: var(--sx-error);"
                                disabled={processingId === req.$id}
                                onclick={() => handleReject(req)}
                            >
                                ❌ Rechazar
                            </button>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .req-header {
        margin-bottom: var(--space-xl);
    }

    .filter-tabs {
        display: flex;
        gap: 2px;
        background: var(--sx-bg-input, var(--sx-bg-card));
        border-radius: var(--radius-lg);
        padding: 3px;
        margin-bottom: var(--space-xl);
    }

    .filter-tab {
        flex: 1;
        padding: 0.5rem 0.3rem;
        border: none;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--sx-text-muted);
        font-family: var(--font-body);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .filter-tab.active {
        background: var(--sx-bg-card);
        color: var(--sx-brand-light);
        box-shadow: var(--shadow-sm);
    }

    .req-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .req-card {
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        transition: all var(--transition-base);
        opacity: 0;
        animation: fadeInUp 0.3s ease forwards;
    }

    .req-card.approved {
        border-color: rgba(34, 197, 94, 0.3);
    }

    .req-card.rejected {
        opacity: 0.6;
    }

    .req-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-md);
        margin-bottom: var(--space-sm);
    }

    .req-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .req-story-title {
        font-weight: 600;
        color: var(--sx-text);
    }

    .status-badge {
        flex-shrink: 0;
        padding: 0.25rem 0.55rem;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
    }

    .status-pending {
        background: rgba(245, 158, 11, 0.12);
        color: #f59e0b;
    }

    .status-approved {
        background: rgba(34, 197, 94, 0.12);
        color: #22c55e;
    }

    .status-rejected {
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
    }

    .req-message {
        font-size: 0.88rem;
        color: var(--sx-text-muted);
        line-height: 1.4;
        margin-bottom: var(--space-sm);
        padding: var(--space-sm);
        background: var(--sx-bg-input, var(--sx-bg));
        border-radius: var(--radius-md);
    }

    .receipt-link {
        display: inline-block;
        font-size: 0.85rem;
        color: var(--sx-brand-light);
        margin-bottom: var(--space-md);
        transition: color var(--transition-fast);
    }

    .receipt-link:hover {
        color: var(--sx-brand);
    }

    .req-actions {
        display: flex;
        gap: var(--space-sm);
        margin-top: var(--space-md);
    }
</style>
