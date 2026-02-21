<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { page } from "$app/stores";

    let loading = $state(true);
    let saving = $state(false);
    let error = $state("");
    let message = $state("");
    let charId = $state("");

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
        const unsub = page.subscribe(async (p) => {
            charId = p.params.id;
            if (charId) await loadCharacter(charId);
        });
        return unsub;
    });

    async function loadCharacter(id) {
        if (!browser) return;
        const { databases, DB, COLLECTIONS } = await import("$lib/appwrite.js");

        try {
            const doc = await databases.getDocument(
                DB.MAIN,
                COLLECTIONS.CHARACTERS,
                id,
            );
            name = doc.name || "";
            personality = doc.personality || "";
            narrativeStyle = doc.narrativeStyle || "";
            desiredPlots = doc.desiredPlots || "";
            limits = doc.limits || "";
            narrativeGender = doc.narrativeGender || "";
            description = doc.description || "";
        } catch (e) {
            error = "No se pudo cargar el personaje.";
        } finally {
            loading = false;
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!name.trim()) {
            error = "El nombre es obligatorio.";
            return;
        }

        error = "";
        saving = true;

        try {
            const { databases, DB, COLLECTIONS } = await import(
                "$lib/appwrite.js"
            );

            await databases.updateDocument(
                DB.MAIN,
                COLLECTIONS.CHARACTERS,
                charId,
                {
                    name: name.trim(),
                    personality: personality.trim(),
                    narrativeStyle,
                    desiredPlots: desiredPlots.trim(),
                    limits: limits.trim(),
                    narrativeGender,
                    description: description.trim(),
                },
            );

            message = "✅ Personaje actualizado";
        } catch (err) {
            error = err.message || "Error al guardar.";
        } finally {
            saving = false;
        }
    }
</script>

<svelte:head>
    <title>Editar Personaje — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 520px; padding-top: var(--space-lg);"
>
    <a href="/characters" class="back-link text-muted">← Mis Personajes</a>

    <h1 style="margin-bottom: var(--space-xs);">Editar Personaje</h1>
    <p class="text-muted" style="margin-bottom: var(--space-xl);">
        Modificá la identidad de tu personaje
    </p>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else}
        {#if error}
            <div
                class="alert alert-error"
                style="margin-bottom: var(--space-lg);"
            >
                {error}
            </div>
        {/if}
        {#if message}
            <div
                class="alert alert-success"
                style="margin-bottom: var(--space-lg);"
            >
                {message}
            </div>
        {/if}

        <form onsubmit={handleSave} class="char-form">
            <div class="form-group">
                <label for="name" class="form-label"
                    >Nombre del Personaje *</label
                >
                <input
                    id="name"
                    type="text"
                    class="form-input"
                    bind:value={name}
                />
            </div>

            <div class="form-group">
                <label for="personality" class="form-label">Personalidad</label>
                <textarea
                    id="personality"
                    class="form-input"
                    bind:value={personality}
                    rows="3"
                ></textarea>
            </div>

            <div class="form-group">
                <label for="style" class="form-label">Estilo Narrativo</label>
                <select
                    id="style"
                    class="form-input"
                    bind:value={narrativeStyle}
                >
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
                <select
                    id="gender"
                    class="form-input"
                    bind:value={narrativeGender}
                >
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
                    rows="2"
                ></textarea>
            </div>

            <div class="form-group">
                <label for="limits" class="form-label">Límites Narrativos</label
                >
                <textarea
                    id="limits"
                    class="form-input"
                    bind:value={limits}
                    rows="2"
                ></textarea>
                <p
                    class="text-subtle"
                    style="font-size: 0.78rem; margin-top: 4px;"
                >
                    Los límites son privados y determinan el matching.
                </p>
            </div>

            <div class="form-group">
                <label for="desc" class="form-label"
                    >Descripción / Backstory</label
                >
                <textarea
                    id="desc"
                    class="form-input"
                    bind:value={description}
                    rows="3"
                ></textarea>
            </div>

            <button
                type="submit"
                class="btn btn-primary btn-block btn-lg"
                disabled={saving}
            >
                {#if saving}
                    <span class="spinner"></span>
                {:else}
                    Guardar Cambios
                {/if}
            </button>
        </form>
    {/if}
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

    .char-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
        padding-bottom: var(--space-2xl);
    }
</style>
