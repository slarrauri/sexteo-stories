<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { auth } from "$lib/stores/auth.js";

    let characters = $state([]);
    let loading = $state(true);
    let userId = $state(null);
    let isMineMode = $state(false);
    let searchQuery = $state("");
    let searchTimeout = null;
    let selectedStyle = $state("");

    const NARRATIVE_STYLES = [
        "Poético",
        "Directo",
        "Descriptivo",
        "Minimalista",
    ];

    onMount(() => {
        // Check if mine=true in query params
        if (browser) {
            const params = new URLSearchParams(window.location.search);
            isMineMode = params.get("mine") === "true";
        }

        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                userId = state.user.$id;
                await loadCharacters();
            }
        });
        return unsub;
    });

    async function loadCharacters() {
        if (!browser) return;
        loading = true;
        const { databases, DB, COLLECTIONS } = await import("$lib/appwrite.js");
        const { Query } = await import("appwrite");

        try {
            const queries = [];

            if (isMineMode) {
                // My characters
                queries.push(Query.equal("userId", userId));
            } else {
                // Public characters from all users
                queries.push(Query.equal("visibility", "public"));
            }

            if (searchQuery) {
                queries.push(Query.search("name", searchQuery));
            }

            if (selectedStyle) {
                queries.push(Query.equal("narrativeStyle", selectedStyle));
            }

            queries.push(Query.orderDesc("createdAt"));
            queries.push(Query.limit(50));

            const res = await databases.listDocuments(
                DB.MAIN,
                COLLECTIONS.CHARACTERS,
                queries,
            );
            characters = res.documents;
        } catch (e) {
            console.error("Error loading characters:", e);
        } finally {
            loading = false;
        }
    }

    function handleSearchInput(e) {
        searchQuery = e.target.value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadCharacters();
        }, 400);
    }

    async function filterStyle(style) {
        selectedStyle = style;
        await loadCharacters();
    }

    // ── Mine mode actions ──
    async function setActive(charId) {
        if (!browser) return;
        const { databases, DB, COLLECTIONS } = await import("$lib/appwrite.js");
        for (const c of characters) {
            if (c.isActive) {
                await databases.updateDocument(
                    DB.MAIN,
                    COLLECTIONS.CHARACTERS,
                    c.$id,
                    { isActive: false },
                );
            }
        }
        await databases.updateDocument(
            DB.MAIN,
            COLLECTIONS.CHARACTERS,
            charId,
            { isActive: true },
        );
        await loadCharacters();
    }

    async function deleteCharacter(charId) {
        if (!browser || characters.length <= 1) return;
        if (!confirm("¿Eliminar este personaje?")) return;
        const { databases, DB, COLLECTIONS } = await import("$lib/appwrite.js");
        await databases.deleteDocument(DB.MAIN, COLLECTIONS.CHARACTERS, charId);
        await loadCharacters();
    }
</script>

<svelte:head>
    <title>{isMineMode ? "Mis Personajes" : "Personajes"} — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 650px; padding-top: var(--space-lg);"
>
    <header class="chars-header">
        <div>
            <h1>{isMineMode ? "Mis Personajes" : "🎭 Personajes"}</h1>
            <p class="text-muted">
                {isMineMode
                    ? "Tus identidades narrativas"
                    : "Personajes públicos de la comunidad"}
            </p>
        </div>
        {#if isMineMode}
            <a href="/characters/new" class="btn btn-primary">+ Nuevo</a>
        {/if}
    </header>

    <!-- Search -->
    <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
            type="text"
            class="search-input"
            placeholder="Buscar personajes..."
            value={searchQuery}
            oninput={handleSearchInput}
        />
    </div>

    <!-- Style filter -->
    <div class="style-filter">
        <button
            class="style-chip"
            class:active={selectedStyle === ""}
            onclick={() => filterStyle("")}>Todos</button
        >
        {#each NARRATIVE_STYLES as s}
            <button
                class="style-chip"
                class:active={selectedStyle === s.toLowerCase()}
                onclick={() => filterStyle(s.toLowerCase())}>{s}</button
            >
        {/each}
    </div>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else if characters.length === 0}
        <div
            class="card placeholder-card"
            style="text-align: center; padding: var(--space-3xl); border-style: dashed;"
        >
            <p style="font-size: 2.5rem; margin-bottom: var(--space-md);">🎭</p>
            {#if isMineMode}
                <h3>No tenés personajes todavía</h3>
                <p class="text-muted" style="margin: var(--space-md) 0;">
                    Creá tu primer personaje para comenzar a vivir historias
                </p>
                <a href="/characters/new" class="btn btn-primary"
                    >Crear Personaje</a
                >
            {:else}
                <h3>No hay personajes públicos todavía</h3>
                <p class="text-muted" style="margin: var(--space-md) 0;">
                    Los personajes aparecerán cuando los usuarios los hagan
                    públicos
                </p>
            {/if}
        </div>
    {:else}
        <div class="char-list">
            {#each characters as char, i}
                <div
                    class="char-card"
                    class:active={isMineMode && char.isActive}
                    style="animation-delay: {i * 0.04}s"
                >
                    <div class="char-card-header">
                        <div class="avatar">
                            {char.name ? char.name[0].toUpperCase() : "?"}
                        </div>
                        <div class="char-info">
                            <div class="char-name">
                                {char.name}
                                {#if isMineMode && char.isActive}
                                    <span class="badge badge-success"
                                        >Activo</span
                                    >
                                {/if}
                                {#if !isMineMode && char.visibility === "public"}
                                    <span
                                        class="badge badge-brand"
                                        style="font-size: 0.7rem;">Público</span
                                    >
                                {/if}
                            </div>
                            <p class="text-subtle" style="font-size: 0.85rem;">
                                {char.narrativeStyle || "Sin estilo definido"} ·
                                {char.narrativeGender || "Sin género"}
                            </p>
                        </div>
                    </div>

                    {#if char.personality}
                        <p class="char-personality text-muted">
                            {char.personality}
                        </p>
                    {/if}

                    {#if isMineMode}
                        <div class="char-actions">
                            {#if !char.isActive}
                                <button
                                    class="btn btn-sm btn-secondary"
                                    onclick={() => setActive(char.$id)}
                                >
                                    Activar
                                </button>
                            {/if}
                            <a
                                href="/characters/{char.$id}/edit"
                                class="btn btn-sm btn-ghost">✏️ Editar</a
                            >
                            {#if characters.length > 1}
                                <button
                                    class="btn btn-sm btn-ghost"
                                    style="color: var(--sx-error);"
                                    onclick={() => deleteCharacter(char.$id)}
                                >
                                    🗑️
                                </button>
                            {/if}
                        </div>
                    {:else}
                        <div class="char-tags">
                            {#if char.traits && char.traits.length > 0}
                                {#each char.traits.slice(0, 4) as trait}
                                    <span class="char-tag">{trait}</span>
                                {/each}
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .chars-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: var(--space-lg);
    }

    /* Search */
    .search-bar {
        position: relative;
        margin-bottom: var(--space-md);
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

    /* Style filter */
    .style-filter {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
        margin-bottom: var(--space-xl);
    }

    .style-chip {
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

    .style-chip:hover {
        border-color: var(--sx-brand);
        color: var(--sx-text);
    }

    .style-chip.active {
        background: rgba(233, 30, 99, 0.12);
        border-color: var(--sx-brand);
        color: var(--sx-brand-light);
        font-weight: 600;
    }

    /* Char list */
    .char-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .char-card {
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        transition: all var(--transition-base);
        opacity: 0;
        animation: fadeInUp 0.3s ease forwards;
    }

    .char-card:hover {
        border-color: var(--sx-brand);
    }

    .char-card.active {
        border-color: rgba(233, 30, 99, 0.4);
        box-shadow: 0 0 12px var(--sx-brand-glow);
    }

    .char-card-header {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin-bottom: var(--space-sm);
    }

    .char-name {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        font-weight: 600;
        font-size: 1.05rem;
    }

    .char-personality {
        font-size: 0.9rem;
        line-height: 1.4;
        margin-bottom: var(--space-md);
    }

    .char-actions {
        display: flex;
        gap: var(--space-sm);
    }

    .char-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
        margin-top: var(--space-sm);
    }

    .char-tag {
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-full);
        background: rgba(233, 30, 99, 0.08);
        color: var(--sx-text-muted);
        font-size: 0.75rem;
        font-weight: 500;
    }

    .placeholder-card h3 {
        font-family: var(--font-body);
    }
</style>
