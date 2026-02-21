<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import {
        reputation,
        RATING_TAGS,
        KARMA_LEVELS,
    } from "$lib/stores/reputation.js";

    let userId = $state(null);
    let karma = $state(null);
    let ratings = $state([]);
    let loading = $state(true);

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                userId = state.user.$id;
                await reputation.getUserReputation(userId);
            }
        });

        const unsubRep = reputation.subscribe((s) => {
            karma = s.karma;
            ratings = s.ratings || [];
            loading = s.loading;
        });

        return () => {
            unsub();
            unsubRep();
        };
    });

    function getLevel(level) {
        return KARMA_LEVELS[level] || KARMA_LEVELS.nuevo;
    }

    function getTagInfo(tagId) {
        return (
            RATING_TAGS.find((t) => t.id === tagId) || {
                label: tagId,
                desc: "",
            }
        );
    }

    function timeAgo(dateStr) {
        if (!dateStr) return "";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `hace ${Math.max(1, mins)}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `hace ${hrs}h`;
        return `hace ${Math.floor(hrs / 24)}d`;
    }
</script>

<svelte:head>
    <title>Reputación — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 560px; padding-top: var(--space-lg);"
>
    <h1 style="margin-bottom: var(--space-xs);">⭐ Mi Reputación</h1>
    <p class="text-muted" style="margin-bottom: var(--space-xl);">
        Tu karma narrativo y las valoraciones que recibiste
    </p>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else if karma}
        {@const levelInfo = getLevel(karma.level)}

        <!-- Karma Header -->
        <div class="karma-header">
            <div class="karma-ring" style="--level-color: {levelInfo.color}">
                <span class="karma-score">{karma.score}</span>
                <span class="karma-max">/5</span>
            </div>
            <div class="karma-meta">
                <span class="karma-level" style="color: {levelInfo.color}">
                    {levelInfo.emoji}
                    {levelInfo.label}
                </span>
                <span class="text-subtle"
                    >{karma.total} valoracion{karma.total !== 1 ? "es" : ""} · Promedio
                    {karma.average}</span
                >
            </div>
        </div>

        <!-- Tag Bars -->
        {#if Object.keys(karma.tags).length > 0}
            <section class="rep-section">
                <h3 class="section-title">🏷️ Habilidades Reconocidas</h3>
                <div class="tag-bars">
                    {#each RATING_TAGS as tag}
                        {@const count = karma.tags[tag.id] || 0}
                        {@const maxCount = Math.max(
                            ...Object.values(karma.tags),
                            1,
                        )}
                        <div class="tag-bar-row">
                            <span class="tag-bar-label">{tag.label}</span>
                            <div class="tag-bar-track">
                                <div
                                    class="tag-bar-fill"
                                    style="width: {(count / maxCount) * 100}%"
                                ></div>
                            </div>
                            <span class="tag-bar-count">{count}</span>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- Recent Ratings -->
        <section class="rep-section">
            <h3 class="section-title">💬 Valoraciones Recibidas</h3>
            {#if ratings.length === 0}
                <div
                    class="card"
                    style="text-align: center; padding: var(--space-xl); border-style: dashed;"
                >
                    <p class="text-muted">Todavía no recibiste valoraciones</p>
                </div>
            {:else}
                <div class="rating-list">
                    {#each ratings.slice(0, 20) as r, i}
                        <div
                            class="rating-card"
                            style="animation-delay: {i * 0.03}s"
                        >
                            <div class="rating-header">
                                <span class="rating-stars"
                                    >{"⭐".repeat(r.score)}</span
                                >
                                <span class="text-subtle rating-time"
                                    >{timeAgo(r.createdAt)}</span
                                >
                            </div>
                            {#if r.tags}
                                {@const tags = (() => {
                                    try {
                                        return JSON.parse(r.tags);
                                    } catch {
                                        return [];
                                    }
                                })()}
                                {#if tags.length > 0}
                                    <div class="rating-tags">
                                        {#each tags as t}
                                            <span class="mini-chip"
                                                >{getTagInfo(t).label}</span
                                            >
                                        {/each}
                                    </div>
                                {/if}
                            {/if}
                            {#if r.comment}
                                <p class="rating-comment">"{r.comment}"</p>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </section>
    {:else}
        <div
            class="card"
            style="text-align: center; padding: var(--space-3xl); border-style: dashed;"
        >
            <p style="font-size: 2.5rem; margin-bottom: var(--space-md);">🌱</p>
            <p class="text-muted">
                Tu reputación se construye cuando otros narradores te valoran
                después de una historia.
            </p>
        </div>
    {/if}
</div>

<style>
    .karma-header {
        display: flex;
        align-items: center;
        gap: var(--space-xl);
        margin-bottom: var(--space-2xl);
        padding: var(--space-xl);
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-xl);
    }

    .karma-ring {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        border: 4px solid var(--level-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 0 20px
            color-mix(in srgb, var(--level-color) 25%, transparent);
    }

    .karma-score {
        font-size: 2rem;
        font-weight: 800;
        line-height: 1;
    }

    .karma-max {
        font-size: 0.7rem;
        color: var(--sx-text-subtle);
    }

    .karma-meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }

    .karma-level {
        font-size: 1.2rem;
        font-weight: 700;
    }

    .rep-section {
        margin-bottom: var(--space-2xl);
    }

    .section-title {
        font-family: var(--font-body);
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: var(--space-md);
    }

    /* Tag Bars */
    .tag-bars {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .tag-bar-row {
        display: flex;
        align-items: center;
        gap: var(--space-md);
    }

    .tag-bar-label {
        width: 130px;
        font-size: 0.85rem;
        flex-shrink: 0;
    }

    .tag-bar-track {
        flex: 1;
        height: 8px;
        background: var(--sx-bg-input);
        border-radius: 4px;
        overflow: hidden;
    }

    .tag-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--sx-brand), var(--sx-purple));
        border-radius: 4px;
        transition: width 0.6s ease;
        min-width: 4px;
    }

    .tag-bar-count {
        width: 28px;
        text-align: right;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--sx-text-muted);
    }

    /* Rating list */
    .rating-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .rating-card {
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-md);
        padding: var(--space-md) var(--space-lg);
        opacity: 0;
        animation: fadeInUp 0.3s ease forwards;
    }

    .rating-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-xs);
    }

    .rating-stars {
        font-size: 0.9rem;
    }

    .rating-time {
        font-size: 0.75rem;
    }

    .rating-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: var(--space-xs);
    }

    .mini-chip {
        padding: 0.1rem 0.45rem;
        border-radius: var(--radius-full);
        background: var(--sx-bg-input);
        font-size: 0.72rem;
        color: var(--sx-text-muted);
    }

    .rating-comment {
        font-size: 0.88rem;
        color: var(--sx-text-muted);
        font-style: italic;
        line-height: 1.4;
    }
</style>
