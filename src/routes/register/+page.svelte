<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { auth } from "$lib/stores/auth.js";
    import { userProfile } from "$lib/stores/user-profile.js";

    let name = $state("");
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let loading = $state(false);
    let error = $state("");

    onMount(() => {
        if (browser && localStorage.getItem("sx_age_verified") !== "true") {
            window.location.href = "/";
        }
    });

    async function handleRegister(e) {
        e.preventDefault();
        error = "";

        if (!name || !email || !password || !confirmPassword) {
            error = "Completá todos los campos.";
            return;
        }
        if (password.length < 8) {
            error = "La contraseña debe tener al menos 8 caracteres.";
            return;
        }
        if (password !== confirmPassword) {
            error = "Las contraseñas no coinciden.";
            return;
        }

        loading = true;
        try {
            const user = await auth.createAccount(email, password, name);
            // Create the user profile in Appwrite DB
            await userProfile.saveProfile(user.$id, {
                displayName: name,
                email: email,
                globalState: "REGISTERED",
                isVerified: true, // Age already verified
            });
            // Redirect to character creation (mandatory first character)
            window.location.href = "/characters/new";
        } catch (err) {
            error = err.message || "Error al crear la cuenta.";
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Crear Cuenta — Sexteo</title>
</svelte:head>

<div class="page-center">
    <div class="auth-container animate-in">
        <a href="/welcome" class="auth-back">← Volver</a>

        <h1 class="auth-title">Creá tu cuenta</h1>
        <p class="text-muted auth-subtitle">
            El comienzo de historias inolvidables
        </p>

        {#if error}
            <div class="alert alert-error">{error}</div>
        {/if}

        <form onsubmit={handleRegister} class="auth-form">
            <div class="form-group">
                <label for="name" class="form-label">Nombre</label>
                <input
                    id="name"
                    type="text"
                    class="form-input"
                    placeholder="¿Cómo te llamás?"
                    bind:value={name}
                    autocomplete="name"
                />
            </div>

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
                    placeholder="Mínimo 8 caracteres"
                    bind:value={password}
                    autocomplete="new-password"
                />
            </div>

            <div class="form-group">
                <label for="confirm" class="form-label"
                    >Confirmar Contraseña</label
                >
                <input
                    id="confirm"
                    type="password"
                    class="form-input"
                    placeholder="Repetí la contraseña"
                    bind:value={confirmPassword}
                    autocomplete="new-password"
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
                    Crear Cuenta
                {/if}
            </button>
        </form>

        <p class="auth-legal text-subtle">
            Al registrarte, aceptás los Términos y Condiciones y la Política de
            Privacidad.
        </p>

        <div class="divider"></div>

        <p class="auth-link text-muted">
            ¿Ya tenés cuenta? <a href="/login">Iniciá sesión</a>
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

    .auth-legal {
        text-align: center;
        font-size: 0.75rem;
        margin-top: var(--space-md);
        line-height: 1.4;
    }

    .auth-link {
        text-align: center;
        font-size: 0.9rem;
    }

    .alert {
        margin-bottom: var(--space-md);
    }
</style>
