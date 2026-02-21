<script>
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import { chat } from "$lib/stores/chat.js";
    import { rooms } from "$lib/stores/rooms.js";
    import { publishedStories } from "$lib/stores/publishedStories.js";

    let roomId = $state("");
    let userId = $state("");
    let room = $state(null);
    let allMessages = $state([]);
    let visibleMessages = $state([]);
    let newMessage = $state("");
    let loading = $state(true);
    let sending = $state(false);
    let messagesEl;

    // Room status
    let isFinished = $state(false);
    let isReplay = $state(false);
    let replayStarted = $state(false);
    let replayDone = $state(false);
    let replayTimers = [];

    // Publish
    let publishing = $state(false);
    let publishTitle = $state("");
    let publishSummary = $state("");
    let showPublishModal = $state(false);
    let publishSuccess = $state(false);

    // Finish
    let finishing = $state(false);

    onMount(() => {
        const unsubPage = page.subscribe((p) => {
            roomId = p.params.roomId;
        });

        const unsubAuth = auth.subscribe(async (state) => {
            if (state.user && roomId) {
                userId = state.user.$id;

                // Load room info
                try {
                    const { databases, DB, COLLECTIONS } = await import(
                        "$lib/appwrite.js"
                    );
                    room = await databases.getDocument(
                        DB.MAIN,
                        COLLECTIONS.ROOMS,
                        roomId,
                    );
                    isFinished = room.status === "FINISHED";
                    isReplay = isFinished;
                } catch {}

                await chat.loadMessages(roomId);

                if (!isFinished) {
                    chat.subscribeToMessages(roomId);
                }
            }
        });

        const unsubChat = chat.subscribe((state) => {
            allMessages = state.messages || [];
            loading = state.loading;

            if (!isReplay) {
                visibleMessages = allMessages;
                scrollBottom();
            }
        });

        return () => {
            unsubPage();
            unsubAuth();
            unsubChat();
        };
    });

    onDestroy(() => {
        chat.unsubscribe();
        replayTimers.forEach(clearTimeout);
    });

    function scrollBottom() {
        if (messagesEl) {
            setTimeout(() => {
                messagesEl.scrollTop = messagesEl.scrollHeight;
            }, 50);
        }
    }

    // ─── Replay ───
    function startReplay() {
        if (allMessages.length === 0) return;
        replayStarted = true;
        replayDone = false;
        visibleMessages = [];

        const baseTime = new Date(
            allMessages[0].createdAt || allMessages[0].$createdAt,
        ).getTime();
        const SPEED = 0.05; // 50ms per real second — speeds up replay

        allMessages.forEach((msg, i) => {
            const msgTime = new Date(msg.createdAt || msg.$createdAt).getTime();
            const delay = i === 0 ? 300 : (msgTime - baseTime) * SPEED;
            const clamped = Math.min(delay, 3000); // Max 3s between messages

            const timer = setTimeout(
                () => {
                    visibleMessages = [...visibleMessages, msg];
                    scrollBottom();

                    if (i === allMessages.length - 1) {
                        replayDone = true;
                    }
                },
                clamped + i * 200,
            ); // at least 200ms between each

            replayTimers.push(timer);
        });
    }

    function skipReplay() {
        replayTimers.forEach(clearTimeout);
        visibleMessages = [...allMessages];
        replayDone = true;
        replayStarted = true;
        scrollBottom();
    }

    // ─── Send ───
    async function sendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim() || sending || isFinished) return;
        sending = true;
        const content = newMessage.trim();
        newMessage = "";
        try {
            await chat.sendMessage(roomId, content, userId);
        } catch (err) {
            console.error("Error sending:", err);
            newMessage = content;
        } finally {
            sending = false;
        }
    }

    // ─── Finish Room ───
    async function finishRoom() {
        if (
            !confirm(
                "¿Finalizar esta historia? No se podrán enviar más mensajes.",
            )
        )
            return;
        finishing = true;
        try {
            const { databases, DB, COLLECTIONS } = await import(
                "$lib/appwrite.js"
            );
            await databases.updateDocument(DB.MAIN, COLLECTIONS.ROOMS, roomId, {
                status: "FINISHED",
            });
            room = { ...room, status: "FINISHED" };
            isFinished = true;
            chat.unsubscribe();
        } catch (e) {
            console.error(e);
        } finally {
            finishing = false;
        }
    }

    // ─── Publish ───
    async function publishStory() {
        if (!userId || !roomId) return;
        publishing = true;
        try {
            await publishedStories.publishStory({
                roomId,
                title:
                    publishTitle.trim() || room?.title || "Historia sin título",
                genre: room?.genre || "",
                intensity: room?.intensity || 3,
                summary: publishSummary.trim(),
                visibility: "public",
                publisherId: userId,
                authorIds: room?.participantIds || [userId],
            });
            publishSuccess = true;
            showPublishModal = false;
        } catch (e) {
            console.error(e);
        } finally {
            publishing = false;
        }
    }

    function handleExit() {
        if (confirm("¿Seguro que querés salir de esta historia?")) {
            window.location.href = "/home";
        }
    }
</script>

<svelte:head>
    <title>{isReplay ? "Replay" : "Chat"} — Sexteo</title>
</svelte:head>

<div class="chat-page">
    <!-- Header -->
    <header class="chat-header">
        <div class="chat-header-info">
            <h2
                style="font-family: var(--font-body); font-size: 1rem; font-weight: 600;"
            >
                {isFinished ? "📖" : "💬"}
                {room?.title || "Historia"}
            </h2>
            {#if isFinished}
                <span class="badge-finished">Finalizada</span>
            {/if}
        </div>
        <div class="chat-header-actions">
            {#if !isFinished}
                <button class="btn btn-sm btn-ghost" title="Reportar">🚩</button
                >
                <button
                    class="btn btn-sm btn-ghost"
                    onclick={finishRoom}
                    disabled={finishing}
                >
                    {finishing ? "..." : "✅ Finalizar"}
                </button>
                <button class="btn btn-sm btn-danger" onclick={handleExit}
                    >Salir</button
                >
            {:else}
                {#if !publishSuccess}
                    <button
                        class="btn btn-sm btn-primary"
                        onclick={() => {
                            showPublishModal = true;
                        }}
                    >
                        📤 Publicar
                    </button>
                {/if}
                <a href="/rate/{roomId}" class="btn btn-sm btn-ghost"
                    >⭐ Valorar</a
                >
                <a href="/home" class="btn btn-sm btn-ghost">🏡</a>
            {/if}
        </div>
    </header>

    <!-- Replay Banner -->
    {#if isReplay && !replayStarted}
        <div class="replay-banner">
            <div class="replay-banner-content">
                <p style="font-size: 1.5rem; margin-bottom: var(--space-sm);">
                    📖
                </p>
                <h3>Esta historia ya finalizó</h3>
                <p
                    class="text-subtle"
                    style="margin: var(--space-sm) 0 var(--space-lg); line-height: 1.4;"
                >
                    Podés revivir la narrativa con una animación que reproduce
                    los mensajes según los tiempos originales, o ver todo de
                    una.
                </p>
                <div class="replay-actions">
                    <button
                        class="btn btn-primary btn-lg"
                        onclick={startReplay}
                    >
                        ▶️ Reproducir Historia
                    </button>
                    <button class="btn btn-ghost" onclick={skipReplay}>
                        ⏩ Ver todo
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Messages -->
    <div class="chat-messages" bind:this={messagesEl}>
        {#if loading}
            <div
                style="display: flex; justify-content: center; padding: var(--space-3xl);"
            >
                <div class="spinner"></div>
            </div>
        {:else if !isReplay || replayStarted}
            {#if visibleMessages.length === 0 && !isReplay}
                <div class="chat-empty">
                    <p style="font-size: 2rem; margin-bottom: var(--space-md);">
                        💬
                    </p>
                    <p class="text-muted">Iniciá la conversación…</p>
                </div>
            {:else}
                {#each visibleMessages as msg, i}
                    <div
                        class="message"
                        class:own={msg.senderId === userId}
                        style={isReplay
                            ? `animation: msgAppear 0.4s ease forwards; animation-delay: ${i * 0.02}s`
                            : ""}
                    >
                        <div
                            class="message-bubble"
                            class:own={msg.senderId === userId}
                        >
                            <p class="message-content">{msg.content}</p>
                            <span class="message-time text-subtle">
                                {new Date(
                                    msg.createdAt || msg.$createdAt,
                                ).toLocaleTimeString("es-AR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    </div>
                {/each}

                <!-- Replay Done: CTA -->
                {#if replayDone}
                    <div class="replay-end animate-in">
                        <p
                            style="font-size: 2rem; margin-bottom: var(--space-md);"
                        >
                            🎬
                        </p>
                        <p
                            style="font-weight: 600; margin-bottom: var(--space-sm);"
                        >
                            Fin de la historia
                        </p>
                        <p
                            class="text-subtle"
                            style="margin-bottom: var(--space-lg); font-size: 0.88rem;"
                        >
                            ¿Te gustó? Dejá tu valoración a los narradores.
                        </p>
                        <div
                            style="display: flex; gap: var(--space-sm); justify-content: center; flex-wrap: wrap;"
                        >
                            <a href="/rate/{roomId}" class="btn btn-primary"
                                >⭐ Valorar Narradores</a
                            >
                            {#if !publishSuccess}
                                <button
                                    class="btn btn-secondary"
                                    onclick={() => {
                                        showPublishModal = true;
                                    }}
                                >
                                    📤 Publicar Historia
                                </button>
                            {:else}
                                <span class="badge badge-brand"
                                    >✅ Publicada</span
                                >
                            {/if}
                            <a href="/stories" class="btn btn-ghost"
                                >📚 Ver Historias</a
                            >
                        </div>
                    </div>
                {/if}
            {/if}
        {/if}
    </div>

    <!-- Input Bar (only for active rooms) -->
    {#if !isFinished}
        <form class="chat-input-bar" onsubmit={sendMessage}>
            <input
                type="text"
                class="form-input chat-input"
                placeholder="Escribí tu mensaje..."
                bind:value={newMessage}
                autocomplete="off"
            />
            <button
                type="submit"
                class="btn btn-primary chat-send"
                disabled={!newMessage.trim() || sending}
            >
                {sending ? "..." : "→"}
            </button>
        </form>
    {:else if !isReplay || replayStarted}
        <div class="chat-input-bar disabled-bar">
            <span class="text-subtle" style="font-size: 0.85rem;"
                >📖 Historia finalizada — Solo lectura</span
            >
        </div>
    {/if}
</div>

<!-- Publish Modal -->
{#if showPublishModal}
    <div
        class="modal-overlay"
        onclick={() => {
            showPublishModal = false;
        }}
    >
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>
            <h3 style="margin-bottom: var(--space-lg);">
                📤 Publicar Historia
            </h3>
            <div class="form-group">
                <label class="form-label">Título</label>
                <input
                    type="text"
                    class="form-input"
                    bind:value={publishTitle}
                    placeholder={room?.title || "Título de la historia"}
                />
            </div>
            <div class="form-group">
                <label class="form-label">Resumen (opcional)</label>
                <textarea
                    class="form-input"
                    rows="3"
                    bind:value={publishSummary}
                    placeholder="Una breve descripción..."
                    maxlength="300"
                ></textarea>
            </div>
            <div
                style="display: flex; gap: var(--space-sm); margin-top: var(--space-lg);"
            >
                <button
                    class="btn btn-primary btn-block"
                    onclick={publishStory}
                    disabled={publishing}
                >
                    {publishing ? "..." : "📤 Publicar"}
                </button>
                <button
                    class="btn btn-ghost"
                    onclick={() => {
                        showPublishModal = false;
                    }}>Cancelar</button
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .chat-page {
        display: flex;
        flex-direction: column;
        height: calc(100dvh - 53px);
        max-width: 650px;
        margin: calc(-1 * var(--space-lg)) auto;
        width: 100%;
    }

    .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-sm) var(--space-lg);
        border-bottom: 1px solid var(--sx-border);
        background: var(--sx-bg-elevated);
        flex-shrink: 0;
    }

    .chat-header-actions {
        display: flex;
        gap: var(--space-xs);
        align-items: center;
    }

    .badge-finished {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: var(--radius-full);
        background: rgba(74, 222, 128, 0.15);
        color: var(--sx-success);
        margin-left: var(--space-xs);
    }

    /* Messages */
    .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .chat-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .message {
        display: flex;
        justify-content: flex-start;
    }
    .message.own {
        justify-content: flex-end;
    }

    .message-bubble {
        max-width: 75%;
        padding: 0.6rem 1rem;
        border-radius: var(--radius-lg);
        background: var(--sx-bg-card);
        border: 1px solid var(--sx-border);
    }

    .message-bubble.own {
        background: rgba(233, 30, 99, 0.12);
        border-color: rgba(233, 30, 99, 0.25);
    }

    .message-content {
        font-size: 0.95rem;
        line-height: 1.5;
        word-break: break-word;
    }

    .message-time {
        display: block;
        font-size: 0.7rem;
        text-align: right;
        margin-top: 2px;
    }

    /* Input */
    .chat-input-bar {
        display: flex;
        gap: var(--space-sm);
        padding: var(--space-md) var(--space-lg);
        border-top: 1px solid var(--sx-border);
        background: var(--sx-bg-elevated);
        flex-shrink: 0;
    }

    .disabled-bar {
        justify-content: center;
        opacity: 0.7;
    }

    .chat-input {
        flex: 1;
        border-radius: var(--radius-full);
    }
    .chat-send {
        border-radius: var(--radius-full);
        padding: 0.6rem 1.2rem;
        font-size: 1.1rem;
    }

    /* Replay Banner */
    .replay-banner {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: var(--space-xl);
    }

    .replay-banner-content {
        max-width: 400px;
    }

    .replay-banner h3 {
        font-size: 1.2rem;
    }

    .replay-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    /* Replay End */
    .replay-end {
        text-align: center;
        padding: var(--space-2xl) var(--space-lg);
        margin-top: var(--space-xl);
        border-top: 1px solid var(--sx-border);
    }

    @keyframes msgAppear {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 200;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-lg);
    }

    .modal-content {
        background: var(--sx-bg-surface);
        border: 1px solid var(--sx-border);
        border-radius: var(--radius-xl);
        padding: var(--space-xl);
        max-width: 420px;
        width: 100%;
        box-shadow: var(--shadow-lg);
    }
</style>
