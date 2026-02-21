<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { auth } from "$lib/stores/auth.js";
    import { userProfile } from "$lib/stores/user-profile.js";

    let loading = $state(false);
    let error = $state("");
    let userId = $state(null);
    let isFirstCharacter = $state(false);

    // Form fields
    let name = $state("");
    let personality = $state("");
    let narrativeStyle = $state("");
    let desiredPlots = $state("");
    let limits = $state("");
    let narrativeGender = $state("");
    let description = $state("");

    const STYLES = [
        "poético",
        "directo",
        "descriptivo",
        "minimalista",
        "provocador",
        "misterioso",
    ];
    const GENDERS = [
        "Romance prohibido",
        "Fantasía oscura",
        "Dominio psicológico",
        "Misterio seductor",
        "Sci-fi sensual",
        "Realidades alternativas",
    ];

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                userId = state.user.$id;
                // Check if this is the user's first character
                await checkFirstCharacter(userId);
            }
        });
        return unsub;
    });

    async function checkFirstCharacter(uid) {
        if (!browser) return;
        const { databases, DB, COLLECTIONS } = await import("$lib/appwrite.js");
        const { Query } = await import("appwrite");

        try {
            const res = await databases.listDocuments(
                DB.MAIN,
                COLLECTIONS.CHARACTERS,
                [Query.equal("userId", uid), Query.limit(1)],
            );
            isFirstCharacter = res.documents.length === 0;
        } catch {
            isFirstCharacter = true;
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) {
            error = "El nombre es obligatorio.";
            return;
        }
        if (!userId) return;

        error = "";
        loading = true;

        try {
            const { databases, DB, COLLECTIONS } = await import(
                "$lib/appwrite.js"
            );
            const { ID, Permission, Role } = await import("appwrite");

            const doc = await databases.createDocument(
                DB.MAIN,
                COLLECTIONS.CHARACTERS,
                ID.unique(),
                {
                    userId,
                    name: name.trim(),
                    personality: personality.trim(),
                    narrativeStyle,
                    desiredPlots: desiredPlots.trim(),
                    limits: limits.trim(),
                    narrativeGender,
                    description: description.trim(),
                    isActive: isFirstCharacter, // Auto-activate first character
                    createdAt: new Date().toISOString(),
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(userId)),
                    Permission.delete(Role.user(userId)),
                ],
            );

            // If first character, update user state
            if (isFirstCharacter) {
                await userProfile.saveProfile(userId, {
                    globalState: "ACTIVE_INITIAL",
                });
            }

            window.location.href = "/characters";
        } catch (err) {
            error = err.message || "Error al crear el personaje.";
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Crear Personaje — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 520px; padding-top: var(--space-lg);"
>
    {#if isFirstCharacter}
        <div class="first-char-banner">
            <span>🎭</span>
            <div>
                <p style="font-weight: 600;">¡Tu primer personaje!</p>
                <p class="text-muted" style="font-size: 0.85rem;">
                    En Sexteo te comunicás a través de personajes. Creá tu
                    primera identidad narrativa.
                </p>
            </div>
        </div>
    {:else}
        <a href="/characters" class="back-link text-muted">← Mis Personajes</a>
    {/if}

    <h1 style="margin-bottom: var(--space-xs);">Crear Personaje</h1>
    <p class="text-muted" style="margin-bottom: var(--space-xl);">
        Inventá una identidad para vivir historias
    </p>

    {#if error}
        <div class="alert alert-error" style="margin-bottom: var(--space-lg);">
            {error}
        </div>
    {/if}

    <form onsubmit={handleSubmit} class="char-form">
        <div class="form-group">
            <label for="name" class="form-label">Nombre del Personaje *</label>
            <input
                id="name"
                type="text"
                class="form-input"
                bind:value={name}
                placeholder="Ej: Dante, Luna, El Extraño..."
            />
        </div>

        <div class="form-group">
            <label for="personality" class="form-label">Personalidad</label>
            <textarea
                id="personality"
                class="form-input"
                bind:value={personality}
                placeholder="¿Cómo es este personaje? Misterioso, apasionado, calculador..."
                rows="3"
            ></textarea>
        </div>

        <div class="form-group">
            <label for="style" class="form-label">Estilo Narrativo</label>
            <select id="style" class="form-input" bind:value={narrativeStyle}>
                <option value="">Elegí un estilo</option>
                {#each STYLES as s}
                    <option value={s}
                        >{s.charAt(0).toUpperCase() + s.slice(1)}</option
                    >
                {/each}
            </select>
        </div>

        <div class="form-group">
            <label for="gender" class="form-label">Género Narrativo</label>
            <select id="gender" class="form-input" bind:value={narrativeGender}>
                <option value="">Elegí un género</option>
                {#each GENDERS as g}
                    <option value={g}>{g}</option>
                {/each}
            </select>
        </div>

        <div class="form-group">
            <label for="plots" class="form-label">Deseos de Trama</label>
            <textarea
                id="plots"
                class="form-input"
                bind:value={desiredPlots}
                placeholder="¿Qué tipo de historias querés vivir con este personaje?"
                rows="2"
            ></textarea>
        </div>

        <div class="form-group">
            <label for="limits" class="form-label">Límites Narrativos</label>
            <textarea
                id="limits"
                class="form-input"
                bind:value={limits}
                placeholder="¿Qué temas o situaciones preferís evitar?"
                rows="2"
            ></textarea>
            <p class="text-subtle" style="font-size: 0.78rem; margin-top: 4px;">
                Los límites son privados y determinan el matching.
            </p>
        </div>

        <div class="form-group">
            <label for="desc" class="form-label">Descripción / Backstory</label>
            <textarea
                id="desc"
                class="form-input"
                bind:value={description}
                placeholder="Historia del personaje, de dónde viene, qué busca..."
                rows="3"
            ></textarea>
        </div>

        <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            disabled={loading}
        >
            {#if loading}
                <span class="spinner"></span>
            {:else}
                {isFirstCharacter ? "Comenzar mi Historia" : "Crear Personaje"}
            {/if}
        </button>
    </form>
</div>

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

    .first-char-banner {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-lg);
        background: rgba(233, 30, 99, 0.08);
        border: 1px solid rgba(233, 30, 99, 0.2);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-xl);
        font-size: 1.8rem;
    }

    .first-char-banner > div {
        font-size: 1rem;
    }

    .char-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
        padding-bottom: var(--space-2xl);
    }
</style>
