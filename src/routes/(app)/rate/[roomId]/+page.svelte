<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import { reputation, RATING_TAGS } from "$lib/stores/reputation.js";
    import { page } from "$app/stores";

    let roomId = $state("");
    let userId = $state(null);
    let score = $state(0);
    let selectedTags = $state([]);
    let comment = $state("");
    let submitting = $state(false);
    let alreadyRated = $state(false);
    let error = $state("");
    let success = $state(false);

    // For simplicity: ratedId should come from the room's other participant.
    // We'll use a query param or just show a generic rating form.
    let ratedId = $state("");

    onMount(() => {
        const unsubPage = page.subscribe((p) => {
            roomId = p.params.roomId;
        });
        const unsub = auth.subscribe(async (state) => {
            if (state.user && roomId) {
                userId = state.user.$id;

                // Check if already rated
                const rated = await reputation.hasRated(userId, roomId);
                if (rated) alreadyRated = true;

                // Try to get the other participant from the room
                try {
                    const { databases, DB, COLLECTIONS } = await import(
                        "$lib/appwrite.js"
                    );
                    const room = await databases.getDocument(
                        DB.MAIN,
                        COLLECTIONS.ROOMS,
                        roomId,
                    );
                    const others = (room.participantIds || []).filter(
                        (id) => id !== userId,
                    );
                    if (others.length > 0) ratedId = others[0];
                } catch {}
            }
        });
        return () => {
            unsubPage();
            unsub();
        };
    });

    function setScore(s) {
        score = s;
    }

    function toggleTag(tagId) {
        if (selectedTags.includes(tagId)) {
            selectedTags = selectedTags.filter((t) => t !== tagId);
        } else {
            selectedTags = [...selectedTags, tagId];
        }
    }

    async function submitRating() {
        if (!userId || !ratedId || score === 0) return;
        submitting = true;
        error = "";
        try {
            await reputation.submitRating({
                raterId: userId,
                ratedId,
                roomId,
                score,
                tags: selectedTags,
                comment: comment.trim(),
            });
            success = true;
            setTimeout(() => {
                window.location.href = "/home";
            }, 1500);
        } catch (e) {
            error = e.message || "Error al enviar valoración";
            submitting = false;
        }
    }
</script>

<svelte:head>
    <title>Valorar Narrador — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 480px; padding-top: var(--space-lg);"
>
    {#if alreadyRated}
        <div
            class="card"
            style="text-align: center; padding: var(--space-3xl);"
        >
            <p style="font-size: 2.5rem; margin-bottom: var(--space-md);">✅</p>
            <h2>Ya valoraste esta historia</h2>
            <p class="text-muted" style="margin-top: var(--space-sm);">
                Gracias por tu feedback
            </p>
            <a
                href="/home"
                class="btn btn-primary"
                style="margin-top: var(--space-lg);">Volver al inicio</a
            >
        </div>
    {:else if success}
        <div
            class="card"
            style="text-align: center; padding: var(--space-3xl);"
        >
            <p style="font-size: 3rem; margin-bottom: var(--space-md);">🎉</p>
            <h2>¡Gracias por tu valoración!</h2>
            <p class="text-muted" style="margin-top: var(--space-sm);">
                Redirigiendo...
            </p>
        </div>
    {:else}
        <div class="rate-header">
            <span style="font-size: 3rem;">⭐</span>
            <h1>Valorar Narrador</h1>
            <p class="text-muted">¿Cómo fue tu experiencia narrativa?</p>
        </div>

        {#if error}
            <div
                class="alert alert-error"
                style="margin-bottom: var(--space-lg);"
            >
                {error}
            </div>
        {/if}

        <!-- Stars -->
        <div class="stars-section">
            <div class="star-row">
                {#each [1, 2, 3, 4, 5] as s}
                    <button
                        class="star-btn"
                        class:filled={s <= score}
                        onclick={() => setScore(s)}
                    >
                        <span>{s <= score ? "⭐" : "☆"}</span>
                    </button>
                {/each}
            </div>
            {#if score > 0}
                <span class="score-label text-muted">
                    {score === 5
                        ? "¡Extraordinario!"
                        : score === 4
                          ? "Muy bueno"
                          : score === 3
                            ? "Bien"
                            : score === 2
                              ? "Regular"
                              : "Malo"}
                </span>
            {/if}
        </div>

        <!-- Tags -->
        <div class="tags-section">
            <label class="form-label">¿Qué destacás? (opcional)</label>
            <div class="chip-grid">
                {#each RATING_TAGS as tag}
                    {@const active = selectedTags.includes(tag.id)}
                    <button
                        type="button"
                        class="chip"
                        class:active
                        onclick={() => toggleTag(tag.id)}
                        title={tag.desc}
                    >
                        {tag.label}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Comment -->
        <div class="form-group" style="margin-bottom: var(--space-xl);">
            <label class="form-label">Comentario (opcional)</label>
            <textarea
                class="form-input"
                rows="3"
                bind:value={comment}
                placeholder="Contá cómo fue tu experiencia..."
                maxlength="300"
            ></textarea>
            <span class="text-subtle" style="font-size: 0.75rem;"
                >{comment.length}/300</span
            >
        </div>

        <button
            class="btn btn-primary btn-block btn-lg"
            onclick={submitRating}
            disabled={score === 0 || submitting || !ratedId}
        >
            {#if submitting}
                <span class="spinner"></span>
            {:else}
                ⭐ Enviar Valoración
            {/if}
        </button>

        {#if !ratedId}
            <p
                class="text-subtle"
                style="text-align: center; margin-top: var(--space-sm); font-size: 0.82rem;"
            >
                No se pudo identificar al otro participante
            </p>
        {/if}
    {/if}
</div>

<style>
    .rate-header {
        text-align: center;
        margin-bottom: var(--space-2xl);
    }

    .rate-header h1 {
        font-size: 1.5rem;
        margin-top: var(--space-sm);
    }

    /* Stars */
    .stars-section {
        text-align: center;
        margin-bottom: var(--space-2xl);
    }

    .star-row {
        display: flex;
        justify-content: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
    }

    .star-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid var(--sx-border);
        background: var(--sx-bg-card);
        font-size: 1.4rem;
        cursor: pointer;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .star-btn:hover {
        transform: scale(1.15);
        border-color: var(--sx-brand);
    }

    .star-btn.filled {
        border-color: #fbbf24;
        background: rgba(251, 191, 36, 0.1);
        box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
    }

    .score-label {
        font-size: 0.9rem;
        font-weight: 600;
    }

    /* Tags */
    .tags-section {
        margin-bottom: var(--space-xl);
    }

    .chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
        margin-top: var(--space-sm);
    }

    .chip {
        padding: 0.4rem 0.8rem;
        border: 1.5px solid var(--sx-border);
        border-radius: var(--radius-full);
        background: transparent;
        color: var(--sx-text-muted);
        font-family: var(--font-body);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .chip:hover {
        border-color: var(--sx-brand);
        color: var(--sx-text);
    }

    .chip.active {
        background: rgba(233, 30, 99, 0.12);
        border-color: var(--sx-brand);
        color: var(--sx-brand-light);
        font-weight: 600;
    }
</style>
