<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";

    let confirmed = $state(false);
    let denied = $state(false);
    let checking = $state(true);

    onMount(() => {
        if (browser) {
            const verified = localStorage.getItem("sx_age_verified");
            if (verified === "true") {
                window.location.href = "/welcome";
                return;
            }
        }
        checking = false;
    });

    function confirmAge() {
        if (browser) {
            localStorage.setItem("sx_age_verified", "true");
        }
        confirmed = true;
        window.location.href = "/welcome";
    }

    function denyAge() {
        denied = true;
    }
</script>

<svelte:head>
    <title>Verificación de Edad — Sexteo</title>
</svelte:head>

{#if checking}
    <div class="page-center">
        <div class="spinner"></div>
    </div>
{:else if denied}
    <div class="page-center">
        <div class="gate-container animate-in">
            <div class="denied-icon">🚫</div>
            <h2>Acceso Restringido</h2>
            <p class="text-muted">
                Este contenido es exclusivamente para mayores de 18 años.
            </p>
        </div>
    </div>
{:else}
    <div class="page-center">
        <div class="gate-container animate-in">
            <div class="logo-glow">
                <img src="/logo.svg" alt="Sexteo" class="gate-logo" />
            </div>

            <h1 class="gate-title">Contenido para Adultos</h1>
            <p class="gate-subtitle">
                Esta plataforma contiene material exclusivo para personas
                mayores de 18 años.
            </p>

            <div class="gate-question">
                <p>¿Confirmás que sos mayor de 18 años?</p>
            </div>

            <div class="gate-actions">
                <button class="btn btn-primary btn-lg" onclick={confirmAge}>
                    Sí, soy mayor de 18
                </button>
                <button class="btn btn-ghost" onclick={denyAge}>
                    No, soy menor de edad
                </button>
            </div>

            <p class="gate-legal text-subtle">
                Al ingresar, aceptás los Términos y Condiciones y la Política de
                Privacidad de Sexteo.
            </p>
        </div>
    </div>
{/if}

<style>
    .gate-container {
        max-width: 440px;
        padding: var(--space-2xl);
        text-align: center;
    }

    .logo-glow {
        display: flex;
        justify-content: center;
        margin-bottom: var(--space-xl);
        filter: drop-shadow(0 0 30px var(--sx-brand-glow));
    }

    .gate-logo {
        width: 80px;
        height: 80px;
    }

    .gate-title {
        font-size: 2rem;
        margin-bottom: var(--space-sm);
        background: linear-gradient(
            135deg,
            var(--sx-brand-light),
            var(--sx-purple)
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .gate-subtitle {
        color: var(--sx-text-muted);
        font-size: 0.95rem;
        max-width: 320px;
        margin: 0 auto var(--space-xl);
        line-height: 1.5;
    }

    .gate-question {
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        margin-bottom: var(--space-xl);
    }

    .gate-question p {
        font-size: 1.15rem;
        font-weight: 600;
    }

    .gate-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
        margin-bottom: var(--space-xl);
    }

    .gate-legal {
        font-size: 0.75rem;
        line-height: 1.4;
    }

    .denied-icon {
        font-size: 4rem;
        margin-bottom: var(--space-lg);
    }
</style>
