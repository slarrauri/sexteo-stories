<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import { limits, THEME_OPTIONS, HARD_LIMITS } from "$lib/stores/limits.js";

    let userId = $state(null);
    let loading = $state(true);
    let saving = $state(false);
    let message = $state("");

    let allowedThemes = $state([]);
    let forbiddenThemes = $state([...HARD_LIMITS]);
    let intensityMax = $state(3);
    let safeWord = $state("");
    let autoExitEnabled = $state(true);

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                userId = state.user.$id;
                await limits.loadLimits(userId);
            }
        });

        const unsubLimits = limits.subscribe((state) => {
            if (state.config) {
                allowedThemes = state.config.allowedThemes || [];
                forbiddenThemes = [
                    ...new Set([
                        ...(state.config.forbiddenThemes || []),
                        ...HARD_LIMITS,
                    ]),
                ];
                intensityMax = state.config.intensityMax || 3;
                safeWord = state.config.safeWord || "";
                autoExitEnabled = state.config.autoExitEnabled !== false;
                loading = false;
            }
        });

        return () => {
            unsub();
            unsubLimits();
        };
    });

    function toggleAllowed(theme) {
        if (HARD_LIMITS.includes(theme)) return;
        if (forbiddenThemes.includes(theme)) return;
        if (allowedThemes.includes(theme)) {
            allowedThemes = allowedThemes.filter((t) => t !== theme);
        } else {
            allowedThemes = [...allowedThemes, theme];
        }
    }

    function toggleForbidden(theme) {
        if (HARD_LIMITS.includes(theme)) return; // Can't toggle hard limits
        if (allowedThemes.includes(theme)) {
            allowedThemes = allowedThemes.filter((t) => t !== theme);
        }
        if (forbiddenThemes.includes(theme)) {
            forbiddenThemes = forbiddenThemes.filter((t) => t !== theme);
        } else {
            forbiddenThemes = [...forbiddenThemes, theme];
        }
    }

    async function handleSave() {
        if (!userId) return;
        saving = true;
        message = "";
        try {
            await limits.saveLimits(userId, {
                allowedThemes,
                forbiddenThemes,
                intensityMax,
                safeWord: safeWord.trim(),
                autoExitEnabled,
            });
            message = "✅ Límites guardados";
        } catch (err) {
            message = "❌ " + (err.message || "Error al guardar");
        } finally {
            saving = false;
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
    <title>Mis Límites — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 560px; padding-top: var(--space-lg);"
>
    <h1 style="margin-bottom: var(--space-xs);">🛡️ Límites y Consentimiento</h1>
    <p class="text-muted" style="margin-bottom: var(--space-xl);">
        Configurá qué temas aceptás, cuáles rechazás, y tu safe word. Los
        límites son privados y determinan la compatibilidad con otros
        narradores.
    </p>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else}
        {#if message}
            <div
                class="alert {message.startsWith('✅')
                    ? 'alert-success'
                    : 'alert-error'}"
                style="margin-bottom: var(--space-lg);"
            >
                {message}
            </div>
        {/if}

        <!-- Intensity -->
        <section class="limits-section">
            <h3 class="section-title">
                🔥 Intensidad Máxima — {intensityLabels[intensityMax]}
            </h3>
            <p class="text-subtle section-desc">
                Define el nivel máximo de intensidad narrativa con el que te
                sentís cómodo/a.
            </p>
            <input
                type="range"
                min="1"
                max="5"
                step="1"
                class="slider"
                bind:value={intensityMax}
            />
            <div class="slider-labels">
                <span class="text-subtle">Muy Suave</span>
                <span class="text-subtle">Extremo</span>
            </div>
        </section>

        <!-- Allowed Themes -->
        <section class="limits-section">
            <h3 class="section-title">✅ Temas Permitidos</h3>
            <p class="text-subtle section-desc">
                Seleccioná los temas que disfrutás explorar en tus narrativas.
            </p>
            <div class="chip-grid">
                {#each THEME_OPTIONS as theme}
                    {#if !HARD_LIMITS.includes(theme)}
                        {@const isAllowed = allowedThemes.includes(theme)}
                        {@const isForbidden = forbiddenThemes.includes(theme)}
                        <button
                            type="button"
                            class="chip"
                            class:active={isAllowed}
                            class:disabled={isForbidden}
                            onclick={() => toggleAllowed(theme)}
                            title={isForbidden ? "Marcado como prohibido" : ""}
                        >
                            {theme}
                        </button>
                    {/if}
                {/each}
            </div>
        </section>

        <!-- Forbidden Themes -->
        <section class="limits-section">
            <h3 class="section-title">🚫 Temas Prohibidos</h3>
            <p class="text-subtle section-desc">
                Temas que NO querés encontrar en ninguna historia. Los marcados
                con 🔒 son límites duros inalterables.
            </p>
            <div class="chip-grid">
                {#each THEME_OPTIONS as theme}
                    {@const isForbidden = forbiddenThemes.includes(theme)}
                    {@const isHardLimit = HARD_LIMITS.includes(theme)}
                    <button
                        type="button"
                        class="chip forbidden-chip"
                        class:active={isForbidden}
                        class:locked={isHardLimit}
                        onclick={() => toggleForbidden(theme)}
                        disabled={isHardLimit}
                    >
                        {#if isHardLimit}🔒{/if}
                        {theme}
                    </button>
                {/each}
            </div>
        </section>

        <!-- Safe Word -->
        <section class="limits-section">
            <h3 class="section-title">🛑 Safe Word</h3>
            <p class="text-subtle section-desc">
                Palabra clave que podés usar en el chat para pausar
                inmediatamente la historia.
            </p>
            <div class="form-group">
                <input
                    type="text"
                    class="form-input"
                    bind:value={safeWord}
                    placeholder="Ej: rojo, stop, pausa..."
                />
            </div>
        </section>

        <!-- Auto Exit -->
        <section class="limits-section">
            <div class="toggle-row">
                <div>
                    <h3 class="section-title" style="margin-bottom: 0;">
                        ⏸️ Auto-Exit
                    </h3>
                    <p class="text-subtle section-desc">
                        Si se detecta contenido que viola tus límites, salir
                        automáticamente de la historia.
                    </p>
                </div>
                <label class="toggle">
                    <input type="checkbox" bind:checked={autoExitEnabled} />
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </section>

        <button
            class="btn btn-primary btn-block btn-lg"
            onclick={handleSave}
            disabled={saving}
        >
            {saving ? "..." : "💾 Guardar Límites"}
        </button>
    {/if}
</div>

<style>
    .limits-section {
        margin-bottom: var(--space-xl);
        padding-bottom: var(--space-xl);
        border-bottom: 1px solid var(--sx-border);
    }

    .section-title {
        font-family: var(--font-body);
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: var(--space-xs);
    }

    .section-desc {
        font-size: 0.85rem;
        margin-bottom: var(--space-md);
        line-height: 1.4;
    }

    /* Slider */
    .slider {
        width: 100%;
        height: 6px;
        appearance: none;
        background: var(--sx-bg-input);
        border-radius: 3px;
        outline: none;
    }

    .slider::-webkit-slider-thumb {
        appearance: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--sx-brand);
        cursor: pointer;
        box-shadow: 0 0 8px var(--sx-brand-glow);
    }

    .slider::-moz-range-thumb {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--sx-brand);
        border: none;
        cursor: pointer;
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        margin-top: 4px;
    }

    /* Chips */
    .chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
    }

    .chip {
        padding: 0.35rem 0.75rem;
        border: 1.5px solid var(--sx-border);
        border-radius: var(--radius-full);
        background: transparent;
        color: var(--sx-text-muted);
        font-family: var(--font-body);
        font-size: 0.82rem;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .chip:hover:not(:disabled) {
        border-color: var(--sx-brand);
        color: var(--sx-text);
    }

    .chip.active {
        background: rgba(74, 222, 128, 0.12);
        border-color: var(--sx-success);
        color: var(--sx-success);
        font-weight: 600;
    }

    .chip.disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .forbidden-chip.active {
        background: rgba(255, 85, 85, 0.12);
        border-color: var(--sx-error);
        color: var(--sx-error);
        font-weight: 600;
    }

    .forbidden-chip.locked {
        background: rgba(255, 85, 85, 0.2);
        border-color: var(--sx-error);
        color: var(--sx-error);
        opacity: 1;
        cursor: default;
        font-weight: 700;
    }

    /* Toggle */
    .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-lg);
    }

    .toggle {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 28px;
        flex-shrink: 0;
    }

    .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-slider {
        position: absolute;
        inset: 0;
        border-radius: var(--radius-full);
        background: var(--sx-bg-input);
        border: 1.5px solid var(--sx-border);
        transition: all var(--transition-base);
        cursor: pointer;
    }

    .toggle-slider::before {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--sx-text-muted);
        transition: all var(--transition-base);
    }

    .toggle input:checked + .toggle-slider {
        background: rgba(233, 30, 99, 0.2);
        border-color: var(--sx-brand);
    }

    .toggle input:checked + .toggle-slider::before {
        background: var(--sx-brand);
        transform: translateX(22px);
    }
</style>
