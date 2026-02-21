<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { auth } from "$lib/stores/auth.js";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state("");

    onMount(() => {
        if (browser && localStorage.getItem("sx_age_verified") !== "true") {
            window.location.href = "/";
        }
    });

    async function handleLogin(e) {
        e.preventDefault();
        if (!email || !password) {
            error = "Completá todos los campos.";
            return;
        }
        error = "";
        loading = true;
        try {
            await auth.login(email, password);
            window.location.href = "/home";
        } catch (err) {
            error = err.message || "Error al iniciar sesión.";
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Iniciar Sesión — Sexteo</title>
</svelte:head>

<div class="page-center">
    <div class="auth-container animate-in">
        <a href="/welcome" class="auth-back">← Volver</a>

        <h1 class="auth-title">Bienvenido de vuelta</h1>
        <p class="text-muted auth-subtitle">
            Ingresá a tu cuenta para continuar
        </p>

        {#if error}
            <div class="alert alert-error">{error}</div>
        {/if}

        <form onsubmit={handleLogin} class="auth-form">
            <div class="form-group">
                <label for="email" class="form-label">Email</label>
                <input
                    id="email"
                    type="email"
                    class="form-input"
                    placeholder="tu@email.com"
                    bind:value={email}
                    autocomplete="email"
                />
            </div>

            <div class="form-group">
                <label for="password" class="form-label">Contraseña</label>
                <input
                    id="password"
                    type="password"
                    class="form-input"
                    placeholder="••••••••"
                    bind:value={password}
                    autocomplete="current-password"
                />
            </div>

            <button
                type="submit"
                class="btn btn-primary btn-block btn-lg"
                disabled={loading}
            >
                {#if loading}
                    <span class="spinner"></span>
                {:else}
                    Ingresar
                {/if}
            </button>
        </form>

        <div class="divider"></div>

        <p class="auth-link text-muted">
            ¿No tenés cuenta? <a href="/register">Registrate</a>
        </p>
    </div>
</div>

<style>
    .auth-container {
        width: 100%;
        max-width: 400px;
        padding: var(--space-2xl);
    }

    .auth-back {
        display: inline-block;
        font-size: 0.85rem;
        color: var(--sx-text-muted);
        margin-bottom: var(--space-xl);
        transition: color var(--transition-fast);
    }
    .auth-back:hover {
        color: var(--sx-brand-light);
    }

    .auth-title {
        font-size: 1.8rem;
        margin-bottom: var(--space-xs);
    }

    .auth-subtitle {
        margin-bottom: var(--space-xl);
    }

    .auth-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
    }

    .auth-link {
        text-align: center;
        font-size: 0.9rem;
    }

    .alert {
        margin-bottom: var(--space-md);
    }
</style>
