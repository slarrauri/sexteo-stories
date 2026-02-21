<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import { userProfile } from "$lib/stores/user-profile.js";

    let user = $state(null);
    let profile = $state(null);
    let loading = $state(true);
    let saving = $state(false);
    let message = $state("");

    let displayName = $state("");
    let bio = $state("");
    let gender = $state("");

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                user = state.user;
                await userProfile.loadProfile(state.user.$id);
            }
        });

        const unsubProfile = userProfile.subscribe((state) => {
            if (state.profile) {
                profile = state.profile;
                displayName = state.profile.displayName || "";
                bio = state.profile.bio || "";
                gender = state.profile.gender || "";
                loading = false;
            }
        });

        return () => {
            unsub();
            unsubProfile();
        };
    });

    async function handleSave(e) {
        e.preventDefault();
        if (!user) return;
        saving = true;
        message = "";

        try {
            await userProfile.saveProfile(user.$id, {
                displayName,
                bio,
                gender,
            });
            message = "✅ Perfil actualizado";
        } catch (err) {
            message = "❌ " + (err.message || "Error al guardar");
        } finally {
            saving = false;
        }
    }

    async function handleLogout() {
        await auth.logout();
        window.location.href = "/welcome";
    }
</script>

<svelte:head>
    <title>Mi Perfil — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 520px; padding-top: var(--space-lg);"
>
    <h1 style="margin-bottom: var(--space-xs);">Mi Perfil</h1>
    <p class="text-muted" style="margin-bottom: var(--space-xl);">
        Datos administrativos de tu cuenta
    </p>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else}
        <!-- Avatar -->
        <div class="profile-avatar-section">
            <div class="avatar avatar-lg">
                {displayName ? displayName[0].toUpperCase() : "?"}
            </div>
            <div>
                <p style="font-weight: 600;">{user?.name || displayName}</p>
                <p class="text-subtle" style="font-size: 0.85rem;">
                    {user?.email || ""}
                </p>
            </div>
        </div>

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

        <form onsubmit={handleSave} class="profile-form">
            <div class="form-group">
                <label for="displayName" class="form-label">Nombre</label>
                <input
                    id="displayName"
                    type="text"
                    class="form-input"
                    bind:value={displayName}
                    placeholder="Tu nombre"
                />
            </div>

            <div class="form-group">
                <label for="bio" class="form-label">Bio</label>
                <textarea
                    id="bio"
                    class="form-input"
                    bind:value={bio}
                    placeholder="Contá algo sobre vos..."
                    rows="3"
                ></textarea>
            </div>

            <div class="form-group">
                <label for="gender" class="form-label">Género</label>
                <select id="gender" class="form-input" bind:value={gender}>
                    <option value="">Preferido no decir</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="no-binario">No binario</option>
                    <option value="otro">Otro</option>
                </select>
            </div>

            <button
                type="submit"
                class="btn btn-primary btn-block"
                disabled={saving}
            >
                {#if saving}
                    <span class="spinner"></span>
                {:else}
                    Guardar Cambios
                {/if}
            </button>
        </form>

        <div class="divider"></div>

        <button class="btn btn-ghost btn-block" onclick={handleLogout}>
            Cerrar Sesión
        </button>
    {/if}
</div>

<style>
    .profile-avatar-section {
        display: flex;
        align-items: center;
        gap: var(--space-lg);
        margin-bottom: var(--space-xl);
        padding: var(--space-lg);
        background: var(--sx-bg-card);
        border-radius: var(--radius-lg);
        border: 1px solid var(--sx-border);
    }

    .profile-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
    }
</style>
