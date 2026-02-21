<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import { publishedStories } from "$lib/stores/publishedStories.js";
    import { GENRE_OPTIONS } from "$lib/stores/narrative-profile.js";

    let userId = $state(null);
    let stories = $state([]);
    let loading = $state(true);
    let activeTab = $state("public"); // 'public' | 'mine'
    let selectedGenre = $state("");

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                userId = state.user.$id;
                await loadStories();
            }
        });

        const unsubStories = publishedStories.subscribe((s) => {
            stories = s.stories || [];
            loading = s.loading;
        });

        return () => {
            unsub();
            unsubStories();
        };
    });

    async function loadStories() {
        if (activeTab === "public") {
            await publishedStories.loadPublicStories({
                genre: selectedGenre || undefined,
            });
        } else if (userId) {
            await publishedStories.loadMyStories(userId);
        }
    }

    async function switchTab(tab) {
        activeTab = tab;
        selectedGenre = "";
        await loadStories();
    }

    async function filterGenre(genre) {
        selectedGenre = genre;
        await loadStories();
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
    <title>Historias — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 650px; padding-top: var(--space-lg);"
>
    <h1 style="margin-bottom: var(--space-xs);">📚 Historias</h1>
    <p class="text-muted" style="margin-bottom: var(--space-xl);">
        Leé y descubrí narrativas publicadas por la comunidad
    </p>

    <!-- Tabs -->
    <div class="tabs">
        <button
            class="tab"
            class:active={activeTab === "public"}
            onclick={() => switchTab("public")}
        >
            🌍 Públicas
        </button>
        <button
            class="tab"
            class:active={activeTab === "mine"}
            onclick={() => switchTab("mine")}
        >
            📝 Mis Historias
        </button>
    </div>

    <!-- Genre Filter (public only) -->
    {#if activeTab === "public"}
        <div class="genre-filter">
            <button
                class="genre-chip"
                class:active={selectedGenre === ""}
                onclick={() => filterGenre("")}>Todas</button
            >
            {#each GENRE_OPTIONS as g}
                <button
                    class="genre-chip"
                    class:active={selectedGenre === g}
                    onclick={() => filterGenre(g)}>{g}</button
                >
            {/each}
        </div>
    {/if}

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else if stories.length === 0}
        <div
            class="card"
            style="text-align: center; padding: var(--space-3xl); border-style: dashed;"
        >
            <p style="font-size: 2.5rem; margin-bottom: var(--space-md);">📖</p>
            <p class="text-muted">
                {activeTab === "mine"
                    ? "No publicaste historias todavía"
                    : "No hay historias publicadas aún"}
            </p>
        </div>
    {:else}
        <div class="story-grid">
            {#each stories as story, i}
                <a
                    href="/stories/{story.$id}"
                    class="story-card"
                    style="animation-delay: {i * 0.04}s"
                >
                    <div class="story-card-header">
                        <h3 class="story-title">{story.title}</h3>
                        {#if story.genre}
                            <span class="badge badge-brand">{story.genre}</span>
                        {/if}
                    </div>
                    {#if story.summary}
                        <p class="story-summary text-subtle">{story.summary}</p>
                    {/if}
                    <div class="story-meta">
                        <span
                            >🔥 {intensityLabels[story.intensity] ||
                                "Medio"}</span
                        >
                        <span>👁️ {story.readCount || 0}</span>
                        <span>❤️ {story.likeCount || 0}</span>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>

<style>
    .tabs {
        display: flex;
        gap: 2px;
        background: var(--sx-bg-input);
        border-radius: var(--radius-lg);
        padding: 3px;
        margin-bottom: var(--space-lg);
    }

    .tab {
        flex: 1;
        padding: 0.6rem;
        border: none;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--sx-text-muted);
        font-family: var(--font-body);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .tab.active {
        background: var(--sx-bg-card);
        color: var(--sx-brand-light);
        box-shadow: var(--shadow-sm);
    }

    .genre-filter {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
        margin-bottom: var(--space-xl);
    }

    .genre-chip {
        padding: 0.3rem 0.65rem;
        border: 1.5px solid var(--sx-border);
        border-radius: var(--radius-full);
        background: transparent;
        color: var(--sx-text-muted);
        font-family: var(--font-body);
        font-size: 0.78rem;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .genre-chip:hover {
        border-color: var(--sx-brand);
        color: var(--sx-text);
    }

    .genre-chip.active {
        background: rgba(233, 30, 99, 0.12);
        border-color: var(--sx-brand);
        color: var(--sx-brand-light);
        font-weight: 600;
    }

    .story-grid {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .story-card {
        display: block;
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        text-decoration: none;
        transition: all var(--transition-base);
        opacity: 0;
        animation: fadeInUp 0.3s ease forwards;
    }

    .story-card:hover {
        border-color: var(--sx-brand);
        transform: translateY(-2px);
        box-shadow: var(--shadow-glow);
    }

    .story-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
    }

    .story-title {
        font-family: var(--font-display);
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--sx-text);
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .story-summary {
        font-size: 0.85rem;
        line-height: 1.4;
        margin-bottom: var(--space-md);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .story-meta {
        display: flex;
        gap: var(--space-lg);
        font-size: 0.8rem;
        color: var(--sx-text-muted);
    }
</style>
