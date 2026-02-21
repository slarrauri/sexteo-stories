<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import {
        matches,
        MATCH_TYPES,
        getMatchLabel,
    } from "$lib/stores/matches.js";

    let userId = $state(null);
    let matchList = $state([]);
    let pendingList = $state([]);
    let searching = $state(false);
    let error = $state("");
    let loadingPending = $state(true);

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                userId = state.user.$id;
                await loadPending(userId);
            }
        });

        const unsubMatches = matches.subscribe((state) => {
            matchList = state.matches || [];
            searching = state.searching;
            if (state.error) error = state.error;
        });

        return () => {
            unsub();
            unsubMatches();
        };
    });

    async function loadPending(uid) {
        try {
            pendingList = await matches.getPendingMatches(uid);
        } catch {}
        loadingPending = false;
    }

    async function searchMatches() {
        if (!userId) return;
        error = "";
        await matches.findMatches(userId);
    }

    async function sendMatchRequest(targetProfile) {
        if (!userId) return;
        try {
            await matches.createMatch({
                userIdA: userId,
                userIdB: targetProfile.userId,
                characterIdA: "",
                characterIdB: "",
                compatibilityScore: targetProfile.compatibilityScore,
                matchType: targetProfile.matchType,
            });
            error = "";
        } catch (err) {
            error = err.message || "Error al enviar solicitud";
        }
    }

    async function respondMatch(matchId, accept) {
        try {
            await matches.respondToMatch(matchId, accept);
            pendingList = pendingList.filter((m) => m.$id !== matchId);

            if (accept) {
                // Navigate to consent/detail
                window.location.href = `/matching/${matchId}`;
            }
        } catch (err) {
            error = err.message || "Error";
        }
    }

    function getTypeInfo(type) {
        return MATCH_TYPES[type] || { emoji: "🔮", label: "Match", desc: "" };
    }

    function getScoreColor(score) {
        if (score >= 80) return "var(--sx-success)";
        if (score >= 60) return "var(--sx-brand-light)";
        if (score >= 40) return "var(--sx-yellow)";
        return "var(--sx-text-muted)";
    }
</script>

<svelte:head>
    <title>Matching — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 600px; padding-top: var(--space-lg);"
>
    <h1 style="margin-bottom: var(--space-xs);">🔥 Matching Narrativo</h1>
    <p class="text-muted" style="margin-bottom: var(--space-xl);">
        Encontrá narradores compatibles con tu DNA y estilo
    </p>

    {#if error}
        <div class="alert alert-error" style="margin-bottom: var(--space-lg);">
            {error}
        </div>
    {/if}

    <!-- Pending Matches -->
    {#if pendingList.length > 0}
        <section class="match-section">
            <h2 class="section-title">⚡ Solicitudes Pendientes</h2>
            <div class="match-list">
                {#each pendingList as pm}
                    <div class="match-card pending-card">
                        <div class="match-card-header">
                            <div
                                class="match-score"
                                style="color: {getScoreColor(
                                    pm.compatibilityScore || 0,
                                )}"
                            >
                                {pm.compatibilityScore || "?"}%
                            </div>
                            <div class="match-info">
                                <span class="match-label"
                                    >{pm.matchType
                                        ? getTypeInfo(pm.matchType).emoji
                                        : "🔮"} Match de {pm.userIdA?.slice(
                                        0,
                                        6,
                                    )}...</span
                                >
                                <span
                                    class="text-subtle"
                                    style="font-size: 0.8rem;"
                                    >{getMatchLabel(
                                        pm.compatibilityScore || 0,
                                    )}</span
                                >
                            </div>
                        </div>
                        <div class="pending-actions">
                            <button
                                class="btn btn-primary btn-sm"
                                onclick={() => respondMatch(pm.$id, true)}
                                >Aceptar</button
                            >
                            <button
                                class="btn btn-ghost btn-sm"
                                onclick={() => respondMatch(pm.$id, false)}
                                >Rechazar</button
                            >
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {/if}

    <!-- Search -->
    <section class="match-section">
        <button
            class="btn btn-primary btn-lg btn-block"
            onclick={searchMatches}
            disabled={searching}
        >
            {#if searching}
                <span class="spinner"></span> Buscando...
            {:else}
                🔍 Buscar Matches
            {/if}
        </button>
    </section>

    <!-- Results -->
    {#if matchList.length > 0}
        <section class="match-section">
            <h2 class="section-title">🎯 Resultados ({matchList.length})</h2>
            <div class="match-list">
                {#each matchList as m, i}
                    {@const typeInfo = getTypeInfo(m.matchType)}
                    <div
                        class="match-card animate-up"
                        style="animation-delay: {i * 0.05}s"
                    >
                        <div class="match-card-header">
                            <div
                                class="score-ring"
                                style="--score-color: {getScoreColor(
                                    m.compatibilityScore,
                                )}"
                            >
                                <span class="score-value"
                                    >{m.compatibilityScore}</span
                                >
                                <span class="score-percent">%</span>
                            </div>
                            <div class="match-info">
                                <div class="match-type-row">
                                    <span class="badge badge-brand"
                                        >{typeInfo.emoji} {typeInfo.label}</span
                                    >
                                </div>
                                <span class="match-label-text"
                                    >{m.matchLabel}</span
                                >
                                <div class="match-meta text-subtle">
                                    {m.writingStyle || "?"} · Intensidad {m.preferredIntensity ||
                                        "?"}/5
                                </div>
                            </div>
                        </div>

                        {#if m.plotPreferences?.length > 0}
                            <div class="match-chips">
                                {#each m.plotPreferences.slice(0, 4) as p}
                                    <span class="mini-chip">{p}</span>
                                {/each}
                            </div>
                        {/if}

                        <button
                            class="btn btn-secondary btn-sm btn-block"
                            onclick={() => sendMatchRequest(m)}
                        >
                            ⚡ Enviar Solicitud
                        </button>
                    </div>
                {/each}
            </div>
        </section>
    {:else if !searching}
        <div
            class="card"
            style="text-align: center; padding: var(--space-2xl); border-style: dashed; margin-top: var(--space-lg);"
        >
            <p style="font-size: 2rem; margin-bottom: var(--space-md);">🔮</p>
            <p class="text-muted">
                Hacé click en "Buscar Matches" para encontrar narradores
                compatibles.
            </p>
            <p
                class="text-subtle"
                style="font-size: 0.85rem; margin-top: var(--space-sm);"
            >
                Asegurate de tener tu <a href="/dna">DNA Narrativo</a> configurado.
            </p>
        </div>
    {/if}
</div>

<style>
    .match-section {
        margin-bottom: var(--space-xl);
    }

    .section-title {
        font-family: var(--font-body);
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: var(--space-md);
    }

    .match-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .match-card {
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        transition: all var(--transition-base);
        opacity: 0;
        animation: fadeInUp 0.4s ease forwards;
    }

    .match-card:hover {
        border-color: var(--sx-brand);
        box-shadow: var(--shadow-glow);
    }

    .pending-card {
        border-color: rgba(233, 30, 99, 0.3);
        background: linear-gradient(
            145deg,
            var(--sx-bg-card),
            rgba(233, 30, 99, 0.04)
        );
        opacity: 1;
    }

    .match-card-header {
        display: flex;
        align-items: center;
        gap: var(--space-lg);
        margin-bottom: var(--space-md);
    }

    .score-ring {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 3px solid var(--score-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 0 12px
            color-mix(in srgb, var(--score-color) 30%, transparent);
    }

    .score-value {
        font-size: 1.3rem;
        font-weight: 800;
        line-height: 1;
        color: var(--score-color);
    }

    .score-percent {
        font-size: 0.6rem;
        color: var(--score-color);
        opacity: 0.7;
    }

    .match-score {
        font-size: 1.5rem;
        font-weight: 800;
        flex-shrink: 0;
    }

    .match-info {
        flex: 1;
        min-width: 0;
    }

    .match-type-row {
        margin-bottom: 2px;
    }

    .match-label-text {
        display: block;
        font-weight: 600;
        font-size: 0.95rem;
    }

    .match-meta {
        font-size: 0.82rem;
        margin-top: 2px;
    }

    .match-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: var(--space-md);
    }

    .mini-chip {
        padding: 0.15rem 0.5rem;
        border-radius: var(--radius-full);
        background: var(--sx-bg-input);
        font-size: 0.72rem;
        color: var(--sx-text-muted);
    }

    .pending-actions {
        display: flex;
        gap: var(--space-sm);
        margin-top: var(--space-sm);
    }
</style>
