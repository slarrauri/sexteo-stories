<script>
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { auth, isAuthenticated } from "$lib/stores/auth.js";
  import { matches } from "$lib/stores/matches.js";
  import { notifications, unreadCount } from "$lib/stores/notifications.js";

  let { children } = $props();

  let ready = $state(false);
  let currentPath = $state("");
  let pendingCount = $state(0);
  let notifUnread = $state(0);
  let profileMenuOpen = $state(false);

  onMount(async () => {
    if (browser && localStorage.getItem("sx_age_verified") !== "true") {
      window.location.href = "/";
      return;
    }

    await auth.init();

    const unsub = auth.subscribe((state) => {
      if (!state.loading && !state.user) {
        window.location.href = "/login";
        return;
      }
      if (!state.loading && state.user) {
        ready = true;
        matches
          .getPendingMatches(state.user.$id)
          .then((p) => {
            pendingCount = p.length;
          })
          .catch(() => {});
        notifications.loadNotifications(state.user.$id);
        notifications.subscribeRealtime(state.user.$id);
      }
    });

    const unsubUnread = unreadCount.subscribe((c) => {
      notifUnread = c;
    });

    currentPath = window.location.pathname;

    // Close profile menu on click outside
    function handleClickOutside(e) {
      if (profileMenuOpen && !e.target.closest(".profile-dropdown-wrapper")) {
        profileMenuOpen = false;
      }
    }
    document.addEventListener("click", handleClickOutside);

    return () => {
      unsub();
      unsubUnread();
      document.removeEventListener("click", handleClickOutside);
    };
  });

  onDestroy(() => {
    notifications.unsubscribeRealtime();
  });

  function toggleProfileMenu() {
    profileMenuOpen = !profileMenuOpen;
  }

  async function handleLogout() {
    profileMenuOpen = false;
    await auth.logout();
    window.location.href = "/welcome";
  }
</script>

{#if ready}
  <div class="app-layout">
    <nav class="app-nav">
      <a href="/home" class="nav-logo">
        <img src="/logo.svg" alt="Sexteo" class="nav-logo-img" />
        <span class="nav-brand">Sexteo</span>
        <span class="beta-badge">Beta</span>
      </a>

      <div class="nav-links">
        <a href="/home" class="nav-link" class:active={currentPath === "/home"}>
          <span class="nav-icon">📚</span>
          <span>Historias</span>
        </a>
        <a
          href="/characters"
          class="nav-link"
          class:active={currentPath.startsWith("/characters")}
        >
          <span class="nav-icon">🎭</span>
          <span>Personajes</span>
        </a>
        <a
          href="/matching"
          class="nav-link"
          class:active={currentPath.startsWith("/matching")}
        >
          <span class="nav-icon">🔥</span>
          <span>Matching</span>
          {#if pendingCount > 0}
            <span class="nav-badge">{pendingCount}</span>
          {/if}
        </a>
      </div>

      <div class="nav-right">
        <div class="profile-dropdown-wrapper">
          <button
            class="nav-link nav-profile-btn"
            class:active={profileMenuOpen}
            onclick={toggleProfileMenu}
          >
            <span class="nav-icon">👤</span>
            <span class="profile-caret">{profileMenuOpen ? "▲" : "▼"}</span>
          </button>

          {#if profileMenuOpen}
            <div class="profile-dropdown animate-in">
              <a
                href="/profile"
                class="dropdown-item"
                onclick={() => (profileMenuOpen = false)}
              >
                <span>👤</span> Mi Perfil
              </a>
              <a
                href="/characters?mine=true"
                class="dropdown-item"
                onclick={() => (profileMenuOpen = false)}
              >
                <span>🎭</span> Mis Personajes
              </a>
              <a
                href="/dna"
                class="dropdown-item"
                onclick={() => (profileMenuOpen = false)}
              >
                <span>🧬</span> DNA Narrativo
              </a>
              <a
                href="/limits"
                class="dropdown-item"
                onclick={() => (profileMenuOpen = false)}
              >
                <span>🛡️</span> Mis Límites
              </a>
              <a
                href="/characters/new"
                class="dropdown-item"
                onclick={() => (profileMenuOpen = false)}
              >
                <span>✨</span> Nuevo Personaje
              </a>
              <a
                href="/reputation"
                class="dropdown-item"
                onclick={() => (profileMenuOpen = false)}
              >
                <span>⭐</span> Reputación
              </a>
              <a
                href="/stories"
                class="dropdown-item"
                onclick={() => (profileMenuOpen = false)}
              >
                <span>📚</span> Mis Historias
              </a>
              <a
                href="/stories/requests"
                class="dropdown-item"
                onclick={() => (profileMenuOpen = false)}
              >
                <span>💲</span> Solicitudes de Compra
              </a>
              <div class="dropdown-divider"></div>
              <button
                class="dropdown-item dropdown-logout"
                onclick={handleLogout}
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          {/if}
        </div>

        <a
          href="/notifications"
          class="nav-link"
          class:active={currentPath === "/notifications"}
        >
          <span class="nav-icon">🔔</span>
          {#if notifUnread > 0}
            <span class="nav-badge">{notifUnread}</span>
          {/if}
        </a>
      </div>
    </nav>

    <main class="app-main">
      {@render children()}
    </main>
  </div>
{:else}
  <div class="page-center">
    <div class="spinner"></div>
  </div>
{/if}

<style>
  .app-layout {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .app-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-lg);
    background: rgba(26, 26, 28, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--sx-border);
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    text-decoration: none;
    flex-shrink: 0;
  }

  .nav-logo-img {
    width: 32px;
    height: 32px;
  }

  .nav-brand {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--sx-brand-light);
  }

  .beta-badge {
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-full);
    background: #22c55e;
    color: white;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    line-height: 1;
  }

  /* Centered nav links */
  .nav-links {
    display: flex;
    gap: var(--space-xs);
    justify-content: center;
    flex: 1;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 0.4rem 0.8rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--sx-text-muted);
    text-decoration: none;
    transition: all var(--transition-fast);
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
  }

  .nav-link:hover {
    color: var(--sx-text);
    background: var(--sx-bg-card);
  }

  .nav-link.active {
    color: var(--sx-brand-light);
    background: rgba(233, 30, 99, 0.1);
  }

  .nav-icon {
    font-size: 1rem;
  }

  /* Right side: profile + notifications */
  .nav-right {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-shrink: 0;
  }

  /* Profile dropdown */
  .profile-dropdown-wrapper {
    position: relative;
  }

  .nav-profile-btn {
    position: relative;
  }

  .profile-caret {
    font-size: 0.6rem;
    opacity: 0.6;
  }

  .profile-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 220px;
    background: var(--sx-bg-elevated, var(--sx-bg-card));
    border: 1px solid var(--sx-border);
    border-radius: var(--radius-lg);
    padding: var(--space-xs);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 200;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius-md);
    font-size: 0.88rem;
    font-weight: 500;
    color: var(--sx-text-muted);
    text-decoration: none;
    transition: all var(--transition-fast);
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    width: 100%;
    text-align: left;
  }

  .dropdown-item:hover {
    color: var(--sx-text);
    background: rgba(233, 30, 99, 0.08);
  }

  .dropdown-divider {
    height: 1px;
    background: var(--sx-border);
    margin: var(--space-xs) 0;
  }

  .dropdown-logout {
    color: var(--sx-error, #ef4444);
  }

  .dropdown-logout:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--sx-error, #ef4444);
  }

  .app-main {
    flex: 1;
    padding: var(--space-lg);
  }

  @media (max-width: 600px) {
    .nav-link span:not(.nav-icon):not(.nav-badge):not(.profile-caret) {
      display: none;
    }
    .nav-link {
      padding: 0.5rem;
    }
    .nav-brand {
      display: none;
    }
    .profile-dropdown {
      right: -40px;
    }
  }

  .nav-badge {
    background: var(--sx-brand);
    color: white;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: var(--radius-full);
    min-width: 16px;
    text-align: center;
    line-height: 1.3;
  }
</style>
