<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import {
        matches,
        MATCH_TYPES,
        getMatchLabel,
    } from "$lib/stores/matches.js";
    import { limits } from "$lib/stores/limits.js";
    import { narrativeProfile } from "$lib/stores/narrative-profile.js";
    import { rooms } from "$lib/stores/rooms.js";
    import { page } from "$app/stores";

    let matchId = $state("");
    let userId = $state(null);
    let matchDoc = $state(null);
    let myDna = $state(null);
    let theirDna = $state(null);
    let limitsResult = $state(null);
    let loading = $state(true);
    let error = $state("");
    let consenting = $state(false);
    let creating = $state(false);

    onMount(() => {
        const unsubPage = page.subscribe((p) => {
            matchId = p.params.matchId;
        });
        const unsub = auth.subscribe(async (state) => {
            if (state.user && matchId) {
                userId = state.user.$id;
                await loadMatch();
            }
        });
        return () => {
            unsubPage();
            unsub();
        };
    });

    async function loadMatch() {
        const { databases, DB, COLLECTIONS } = await import("$lib/appwrite.js");

        try {
            matchDoc = await databases.getDocument(
                DB.MAIN,
                COLLECTIONS.MATCHES,
                matchId,
            );

            const otherUserId =
                matchDoc.userIdA === userId
                    ? matchDoc.userIdB
                    : matchDoc.userIdA;

            // Load both DNA profiles
            await narrativeProfile.loadProfile(userId);
            const unsubProfile = narrativeProfile.subscribe((s) => {
                if (s.profile) myDna = s.profile;
            });
            unsubProfile();

            try {
                theirDna = await databases.getDocument(
                    DB.MAIN,
                    COLLECTIONS.NARRATIVE_PROFILES,
                    otherUserId,
                );
            } catch {
                theirDna = null;
            }

            // Load and compare limits
            await limits.loadLimits(userId);
            let myLimits, theirLimits;
            const unsubLimits = limits.subscribe((s) => {
                if (s.config) myLimits = s.config;
            });
            unsubLimits();

            try {
                theirLimits = await databases.getDocument(
                    DB.MAIN,
                    COLLECTIONS.LIMITS_CONFIG,
                    otherUserId,
                );
            } catch {
                theirLimits = null;
            }

            if (myLimits && theirLimits) {
                limitsResult = limits.checkCompatibility(myLimits, theirLimits);
            }

            loading = false;
        } catch (e) {
            error = e.message || "Error cargando match";
            loading = false;
        }
    }

    async function agreeLimits() {
        consenting = true;
        try {
            await matches.agreeLimits(matchId);
            matchDoc = { ...matchDoc, limitsAgreed: true };
        } catch (e) {
            error = e.message;
        } finally {
            consenting = false;
        }
    }

    async function startStory() {
        if (!matchDoc || !userId) return;
        creating = true;
        try {
            const otherUserId =
                matchDoc.userIdA === userId
                    ? matchDoc.userIdB
                    : matchDoc.userIdA;
            const room = await rooms.createRoom({
                type: "PRIVATE",
                title: `Historia — ${getMatchLabel(matchDoc.compatibilityScore || 0)}`,
                genre: myDna?.preferredGenres?.[0] || "",
                intensity: limitsResult?.agreedIntensity || 3,
                participantIds: [userId, otherUserId],
                narrativeContext: `Match type: ${matchDoc.matchType}, Score: ${matchDoc.compatibilityScore}%`,
            });
            window.location.href = `/chat/${room.$id}`;
        } catch (e) {
            error = e.message;
            creating = false;
        }
    }

    function getTypeInfo(type) {
        return MATCH_TYPES[type] || { emoji: "🔮", label: "Match", desc: "" };
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
    <title>Match Detail — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 560px; padding-top: var(--space-lg);"
>
    <a href="/matching" class="back-link text-muted">← Volver al Matching</a>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else if error}
        <div class="alert alert-error">{error}</div>
    {:else if matchDoc}
        {@const typeInfo = getTypeInfo(matchDoc.matchType)}

        <!-- Match Header -->
        <div class="detail-header">
            <div class="detail-score-ring">
                <span class="detail-score"
                    >{matchDoc.compatibilityScore || "?"}</span
                >
                <span class="detail-percent">%</span>
            </div>
            <h1 style="font-size: 1.5rem; margin-top: var(--space-sm);">
                {typeInfo.emoji}
                {typeInfo.label}
            </h1>
            <p class="text-muted">{typeInfo.desc}</p>
            <span
                class="badge badge-brand"
                style="margin-top: var(--space-sm);"
            >
                {getMatchLabel(matchDoc.compatibilityScore || 0)}
            </span>
        </div>

        <!-- DNA Comparison -->
        {#if myDna && theirDna}
            <section class="compare-section">
                <h3 class="section-title">🧬 Comparación DNA</h3>
                <div class="compare-grid">
                    <div class="compare-header">
                        <span class="text-subtle">Atributo</span>
                        <span class="text-brand">Vos</span>
                        <span class="text-muted">Ellos</span>
                    </div>
                    <div class="compare-row">
                        <span>Estilo</span>
                        <span>{myDna.writingStyle}</span>
                        <span>{theirDna.writingStyle}</span>
                    </div>
                    <div class="compare-row">
                        <span>Ritmo</span>
                        <span>{myDna.emotionalPace}</span>
                        <span>{theirDna.emotionalPace}</span>
                    </div>
                    <div class="compare-row">
                        <span>Rol</span>
                        <span>{myDna.roleType}</span>
                        <span>{theirDna.roleType}</span>
                    </div>
                    <div class="compare-row">
                        <span>Improvisación</span>
                        <span>{myDna.improvisationLevel}/5</span>
                        <span>{theirDna.improvisationLevel}/5</span>
                    </div>
                    <div class="compare-row">
                        <span>Intensidad</span>
                        <span>{intensityLabels[myDna.preferredIntensity]}</span>
                        <span
                            >{intensityLabels[
                                theirDna.preferredIntensity
                            ]}</span
                        >
                    </div>
                </div>
            </section>
        {/if}

        <!-- Limits Compatibility -->
        <section class="compare-section">
            <h3 class="section-title">🛡️ Compatibilidad de Límites</h3>
            {#if limitsResult}
                {#if limitsResult.compatible}
                    <div class="alert alert-success">
                        ✅ Los límites son compatibles. Intensidad acordada: <strong
                            >{intensityLabels[
                                limitsResult.agreedIntensity
                            ]}</strong
                        >
                    </div>
                {:else}
                    <div class="alert alert-error">
                        ⚠️ Se detectaron conflictos:
                        <ul
                            style="margin-top: var(--space-sm); padding-left: var(--space-lg);"
                        >
                            {#each limitsResult.conflicts as c}
                                <li>{c}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            {:else}
                <p class="text-muted">No se pudieron comparar los límites.</p>
            {/if}
        </section>

        <!-- Consent Panel -->
        <section class="consent-panel">
            <h3 class="section-title">✋ Panel de Consentimiento</h3>
            <div class="consent-card">
                <p style="margin-bottom: var(--space-md); line-height: 1.5;">
                    Al aceptar, ambos narradores se comprometen a respetar los
                    límites configurados. La safe word de cada participante
                    estará activa durante toda la historia.
                </p>

                {#if matchDoc.limitsAgreed}
                    <div
                        class="alert alert-success"
                        style="margin-bottom: var(--space-md);"
                    >
                        ✅ Consentimiento acordado
                    </div>
                    <button
                        class="btn btn-primary btn-block btn-lg"
                        onclick={startStory}
                        disabled={creating}
                    >
                        {#if creating}
                            <span class="spinner"></span> Creando sala...
                        {:else}
                            🚀 Comenzar Historia
                        {/if}
                    </button>
                {:else}
                    <button
                        class="btn btn-primary btn-block btn-lg"
                        onclick={agreeLimits}
                        disabled={consenting}
                    >
                        {#if consenting}
                            <span class="spinner"></span>
                        {:else}
                            ✋ Acepto los límites y quiero continuar
                        {/if}
                    </button>
                {/if}
            </div>
        </section>
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

    .detail-header {
        text-align: center;
        margin-bottom: var(--space-2xl);
    }

    .detail-score-ring {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        border: 4px solid var(--sx-brand);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-sm);
        box-shadow: 0 0 24px var(--sx-brand-glow);
    }

    .detail-score {
        font-size: 2rem;
        font-weight: 800;
        color: var(--sx-brand-light);
        line-height: 1;
    }

    .detail-percent {
        font-size: 0.7rem;
        color: var(--sx-brand-light);
        opacity: 0.7;
    }

    .compare-section {
        margin-bottom: var(--space-xl);
    }

    .section-title {
        font-family: var(--font-body);
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: var(--space-md);
    }

    .compare-grid {
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .compare-header,
    .compare-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        padding: 0.6rem 1rem;
        font-size: 0.88rem;
    }

    .compare-header {
        background: var(--sx-bg-input);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .compare-row {
        border-top: 1px solid var(--sx-border);
    }

    .compare-row span:first-child {
        color: var(--sx-text-muted);
    }

    /* Consent */
    .consent-panel {
        margin-bottom: var(--space-2xl);
    }

    .consent-card {
        background: var(--sx-bg-card);
        border: 1px solid rgba(233, 30, 99, 0.2);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
    }
</style>
