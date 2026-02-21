<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import {
        narrativeProfile,
        WRITING_STYLES,
        EMOTIONAL_PACES,
        ROLE_TYPES,
        PLOT_OPTIONS,
        GENRE_OPTIONS,
    } from "$lib/stores/narrative-profile.js";
    import { SCENARIOS, calculateProfile } from "$lib/narrative-scoring.js";

    let userId = $state(null);
    let profile = $state(null);
    let loading = $state(true);

    // Tabs
    let activeTab = $state("quiz"); // 'quiz' | 'editor'

    // Quiz state
    let currentStep = $state(0);
    let answers = $state([]);
    let quizDone = $state(false);
    let quizResult = $state(null);
    let savingQuiz = $state(false);

    // Editor state
    let editFields = $state({
        writingStyle: "descriptivo",
        emotionalPace: "progresivo",
        roleType: "explorador",
        improvisationLevel: 3,
        narrativeInitiative: 3,
        preferredIntensity: 3,
        plotPreferences: [],
        preferredGenres: [],
    });
    let savingEdit = $state(false);
    let editMessage = $state("");

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                userId = state.user.$id;
                await narrativeProfile.loadProfile(userId);
            }
        });

        const unsubProfile = narrativeProfile.subscribe((state) => {
            if (state.profile) {
                profile = state.profile;
                editFields = {
                    writingStyle: state.profile.writingStyle || "descriptivo",
                    emotionalPace: state.profile.emotionalPace || "progresivo",
                    roleType: state.profile.roleType || "explorador",
                    improvisationLevel: state.profile.improvisationLevel || 3,
                    narrativeInitiative: state.profile.narrativeInitiative || 3,
                    preferredIntensity: state.profile.preferredIntensity || 3,
                    plotPreferences: state.profile.plotPreferences || [],
                    preferredGenres: state.profile.preferredGenres || [],
                };
                loading = false;
            }
        });

        return () => {
            unsub();
            unsubProfile();
        };
    });

    // Quiz logic
    function selectOption(scenarioId, optionId) {
        answers = [
            ...answers.filter((a) => a.scenarioId !== scenarioId),
            { scenarioId, optionId },
        ];

        setTimeout(() => {
            if (currentStep < SCENARIOS.length - 1) {
                currentStep++;
            } else {
                finishQuiz();
            }
        }, 400);
    }

    function finishQuiz() {
        quizResult = calculateProfile(answers);
        quizDone = true;
    }

    async function saveQuizResult() {
        if (!userId || !quizResult) return;
        savingQuiz = true;
        try {
            await narrativeProfile.saveProfile(userId, quizResult);
            activeTab = "editor";
            quizDone = false;
            currentStep = 0;
            answers = [];
        } catch (err) {
            console.error("Error saving quiz:", err);
        } finally {
            savingQuiz = false;
        }
    }

    function restartQuiz() {
        currentStep = 0;
        answers = [];
        quizDone = false;
        quizResult = null;
    }

    // Editor logic
    function toggleArrayItem(arr, item) {
        if (arr.includes(item)) return arr.filter((x) => x !== item);
        return [...arr, item];
    }

    async function saveEditor() {
        if (!userId) return;
        savingEdit = true;
        editMessage = "";
        try {
            await narrativeProfile.saveProfile(userId, editFields);
            editMessage = "✅ DNA actualizado";
        } catch (err) {
            editMessage = "❌ " + (err.message || "Error al guardar");
        } finally {
            savingEdit = false;
        }
    }

    // Labels
    const roleLabel = (v) => ROLE_TYPES.find((r) => r.value === v)?.label || v;
    const styleLabel = (v) =>
        WRITING_STYLES.find((s) => s.value === v)?.label || v;
    const paceLabel = (v) =>
        EMOTIONAL_PACES.find((p) => p.value === v)?.label || v;
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
    <title>DNA Narrativo — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 600px; padding-top: var(--space-lg);"
>
    <h1 style="margin-bottom: var(--space-xs);">🧬 DNA Narrativo</h1>
    <p class="text-muted" style="margin-bottom: var(--space-xl);">
        Tu identidad como narrador: cómo escribís, qué buscás, a qué ritmo
    </p>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else}
        <!-- Tabs -->
        <div class="tabs">
            <button
                class="tab"
                class:active={activeTab === "quiz"}
                onclick={() => {
                    activeTab = "quiz";
                }}
            >
                🎲 Quiz
            </button>
            <button
                class="tab"
                class:active={activeTab === "editor"}
                onclick={() => {
                    activeTab = "editor";
                }}
            >
                ✏️ Editor
            </button>
        </div>

        <!-- ═══ QUIZ TAB ═══ -->
        {#if activeTab === "quiz"}
            {#if quizDone && quizResult}
                <!-- Result -->
                <div class="quiz-result animate-in">
                    <div class="result-header">
                        <span style="font-size: 3rem;">🧬</span>
                        <h2>Tu DNA Narrativo</h2>
                    </div>

                    <div class="result-grid">
                        <div class="result-item">
                            <span class="result-label">Estilo</span>
                            <span class="result-value"
                                >{styleLabel(quizResult.writingStyle)}</span
                            >
                        </div>
                        <div class="result-item">
                            <span class="result-label">Ritmo</span>
                            <span class="result-value"
                                >{paceLabel(quizResult.emotionalPace)}</span
                            >
                        </div>
                        <div class="result-item">
                            <span class="result-label">Rol</span>
                            <span class="result-value"
                                >{roleLabel(quizResult.roleType)}</span
                            >
                        </div>
                        <div class="result-item">
                            <span class="result-label">Improvisación</span>
                            <span class="result-value"
                                >{quizResult.improvisationLevel}/5</span
                            >
                        </div>
                        <div class="result-item">
                            <span class="result-label">Iniciativa</span>
                            <span class="result-value"
                                >{quizResult.narrativeInitiative}/5</span
                            >
                        </div>
                        <div class="result-item">
                            <span class="result-label">Intensidad</span>
                            <span class="result-value"
                                >{intensityLabels[
                                    quizResult.preferredIntensity
                                ]}</span
                            >
                        </div>
                    </div>

                    {#if quizResult.plotPreferences.length > 0}
                        <div class="result-tags">
                            <span class="result-label">Tramas</span>
                            <div class="tag-list">
                                {#each quizResult.plotPreferences as p}
                                    <span class="badge badge-brand">{p}</span>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if quizResult.preferredGenres.length > 0}
                        <div class="result-tags">
                            <span class="result-label">Géneros</span>
                            <div class="tag-list">
                                {#each quizResult.preferredGenres as g}
                                    <span class="badge badge-brand">{g}</span>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <div class="result-actions">
                        <button
                            class="btn btn-primary btn-block btn-lg"
                            onclick={saveQuizResult}
                            disabled={savingQuiz}
                        >
                            {savingQuiz ? "..." : "💾 Guardar como mi DNA"}
                        </button>
                        <button
                            class="btn btn-ghost btn-block"
                            onclick={restartQuiz}>Repetir Quiz</button
                        >
                    </div>
                </div>
            {:else}
                <!-- Quiz Steps -->
                <div class="quiz-progress">
                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            style="width: {((currentStep + 1) /
                                SCENARIOS.length) *
                                100}%"
                        ></div>
                    </div>
                    <span class="text-subtle" style="font-size: 0.8rem;">
                        {currentStep + 1} / {SCENARIOS.length}
                    </span>
                </div>

                {#each SCENARIOS as scenario, i}
                    {#if i === currentStep}
                        <div
                            class="scenario animate-in"
                            style="animation-delay: 0.05s"
                        >
                            <div class="scenario-emoji">{scenario.emoji}</div>
                            <p class="scenario-text">{scenario.text}</p>

                            <div class="options">
                                {#each scenario.options as option}
                                    {@const selected =
                                        answers.find(
                                            (a) => a.scenarioId === scenario.id,
                                        )?.optionId === option.id}
                                    <button
                                        class="option-btn"
                                        class:selected
                                        onclick={() =>
                                            selectOption(
                                                scenario.id,
                                                option.id,
                                            )}
                                    >
                                        <span class="option-emoji"
                                            >{option.emoji}</span
                                        >
                                        <span class="option-text"
                                            >{option.text}</span
                                        >
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                {/each}
            {/if}
        {/if}

        <!-- ═══ EDITOR TAB ═══ -->
        {#if activeTab === "editor"}
            <div class="editor animate-in">
                {#if !profile?.writingStyle || (profile?.writingStyle === "descriptivo" && !profile?.updatedAt)}
                    <div
                        class="alert alert-error"
                        style="margin-bottom: var(--space-lg);"
                    >
                        💡 Hacé el Quiz primero para obtener tu DNA base, o
                        editá manualmente acá.
                    </div>
                {/if}

                {#if editMessage}
                    <div
                        class="alert {editMessage.startsWith('✅')
                            ? 'alert-success'
                            : 'alert-error'}"
                        style="margin-bottom: var(--space-lg);"
                    >
                        {editMessage}
                    </div>
                {/if}

                <form
                    onsubmit={(e) => {
                        e.preventDefault();
                        saveEditor();
                    }}
                    class="editor-form"
                >
                    <!-- Writing Style -->
                    <div class="form-group">
                        <label class="form-label">Estilo de Escritura</label>
                        <select
                            class="form-input"
                            bind:value={editFields.writingStyle}
                        >
                            {#each WRITING_STYLES as s}
                                <option value={s.value}>{s.label}</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Emotional Pace -->
                    <div class="form-group">
                        <label class="form-label">Ritmo Emocional</label>
                        <select
                            class="form-input"
                            bind:value={editFields.emotionalPace}
                        >
                            {#each EMOTIONAL_PACES as p}
                                <option value={p.value}>{p.label}</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Role Type -->
                    <div class="form-group">
                        <label class="form-label">Tipo de Rol</label>
                        <select
                            class="form-input"
                            bind:value={editFields.roleType}
                        >
                            {#each ROLE_TYPES as r}
                                <option value={r.value}>{r.label}</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Improvisation -->
                    <div class="form-group">
                        <label class="form-label"
                            >Nivel de Improvisación — {editFields.improvisationLevel}/5</label
                        >
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            class="slider"
                            bind:value={editFields.improvisationLevel}
                        />
                        <div class="slider-labels">
                            <span class="text-subtle">Planificado</span>
                            <span class="text-subtle">Caótico</span>
                        </div>
                    </div>

                    <!-- Initiative -->
                    <div class="form-group">
                        <label class="form-label"
                            >Iniciativa Narrativa — {editFields.narrativeInitiative}/5</label
                        >
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            class="slider"
                            bind:value={editFields.narrativeInitiative}
                        />
                        <div class="slider-labels">
                            <span class="text-subtle">Reactivo</span>
                            <span class="text-subtle">Proactivo</span>
                        </div>
                    </div>

                    <!-- Intensity -->
                    <div class="form-group">
                        <label class="form-label"
                            >Intensidad Preferida — {intensityLabels[
                                editFields.preferredIntensity
                            ]}</label
                        >
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            class="slider"
                            bind:value={editFields.preferredIntensity}
                        />
                        <div class="slider-labels">
                            <span class="text-subtle">Muy Suave</span>
                            <span class="text-subtle">Extremo</span>
                        </div>
                    </div>

                    <!-- Plot Preferences -->
                    <div class="form-group">
                        <label class="form-label">Preferencias de Trama</label>
                        <div class="chip-grid">
                            {#each PLOT_OPTIONS as plot}
                                {@const active =
                                    editFields.plotPreferences.includes(plot)}
                                <button
                                    type="button"
                                    class="chip"
                                    class:active
                                    onclick={() => {
                                        editFields.plotPreferences =
                                            toggleArrayItem(
                                                editFields.plotPreferences,
                                                plot,
                                            );
                                    }}
                                >
                                    {plot}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <!-- Genre Preferences -->
                    <div class="form-group">
                        <label class="form-label">Géneros Preferidos</label>
                        <div class="chip-grid">
                            {#each GENRE_OPTIONS as genre}
                                {@const active =
                                    editFields.preferredGenres.includes(genre)}
                                <button
                                    type="button"
                                    class="chip"
                                    class:active
                                    onclick={() => {
                                        editFields.preferredGenres =
                                            toggleArrayItem(
                                                editFields.preferredGenres,
                                                genre,
                                            );
                                    }}
                                >
                                    {genre}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary btn-block btn-lg"
                        disabled={savingEdit}
                    >
                        {savingEdit ? "..." : "💾 Guardar DNA"}
                    </button>
                </form>
            </div>
        {/if}
    {/if}
</div>

<style>
    /* Tabs */
    .tabs {
        display: flex;
        gap: 2px;
        background: var(--sx-bg-input);
        border-radius: var(--radius-lg);
        padding: 3px;
        margin-bottom: var(--space-xl);
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

    /* Quiz */
    .quiz-progress {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin-bottom: var(--space-xl);
    }

    .progress-bar {
        flex: 1;
        height: 4px;
        background: var(--sx-bg-input);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--sx-brand), var(--sx-purple));
        border-radius: 2px;
        transition: width 0.4s ease;
    }

    .scenario {
        text-align: center;
    }

    .scenario-emoji {
        font-size: 4rem;
        margin-bottom: var(--space-md);
    }

    .scenario-text {
        font-size: 1.1rem;
        line-height: 1.5;
        max-width: 480px;
        margin: 0 auto var(--space-xl);
    }

    .options {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .option-btn {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        width: 100%;
        padding: 0.9rem 1.2rem;
        background: var(--sx-bg-card);
        border: 1.5px solid var(--sx-border);
        border-radius: var(--radius-lg);
        color: var(--sx-text);
        font-family: var(--font-body);
        font-size: 0.95rem;
        text-align: left;
        cursor: pointer;
        transition: all var(--transition-base);
    }

    .option-btn:hover {
        border-color: var(--sx-brand);
        transform: translateX(4px);
    }

    .option-btn.selected {
        border-color: var(--sx-brand);
        background: rgba(233, 30, 99, 0.1);
        box-shadow: var(--shadow-glow);
    }

    .option-emoji {
        font-size: 1.4rem;
        flex-shrink: 0;
    }

    /* Result */
    .quiz-result {
        text-align: center;
    }

    .result-header {
        margin-bottom: var(--space-xl);
    }

    .result-header h2 {
        margin-top: var(--space-sm);
        background: linear-gradient(
            135deg,
            var(--sx-brand-light),
            var(--sx-purple)
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .result-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-sm);
        margin-bottom: var(--space-xl);
    }

    .result-item {
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-md);
        padding: var(--space-md);
    }

    .result-label {
        display: block;
        font-size: 0.75rem;
        color: var(--sx-text-subtle);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 2px;
    }

    .result-value {
        font-weight: 600;
        font-size: 0.95rem;
    }

    .result-tags {
        margin-bottom: var(--space-lg);
    }

    .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
        justify-content: center;
        margin-top: var(--space-xs);
    }

    .result-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
        margin-top: var(--space-lg);
    }

    /* Editor */
    .editor-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
        padding-bottom: var(--space-2xl);
    }

    .slider {
        width: 100%;
        height: 6px;
        appearance: none;
        background: var(--sx-bg-input);
        border-radius: 3px;
        outline: none;
        margin-top: var(--space-sm);
    }

    .slider::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--sx-brand);
        cursor: pointer;
        box-shadow: 0 0 8px var(--sx-brand-glow);
    }

    .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--sx-brand);
        border: none;
        cursor: pointer;
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        margin-top: 2px;
    }

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

    .chip:hover {
        border-color: var(--sx-brand);
        color: var(--sx-text);
    }

    .chip.active {
        background: rgba(233, 30, 99, 0.15);
        border-color: var(--sx-brand);
        color: var(--sx-brand-light);
        font-weight: 600;
    }
</style>
