<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";

    let visible = $state(false);

    onMount(() => {
        if (browser) {
            const verified = localStorage.getItem("sx_age_verified");
            if (verified !== "true") {
                window.location.href = "/";
                return;
            }
        }
        visible = true;
    });
</script>

<svelte:head>
    <title>Sexteo — Donde las fantasías hablan</title>
</svelte:head>

{#if visible}
    <div class="landing">
        <!-- Hero -->
        <section class="hero">
            <div class="hero-bg"></div>
            <div class="hero-content animate-in">
                <div class="hero-logo-wrap">
                    <img src="/logo.svg" alt="Sexteo" class="hero-logo" />
                </div>
                <h1 class="hero-title">
                    Donde las fantasías <span class="text-brand">hablan</span>
                </h1>
                <p class="hero-tagline">
                    Viví historias que no existen… con personas reales.
                </p>
                <p class="hero-desc text-muted">
                    Creá personajes, encontrá tu match narrativo y viví
                    experiencias únicas en tiempo real.
                </p>

                <div class="hero-actions">
                    <a href="/register" class="btn btn-primary btn-lg"
                        >Comenzar Ahora</a
                    >
                    <a href="/login" class="btn btn-secondary btn-lg"
                        >Ya tengo cuenta</a
                    >
                </div>
            </div>
        </section>

        <!-- Features -->
        <section class="features container">
            <div class="features-grid">
                <div
                    class="feature-card animate-up"
                    style="animation-delay: 0.1s"
                >
                    <span class="feature-icon">🎭</span>
                    <h3>Creá Personajes</h3>
                    <p class="text-muted">
                        Inventá identidades únicas con personalidad, estilo y
                        límites propios.
                    </p>
                </div>
                <div
                    class="feature-card animate-up"
                    style="animation-delay: 0.2s"
                >
                    <span class="feature-icon">🔥</span>
                    <h3>Match Narrativo</h3>
                    <p class="text-muted">
                        Un algoritmo que empareja experiencias potenciales, no
                        solo perfiles.
                    </p>
                </div>
                <div
                    class="feature-card animate-up"
                    style="animation-delay: 0.3s"
                >
                    <span class="feature-icon">💬</span>
                    <h3>Historias en Vivo</h3>
                    <p class="text-muted">
                        Chat en tiempo real donde cada mensaje construye la
                        narrativa.
                    </p>
                </div>
                <div
                    class="feature-card animate-up"
                    style="animation-delay: 0.4s"
                >
                    <span class="feature-icon">🛡️</span>
                    <h3>Seguro y Consensuado</h3>
                    <p class="text-muted">
                        Límites configurables, pausa emocional y sistema de
                        reputación.
                    </p>
                </div>
            </div>
        </section>

        <!-- CTA Bottom -->
        <section class="cta-bottom">
            <div class="container">
                <p class="cta-text">
                    Entretenimiento narrativo adulto interactivo
                </p>
                <a href="/register" class="btn btn-primary">Crear mi cuenta</a>
            </div>
        </section>
    </div>
{/if}

<style>
    .landing {
        min-height: 100dvh;
    }

    /* Hero */
    .hero {
        position: relative;
        min-height: 85dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .hero-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(
                ellipse at 30% 20%,
                rgba(233, 30, 99, 0.12) 0%,
                transparent 60%
            ),
            radial-gradient(
                ellipse at 70% 80%,
                rgba(156, 39, 176, 0.08) 0%,
                transparent 60%
            );
    }

    .hero-content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: var(--space-2xl);
        max-width: 600px;
    }

    .hero-logo-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: var(--space-xl);
        filter: drop-shadow(0 0 40px var(--sx-brand-glow));
    }

    .hero-logo {
        width: 100px;
        height: 100px;
    }

    .hero-title {
        font-size: 3rem;
        margin-bottom: var(--space-md);
        letter-spacing: -0.02em;
    }

    .hero-tagline {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 1.2rem;
        color: var(--sx-text-muted);
        margin-bottom: var(--space-md);
    }

    .hero-desc {
        font-size: 1rem;
        max-width: 420px;
        margin: 0 auto var(--space-xl);
        line-height: 1.6;
    }

    .hero-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
        align-items: center;
    }

    @media (min-width: 480px) {
        .hero-actions {
            flex-direction: row;
            justify-content: center;
        }
    }

    /* Features */
    .features {
        padding: var(--space-3xl) var(--space-lg);
        max-width: 900px;
    }

    .features-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-lg);
    }

    @media (min-width: 600px) {
        .features-grid {
            grid-template-columns: 1fr 1fr;
        }
    }

    .feature-card {
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        text-align: center;
        transition: all var(--transition-base);
        opacity: 0;
    }

    .feature-card:hover {
        border-color: var(--sx-brand);
        transform: translateY(-4px);
        box-shadow: var(--shadow-glow);
    }

    .feature-icon {
        font-size: 2.5rem;
        display: block;
        margin-bottom: var(--space-md);
    }

    .feature-card h3 {
        font-family: var(--font-body);
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: var(--space-sm);
    }

    .feature-card p {
        font-size: 0.9rem;
        line-height: 1.5;
    }

    /* CTA Bottom */
    .cta-bottom {
        padding: var(--space-3xl) var(--space-lg);
        text-align: center;
        border-top: 1px solid var(--sx-border);
    }

    .cta-text {
        font-family: var(--font-display);
        font-size: 1.1rem;
        color: var(--sx-text-muted);
        margin-bottom: var(--space-lg);
    }

    @media (min-width: 768px) {
        .hero-title {
            font-size: 3.5rem;
        }
    }
</style>
