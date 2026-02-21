<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import { userProfile } from "$lib/stores/user-profile.js";
    import { rooms } from "$lib/stores/rooms.js";
    import { reputation, KARMA_LEVELS } from "$lib/stores/reputation.js";
    import { publishedStories } from "$lib/stores/publishedStories.js";
    import { GENRE_OPTIONS } from "$lib/stores/narrative-profile.js";

    let user = $state(null);
    let profile = $state(null);
    let karma = $state(null);

    // Stories
    let stories = $state([]);
    let loadingStories = $state(true);
    let activeTab = $state("activas"); // 'activas' | 'publicas' | 'compartidas' | 'mis'
    let searchQuery = $state("");
    let selectedGenre = $state("");
    let searchTimeout = null;

    // Active rooms (for "Activas" tab)
    let activeRooms = $state([]);
    let loadingRooms = $state(true);

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                user = state.user;
                await userProfile.loadProfile(state.user.$id);

                // Load active rooms
                try {
                    await rooms.loadMyRooms(state.user.$id);
                } catch {}

                // Load karma
                try {
                    karma = await reputation.getUserReputation(state.user.$id);
                } catch {}

                // Load initial tab
                await loadContent();
            }
        });

        const unsubProfile = userProfile.subscribe((state) => {
            profile = state.profile;
        });

        const unsubRooms = rooms.subscribe((state) => {
            activeRooms = (state.rooms || []).filter(
                (r) => r.status === "ACTIVE",
            );
            loadingRooms = state.loading;
        });

        const unsubStories = publishedStories.subscribe((s) => {
            stories = s.stories || [];
            loadingStories = s.loading;
        });

        return () => {
            unsub();
            unsubProfile();
            unsubRooms();
            unsubStories();
        };
    });

    async function loadContent() {
        if (activeTab === "activas") {
            // Active rooms are already loaded via rooms store
            loadingStories = false;
        } else if (activeTab === "publicas") {
            await publishedStories.loadPublicStories({
                genre: selectedGenre || undefined,
                search: searchQuery || undefined,
            });
        } else if (activeTab === "compartidas" && user) {
            await publishedStories.loadSharedStories(user.$id);
        } else if (activeTab === "mis" && user) {
            await publishedStories.loadMyStories(user.$id);
        }
    }

    async function switchTab(tab) {
        activeTab = tab;
        selectedGenre = "";
        searchQuery = "";
        await loadContent();
    }

    async function filterGenre(genre) {
        selectedGenre = genre;
        await loadContent();
    }

    function handleSearchInput(e) {
        searchQuery = e.target.value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadContent();
        }, 400);
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

<div class="home container animate-in">
    <header class="home-header">
        <div>
            <h1 class="home-greeting">
                Hola, <span class="text-brand">{user?.name || "Narrador"}</span>
                👋
            </h1>
            <p class="text-muted">¿Qué historia querés vivir hoy?</p>
        </div>
        {#if karma}
            {@const lvl = KARMA_LEVELS[karma.level] || KARMA_LEVELS.nuevo}
            <a href="/reputation" class="karma-badge" style="--kc: {lvl.color}">
                {lvl.emoji}
                {karma.score}
            </a>
        {:else if profile}
            <span class="badge badge-brand"
                >{profile.globalState || "ACTIVO"}</span
            >
        {/if}
    </header>

    <!-- Search -->
    <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
            type="text"
            class="search-input"
            placeholder="Buscar historias..."
            value={searchQuery}
            oninput={handleSearchInput}
        />
    </div>

    <!-- Tabs -->
    <div class="tabs">
        <button
            class="tab"
            class:active={activeTab === "activas"}
            onclick={() => switchTab("activas")}
        >
            💬 Activas
        </button>
        <button
            class="tab"
            class:active={activeTab === "publicas"}
            onclick={() => switchTab("publicas")}
        >
            🌍 Públicas
        </button>
        <button
            class="tab"
            class:active={activeTab === "compartidas"}
            onclick={() => switchTab("compartidas")}
        >
            🔗 Compartidas
        </button>
        <button
            class="tab"
            class:active={activeTab === "mis"}
            onclick={() => switchTab("mis")}
        >
            📝 Mis Historias
        </button>
    </div>

    <!-- Genre Filter (for publicas tab) -->
    {#if activeTab === "publicas"}
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

    <!-- Content -->
    {#if activeTab === "activas"}
        <!-- Active Stories (Rooms) -->
        {#if loadingRooms}
            <div class="loading-center">
                <div class="spinner"></div>
            </div>
        {:else if activeRooms.length === 0}
            <div class="card placeholder-card">
                <p style="font-size: 2rem; margin-bottom: var(--space-md);">
                    💬
                </p>
                <p class="text-muted">No tenés historias activas todavía.</p>
                <p
                    class="text-subtle"
                    style="font-size: 0.85rem; margin-top: 0.5rem;"
                >
                    Cuando hagas match, tus historias aparecerán acá.
                </p>
            </div>
        {:else}
            <div class="room-list">
                {#each activeRooms as room}
                    <a href="/chat/{room.$id}" class="room-card">
                        <div class="room-info">
                            <span class="room-title"
                                >{room.title || "Historia sin título"}</span
                            >
                            <span
                                class="text-subtle"
                                style="font-size: 0.82rem;"
                            >
                                {room.genre || "Sin género"} · Intensidad {room.intensity}/5
                            </span>
                        </div>
                        <span class="room-arrow">→</span>
                    </a>
                {/each}
            </div>
        {/if}
    {:else}
        <!-- Stories Lists (publicas, compartidas, mis) -->
        {#if loadingStories}
            <div class="loading-center">
                <div class="spinner"></div>
            </div>
        {:else if stories.length === 0}
            <div class="card placeholder-card">
                <p style="font-size: 2rem; margin-bottom: var(--space-md);">
                    📖
                </p>
                <p class="text-muted">
                    {#if activeTab === "mis"}
                        No publicaste historias todavía
                    {:else if activeTab === "compartidas"}
                        No tenés historias compartidas
                    {:else}
                        No hay historias publicadas aún
                    {/if}
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
                            <div
                                style="display: flex; gap: 4px; align-items: center;"
                            >
                                {#if story.isPaid}
                                    <span class="badge-paid">💲</span>
                                {/if}
                                {#if story.genre}
                                    <span class="badge badge-brand"
                                        >{story.genre}</span
                                    >
                                {/if}
                            </div>
                        </div>
                        {#if story.summary}
                            <p class="story-summary text-subtle">
                                {story.summary}
                            </p>
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
    {/if}
</div>

<style>
    .home {
        max-width: 700px;
        padding-top: var(--space-lg);
    }

    .home-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: var(--space-xl);
    }

    .home-greeting {
        font-size: 1.6rem;
        margin-bottom: var(--space-xs);
    }

    /* Search */
    .search-bar {
        position: relative;
        margin-bottom: var(--space-lg);
    }

    .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.95rem;
        pointer-events: none;
    }

    .search-input {
        width: 100%;
        padding: 0.7rem 0.7rem 0.7rem 2.4rem;
        background: var(--sx-bg-input, var(--sx-bg-card));
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        color: var(--sx-text);
        font-family: var(--font-body);
        font-size: 0.92rem;
        transition: border-color var(--transition-fast);
    }

    .search-input::placeholder {
        color: var(--sx-text-muted);
    }

    .search-input:focus {
        outline: none;
        border-color: var(--sx-brand);
    }

    /* Tabs */
    .tabs {
        display: flex;
        gap: 2px;
        background: var(--sx-bg-input, var(--sx-bg-card));
        border-radius: var(--radius-lg);
        padding: 3px;
        margin-bottom: var(--space-lg);
    }

    .tab {
        flex: 1;
        padding: 0.55rem 0.3rem;
        border: none;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--sx-text-muted);
        font-family: var(--font-body);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        white-space: nowrap;
    }

    .tab.active {
        background: var(--sx-bg-card);
        color: var(--sx-brand-light);
        box-shadow: var(--shadow-sm);
    }

    /* Genre Filter */
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

    /* Loading */
    .loading-center {
        display: flex;
        justify-content: center;
        padding: var(--space-3xl);
    }

    .placeholder-card {
        text-align: center;
        padding: var(--space-2xl);
        border-style: dashed;
    }

    /* Room list */
    .room-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .room-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-md) var(--space-lg);
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        text-decoration: none;
        transition: all var(--transition-base);
    }

    .room-card:hover {
        border-color: var(--sx-brand);
        transform: translateX(4px);
    }

    .room-title {
        display: block;
        font-weight: 600;
        color: var(--sx-text);
        font-size: 0.95rem;
    }

    .room-arrow {
        font-size: 1.2rem;
        color: var(--sx-text-muted);
    }

    /* Story grid */
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

    .karma-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 0.3rem 0.7rem;
        border-radius: var(--radius-full);
        border: 2px solid var(--kc);
        background: color-mix(in srgb, var(--kc) 10%, transparent);
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--kc);
        text-decoration: none;
        transition: all var(--transition-fast);
    }

    .karma-badge:hover {
        transform: scale(1.05);
        box-shadow: 0 0 12px color-mix(in srgb, var(--kc) 30%, transparent);
    }

    .badge-paid {
        padding: 0.2rem 0.4rem;
        border-radius: var(--radius-full);
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        font-weight: 700;
        font-size: 0.72rem;
        white-space: nowrap;
    }

    @media (max-width: 500px) {
        .tab {
            font-size: 0.72rem;
            padding: 0.5rem 0.2rem;
        }
    }
</style>
