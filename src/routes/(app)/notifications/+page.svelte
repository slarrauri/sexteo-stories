<script>
    import { onMount, onDestroy } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import {
        notifications,
        unreadCount,
        NOTIF_TYPES,
    } from "$lib/stores/notifications.js";

    let userId = $state(null);
    let items = $state([]);
    let loading = $state(true);
    let unread = $state(0);

    onMount(() => {
        const unsub = auth.subscribe(async (state) => {
            if (state.user) {
                userId = state.user.$id;
                await notifications.loadNotifications(userId);
                notifications.subscribeRealtime(userId);
            }
        });

        const unsubNotif = notifications.subscribe((s) => {
            items = s.items || [];
            loading = s.loading;
        });

        const unsubUnread = unreadCount.subscribe((c) => {
            unread = c;
        });

        return () => {
            unsub();
            unsubNotif();
            unsubUnread();
        };
    });

    onDestroy(() => {
        notifications.unsubscribeRealtime();
    });

    async function markAllRead() {
        if (userId) await notifications.markAllRead(userId);
    }

    async function handleClick(notif) {
        if (!notif.read) await notifications.markAsRead(notif.$id);
        if (notif.referenceId) {
            // Navigate based on type
            const type = notif.type;
            if (type === "match_request" || type === "match_accepted") {
                window.location.href = `/matching`;
            } else if (type === "new_message") {
                window.location.href = `/chat/${notif.referenceId}`;
            } else if (type === "room_invite") {
                window.location.href = `/chat/${notif.referenceId}`;
            } else if (type === "rating_received") {
                window.location.href = `/reputation`;
            }
        }
    }

    function getTypeInfo(type) {
        return NOTIF_TYPES[type] || { emoji: "📌", label: "Notificación" };
    }

    function timeAgo(dateStr) {
        if (!dateStr) return "";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "ahora";
        if (mins < 60) return `hace ${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `hace ${hrs}h`;
        return `hace ${Math.floor(hrs / 24)}d`;
    }
</script>

<svelte:head>
    <title>Notificaciones — Sexteo</title>
</svelte:head>

<div
    class="container animate-in"
    style="max-width: 560px; padding-top: var(--space-lg);"
>
    <div class="notif-header">
        <h1>🔔 Notificaciones</h1>
        {#if unread > 0}
            <button class="btn btn-ghost btn-sm" onclick={markAllRead}
                >Marcar todas como leídas</button
            >
        {/if}
    </div>

    {#if loading}
        <div
            style="display: flex; justify-content: center; padding: var(--space-3xl);"
        >
            <div class="spinner"></div>
        </div>
    {:else if items.length === 0}
        <div
            class="card"
            style="text-align: center; padding: var(--space-3xl); border-style: dashed;"
        >
            <p style="font-size: 2.5rem; margin-bottom: var(--space-md);">🔕</p>
            <p class="text-muted">No tenés notificaciones todavía</p>
        </div>
    {:else}
        <div class="notif-list">
            {#each items as notif, i}
                {@const typeInfo = getTypeInfo(notif.type)}
                <button
                    class="notif-item"
                    class:unread={!notif.read}
                    onclick={() => handleClick(notif)}
                    style="animation-delay: {i * 0.03}s"
                >
                    <span class="notif-emoji">{typeInfo.emoji}</span>
                    <div class="notif-content">
                        <span class="notif-title">{notif.title}</span>
                        {#if notif.body}
                            <span class="notif-body text-subtle"
                                >{notif.body}</span
                            >
                        {/if}
                        <span class="notif-time text-subtle"
                            >{timeAgo(notif.createdAt)}</span
                        >
                    </div>
                    {#if !notif.read}
                        <span class="notif-dot"></span>
                    {/if}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .notif-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-xl);
    }

    .notif-header h1 {
        font-size: 1.4rem;
    }

    .notif-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .notif-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-md);
        width: 100%;
        padding: var(--space-md) var(--space-lg);
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-md);
        text-align: left;
        font-family: var(--font-body);
        color: var(--sx-text);
        cursor: pointer;
        transition: all var(--transition-fast);
        opacity: 0;
        animation: fadeInUp 0.3s ease forwards;
    }

    .notif-item:hover {
        border-color: var(--sx-brand);
        transform: translateX(3px);
    }

    .notif-item.unread {
        background: linear-gradient(
            145deg,
            var(--sx-bg-card),
            rgba(233, 30, 99, 0.04)
        );
        border-color: rgba(233, 30, 99, 0.2);
    }

    .notif-emoji {
        font-size: 1.3rem;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .notif-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .notif-title {
        font-weight: 600;
        font-size: 0.9rem;
        line-height: 1.3;
    }

    .notif-body {
        font-size: 0.82rem;
        line-height: 1.3;
    }

    .notif-time {
        font-size: 0.75rem;
        margin-top: 2px;
    }

    .notif-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--sx-brand);
        flex-shrink: 0;
        margin-top: 6px;
        box-shadow: 0 0 6px var(--sx-brand-glow);
    }
</style>
