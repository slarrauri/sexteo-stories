<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import { publishedStories } from "$lib/stores/publishedStories.js";
    import { purchaseRequests } from "$lib/stores/purchaseRequests.js";
    import { page } from "$app/stores";
    import { browser } from "$app/environment";

    let storyId = $state("");
    let story = $state(null);
    let loading = $state(true);
    let error = $state("");
    let liked = $state(false);
    let userId = $state(null);

    // Purchase modal
    let showPurchaseModal = $state(false);
    let receiptFile = $state(null);
    let purchaseMessage = $state("");
    let submitting = $state(false);
    let purchaseSuccess = $state(false);
    let purchaseError = $state("");

    // Check if user has access to paid story
    let hasAccess = $derived(
        !story?.isPaid ||
            story?.publisherId === userId ||
            (story?.accessUserIds || []).includes(userId),
    );

    onMount(() => {
        const unsubPage = page.subscribe((p) => {
            storyId = p.params.storyId;
        });
        const unsub = auth.subscribe(async (state) => {
            if (state.user && storyId) {
                userId = state.user.$id;
                try {
                    story = await publishedStories.loadStory(storyId);
                } catch (e) {
                    error = e.message;
                }
                loading = false;
            }
        });
        return () => {
            unsubPage();
            unsub();
        };
    });

    async function handleLike() {
        if (liked || !storyId) return;
        liked = true;
        await publishedStories.likeStory(storyId);
        if (story) story = { ...story, likeCount: (story.likeCount || 0) + 1 };
    }

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (file) receiptFile = file;
    }

    async function submitPurchase() {
        if (!receiptFile || !userId || !story) return;
        submitting = true;
        purchaseError = "";

        try {
            // Upload receipt file
            let receiptFileId = "";
            if (browser) {
                const { storage, BUCKETS } = await import("$lib/appwrite.js");
                const { ID } = await import("appwrite");
                const uploaded = await storage.createFile(
                    BUCKETS.CHAT_MEDIA,
                    ID.unique(),
                    receiptFile,
                );
                receiptFileId = uploaded.$id;
            }

            // Submit purchase request
            await purchaseRequests.submitRequest({
                storyId: story.$id,
                buyerId: userId,
                publisherId: story.publisherId,
                receiptFileId,
                message: purchaseMessage,
            });

            purchaseSuccess = true;
        } catch (e) {
            purchaseError = e.message || "Error al enviar solicitud";
        } finally {
            submitting = false;
        }
    }

    const intensityLabels = [
        "",
        "Muy Suave",
        "Suave",
        "Medio",
        "Intenso",
        "Extremo",
    ];
</script>

<svelte:head>
    <title>{story?.title || "Historia"} — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 650px; padding-top: var(--space-lg);"
>
    <a href="/home" class="back-link text-muted">← Volver a Historias</a>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else if error}
        <div class="alert alert-error">{error}</div>
    {:else if story}
        <article class="story-article">
            <header class="story-header">
                <div class="story-title-row">
                    <h1 class="story-title">{story.title}</h1>
                    {#if story.isPaid}
                        <span class="paid-badge"
                            >💲 {story.price || "Paga"}</span
                        >
                    {/if}
                </div>
                <div class="story-meta-bar">
                    {#if story.genre}
                        <span class="badge badge-brand">{story.genre}</span>
                    {/if}
                    <span class="meta-item"
                        >🔥 {intensityLabels[story.intensity] || "Medio"}</span
                    >
                    <span class="meta-item"
                        >👁️ {story.readCount || 0} lecturas</span
                    >
                    <span class="meta-item">❤️ {story.likeCount || 0}</span>
                </div>
                {#if story.summary}
                    <p class="story-summary">{story.summary}</p>
                {/if}
            </header>

            {#if story.isPaid && !hasAccess}
                <!-- Paid story lock overlay -->
                <div class="paid-lock">
                    <div class="lock-icon">🔒</div>
                    <h2 class="lock-title">Historia Paga</h2>
                    <p class="lock-price">
                        {story.price || "Precio no especificado"}
                    </p>
                    <p class="text-muted lock-desc">
                        Para leer esta historia, realizá el pago y enviá tu
                        comprobante.
                    </p>

                    <div class="lock-actions">
                        {#if story.paymentLink}
                            <a
                                href={story.paymentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn btn-secondary"
                            >
                                🔗 Ir a pagar
                            </a>
                        {/if}
                        <button
                            class="btn btn-primary"
                            onclick={() => (showPurchaseModal = true)}
                        >
                            ✅ Ya pagué
                        </button>
                    </div>
                </div>
            {:else}
                <!-- Story content (accessible) -->
                <div class="story-content">
                    {#each (story.content || "").split("\n\n") as paragraph}
                        {#if paragraph.startsWith(">")}
                            <blockquote class="narration">
                                {paragraph.slice(1).trim()}
                            </blockquote>
                        {:else if paragraph.startsWith("*")}
                            <p class="action">
                                <em>{paragraph.slice(1).trim()}</em>
                            </p>
                        {:else}
                            <p class="dialogue">
                                {paragraph.replace(/^— ?/, "")}
                            </p>
                        {/if}
                    {/each}
                </div>

                <footer class="story-footer">
                    <button
                        class="like-btn"
                        class:liked
                        onclick={handleLike}
                        disabled={liked}
                    >
                        {liked ? "❤️" : "🤍"}
                        {liked ? "¡Gracias!" : "Me gusta"}
                    </button>
                    <a href="/home" class="btn btn-ghost">Ver más historias</a>
                </footer>
            {/if}
        </article>
    {/if}
</div>

<!-- Purchase Modal -->
{#if showPurchaseModal}
    <div class="modal-overlay" onclick={() => (showPurchaseModal = false)}>
        <div
            class="modal-content animate-in"
            onclick={(e) => e.stopPropagation()}
        >
            {#if purchaseSuccess}
                <div class="modal-success">
                    <span style="font-size: 3rem;">✅</span>
                    <h3>Solicitud enviada</h3>
                    <p class="text-muted">
                        El creador recibirá tu comprobante y habilitará el
                        acceso cuando lo verifique.
                    </p>
                    <button
                        class="btn btn-primary"
                        onclick={() => {
                            showPurchaseModal = false;
                        }}
                    >
                        Entendido
                    </button>
                </div>
            {:else}
                <h2 class="modal-title">📎 Enviar comprobante de pago</h2>
                <p class="text-muted" style="margin-bottom: var(--space-lg);">
                    Adjuntá la captura o comprobante de tu pago. El creador lo
                    revisará y habilitará tu acceso.
                </p>

                {#if purchaseError}
                    <div
                        class="alert alert-error"
                        style="margin-bottom: var(--space-md);"
                    >
                        {purchaseError}
                    </div>
                {/if}

                <div class="form-group">
                    <label for="receipt" class="form-label">Comprobante *</label
                    >
                    <input
                        id="receipt"
                        type="file"
                        accept="image/*,.pdf"
                        class="form-input file-input"
                        onchange={handleFileSelect}
                    />
                    {#if receiptFile}
                        <p
                            class="text-subtle"
                            style="font-size: 0.82rem; margin-top: 4px;"
                        >
                            📎 {receiptFile.name}
                        </p>
                    {/if}
                </div>

                <div class="form-group">
                    <label for="msg" class="form-label"
                        >Mensaje (opcional)</label
                    >
                    <textarea
                        id="msg"
                        class="form-input"
                        bind:value={purchaseMessage}
                        placeholder="Ej: Pagué por Mercado Pago, adjunto comprobante..."
                        rows="2"
                    ></textarea>
                </div>

                <div class="modal-actions">
                    <button
                        class="btn btn-ghost"
                        onclick={() => (showPurchaseModal = false)}
                    >
                        Cancelar
                    </button>
                    <button
                        class="btn btn-primary"
                        disabled={!receiptFile || submitting}
                        onclick={submitPurchase}
                    >
                        {#if submitting}
                            <span class="spinner"></span>
                        {:else}
                            Enviar comprobante
                        {/if}
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .back-link {
        display: inline-block;
        font-size: 0.85rem;
        margin-bottom: var(--space-lg);
        transition: color var(--transition-fast);
    }
    .back-link:hover {
        color: var(--sx-brand-light);
    }

    .story-article {
        padding-bottom: var(--space-3xl);
    }

    .story-header {
        margin-bottom: var(--space-2xl);
        padding-bottom: var(--space-xl);
        border-bottom: 1px solid var(--sx-border);
    }

    .story-title-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-md);
        margin-bottom: var(--space-md);
    }

    .story-title {
        font-family: var(--font-display);
        font-size: 1.8rem;
        line-height: 1.2;
        background: linear-gradient(
            135deg,
            var(--sx-text),
            var(--sx-brand-light)
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        flex: 1;
    }

    .paid-badge {
        flex-shrink: 0;
        padding: 0.35rem 0.75rem;
        border-radius: var(--radius-full);
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        font-weight: 700;
        font-size: 0.85rem;
        white-space: nowrap;
    }

    .story-meta-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-md);
        margin-bottom: var(--space-md);
    }

    .meta-item {
        font-size: 0.82rem;
        color: var(--sx-text-muted);
    }

    .story-summary {
        font-size: 0.95rem;
        color: var(--sx-text-muted);
        font-style: italic;
        line-height: 1.5;
    }

    /* Paid Lock */
    .paid-lock {
        text-align: center;
        padding: var(--space-3xl) var(--space-xl);
        background: var(--sx-bg-card);
        border: 2px dashed var(--sx-border);
        border-radius: var(--radius-lg);
    }

    .lock-icon {
        font-size: 3.5rem;
        margin-bottom: var(--space-md);
    }

    .lock-title {
        font-size: 1.4rem;
        margin-bottom: var(--space-xs);
        background: linear-gradient(135deg, #f59e0b, #d97706);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .lock-price {
        font-size: 1.6rem;
        font-weight: 700;
        color: #f59e0b;
        margin-bottom: var(--space-sm);
    }

    .lock-desc {
        max-width: 360px;
        margin: 0 auto var(--space-xl);
        font-size: 0.9rem;
        line-height: 1.5;
    }

    .lock-actions {
        display: flex;
        gap: var(--space-md);
        justify-content: center;
        flex-wrap: wrap;
    }

    /* Story Content */
    .story-content {
        font-size: 1rem;
        line-height: 1.75;
        color: var(--sx-text);
    }

    .story-content p,
    .story-content blockquote {
        margin-bottom: 1.25em;
    }

    .narration {
        border-left: 3px solid var(--sx-purple);
        padding-left: var(--space-lg);
        color: var(--sx-text-muted);
        font-style: italic;
        margin-left: 0;
    }

    .action {
        color: var(--sx-brand-light);
        padding-left: var(--space-md);
    }

    .dialogue {
        padding-left: var(--space-sm);
    }

    /* Footer */
    .story-footer {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin-top: var(--space-2xl);
        padding-top: var(--space-xl);
        border-top: 1px solid var(--sx-border);
    }

    .like-btn {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        padding: 0.6rem 1.2rem;
        border-radius: var(--radius-full);
        border: 1.5px solid var(--sx-border);
        background: transparent;
        color: var(--sx-text);
        font-family: var(--font-body);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all var(--transition-base);
    }

    .like-btn:hover:not(:disabled) {
        border-color: #e74c6f;
        transform: scale(1.05);
    }

    .like-btn.liked {
        border-color: #e74c6f;
        background: rgba(231, 76, 111, 0.1);
        color: #e74c6f;
        cursor: default;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-lg);
    }

    .modal-content {
        background: var(--sx-bg-elevated, var(--sx-bg-card));
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        max-width: 440px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-title {
        font-size: 1.2rem;
        margin-bottom: var(--space-xs);
    }

    .modal-actions {
        display: flex;
        gap: var(--space-md);
        justify-content: flex-end;
        margin-top: var(--space-xl);
    }

    .modal-success {
        text-align: center;
        padding: var(--space-lg) 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-md);
    }

    .file-input {
        padding: 0.5rem;
    }
</style>
