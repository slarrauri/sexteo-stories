# 🏗️ Fase 1 — Plan de Implementación Detallado

> **Objetivo**: Flujo completo → landing → registro → perfil → explorar → chat 1-1 en tiempo real  
> **Stack**: SvelteKit 5 + Appwrite Cloud  
> **Estado actual**: Landing + onboarding parcial + auth anónimo + 4 colecciones básicas

---

## Resumen del Estado Actual

### Lo que ya existe y funciona ✅
- Landing page (`/`) con Hero, Features, Worlds, SocialProof, SEOHead
- Layout global con ParticleCanvas, AmbientGlow, AuroraProgress
- Auth store con sesión anónima → registro (email+password) → login → logout
- Onboarding store con 3 flujos (explore, create, chat)
- Rutas: `/welcome`, `/intent`, `/explore/*`, `/create/*`, `/chat/*`, `/tutorial`, `/done`, `/verify`
- 4 colecciones Appwrite: `users`, `characters`, `onboarding_progress`, `stories`
- 1 bucket: `avatars`
- CSS design system: `variables.css`, `global.css`, `components.css`

### Lo que falta para Fase 1 🔧
- Colecciones `rooms`, `messages`, `reports` 
- Schema actualizado de `users` y `onboarding_progress`
- Pantalla de Login/Registro real (no solo anónimo)
- Pantalla de Perfil de usuario
- Chat en tiempo real con Appwrite Realtime
- Sistema de reportes

---

## Plan de Cambios

### 1. Backend — Colecciones y Scripts

---

#### [MODIFY] [setup-appwrite.js](file:///f:/Proyectos/Sexteo.com/ONBOARDING/scripts/setup-appwrite.js)

Reescribir el script de setup con el schema actualizado de Fase 1:

- **`users`**: Agregar campos: `bio`, `avatarFileId`, `age`, `gender`, `globalState`, `monetizationTier`, `engagementLevel`, `storiesCompleted`, `isVerified`, `isOnline`, `lastActiveAt`
- **`onboarding_progress`**: Agregar campos: `narrativeTestDone`, `characterCreated`, `limitsConfigured`, `demoStoryDone`
- **`rooms`** (nueva): `type`, `title`, `genre`, `worldCategory`, `intensity`, `status`, `participantIds`, `maxParticipants`, `creatorId`, `narrativeContext`, `messageCount`, `lastMessageAt`, `startedAt`, `finishedAt`, `createdAt`
- **`messages`** (nueva): `roomId`, `senderId`, `characterId`, `content`, `messageType`, `isNarratorAI`, `mediaFileId`, `createdAt`
- **`reports`** (nueva): `reporterId`, `reportedId`, `roomId`, `reason`, `description`, `status`, `adminNotes`, `resolvedAt`, `createdAt`

---

#### [NEW] [migrate-v1-to-phase1.js](file:///f:/Proyectos/Sexteo.com/ONBOARDING/scripts/migrate-v1-to-phase1.js)

Script de migración que:
1. Agrega nuevos atributos a colecciones existentes (`users`, `onboarding_progress`)
2. Actualiza documentos existentes con valores default
3. Crea colecciones nuevas (`rooms`, `messages`, `reports`)
4. No toca la colección `stories` (legacy, se depreca en Fase 2)
5. No elimina atributos existentes para no romper nada

---

#### [MODIFY] [appwrite.js](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/appwrite.js)

Actualizar constantes `COLLECTIONS` para incluir las nuevas colecciones:

```diff
 export const COLLECTIONS = {
     USERS: 'users',
-    CHARACTERS: 'characters',
     ONBOARDING_PROGRESS: 'onboarding_progress',
-    STORIES: 'stories',
+    CHARACTERS: 'characters',
+    STORIES: 'stories',       // Legacy — deprecar en Fase 2
+    ROOMS: 'rooms',
+    MESSAGES: 'messages',
+    REPORTS: 'reports',
 };
```

---

### 2. Backend — Stores y Servicios

---

#### [NEW] [rooms.js](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/stores/rooms.js)

Store para gestión de salas:
- `createRoom(type, title, genre, participantIds)` — crea sala PRIVATE o GROUP
- `joinRoom(roomId)` — unirse a sala existente
- `leaveRoom(roomId)` — salir de sala
- `listMyRooms()` — listar salas del usuario (activas y finalizadas)
- `updateRoomStatus(roomId, status)` — cambiar estado (ACTIVE, PAUSED, FINISHED)
- Suscripción Realtime a cambios en las salas del usuario

---

#### [NEW] [chat.js](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/stores/chat.js)

Store para el chat en tiempo real:
- `loadMessages(roomId, limit)` — cargar mensajes con paginación
- `sendMessage(roomId, content, characterId)` — enviar mensaje con detección de tipo
- `subscribeToMessages(roomId)` — suscripción Realtime a nuevos mensajes
- `detectMessageType(content)` — clasificar ACTION | DIALOGUE | NARRATION
- `proposeFinish(roomId)` — proponer finalización
- Estado reactivo: `messages`, `loading`, `error`

---

#### [MODIFY] [auth.js](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/stores/auth.js)

Extender el store de auth:
- Agregar `updateProfile(data)` — actualizar displayName, bio, avatar
- Agregar `recoverPassword(email)` — enviar email de recuperación
- Agregar `isRegistered` (getter derivado) — true si no es sesión anónima
- Mejorar `init()` para cargar el documento `users` del perfil extendido (globalState, etc.)

---

#### [NEW] [user-profile.js](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/stores/user-profile.js)

Store para el perfil extendido del usuario (datos en la colección `users`):
- `loadProfile(userId)` — cargar perfil de Appwrite DB
- `updateProfile(fields)` — actualizar campos del perfil
- `uploadAvatar(file)` — subir avatar al bucket
- Estado reactivo: `profile`, `loading`

---

#### [NEW] [reports.js](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/stores/reports.js)

Store para reportes:
- `createReport(reportedId, roomId, reason, description)` — enviar reporte
- Validar máximo 5 reportes/día

---

### 3. Frontend — Pantallas Nuevas

---

#### [NEW] [+page.svelte (auth)](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/auth/+page.svelte)

Pantalla de Login/Registro con tabs:
- Tab "Iniciar sesión": email + password → `auth.login()`
- Tab "Registrarse": nombre + email + password + checkbox +18 → `auth.register()`
- Link "Olvidé mi contraseña" → `auth.recoverPassword()`
- Redirección post-login: si tiene onboarding completo → `/explore`, sino → `/welcome`
- Diseño: glassmorphism card, animaciones de entrada, consistente con la landing

---

#### [NEW] [+page.svelte (profile)](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/profile/+page.svelte)

Pantalla de Perfil:
- Avatar (upload + preview)
- Display name (editable)
- Bio narrativa (textarea, max 500 chars)
- Tags de interés (input de tags)
- Estado actual (badge visual del globalState)
- Botón guardar → `userProfile.updateProfile()`
- Diseño: card con glassmorphism, avatar circular con border glow

---

#### [MODIFY] [+page.svelte (explore)](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/explore/+page.svelte)

Refactorizar la pantalla de exploración:
- Grid de salas activas públicas (si las hay)
- Botón "Crear nueva historia" → modal para crear room
- Lista de "Mis historias" (rooms del usuario)
- Indicador de estado de cada room (ACTIVE, PAUSED, FINISHED)
- Click en room → navegar a `/chat/[roomId]`

---

#### [NEW] [+page.svelte (chat/[roomId])](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/chat/[roomId]/+page.svelte)

Pantalla de Chat en tiempo real:
- Header: título de la historia + género + badge de intensidad + botón salir
- Área de mensajes con scroll automático:
  - Mensajes propios (alineados derecha, color brand)
  - Mensajes del otro (alineados izquierda, color neutro)
  - Mensajes de sistema (centrados, badge)
  - Formato visual diferenciado para ACTION (*itálica*) vs DIALOGUE vs NARRATION
- Input de mensaje con botón enviar
- Nombre del personaje sobre cada mensaje
- Botones de acción: pausa emocional 🔴, finalizar historia 📖, reportar ⚠️
- Modal de reporte (razón + descripción)

---

#### [NEW] [+page.svelte (chat/[roomId] layout)](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/chat/[roomId]/+layout.svelte)

Layout del chat que:
- Oculta ParticleCanvas y AmbientGlow (rendimiento en chat activo)
- Header fijo con info del room
- Footer fijo con input de mensaje

---

### 4. Frontend — Componentes Compartidos

---

#### [NEW] [ChatBubble.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/components/chat/ChatBubble.svelte)

Burbuja de mensaje con:
- Nombre del personaje (o "Sistema" para SYSTEM)
- Estilo visual según `messageType` (ACTION en itálica con fondo, DIALOGUE normal, NARRATION descriptivo)
- Timestamp relativo
- Animación de entrada

---

#### [NEW] [ChatInput.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/components/chat/ChatInput.svelte)

Input de chat con:
- Textarea autoexpandible (max 5000 chars)
- Contador de caracteres
- Botón enviar (deshabilitado si vacío)
- Enter para enviar, Shift+Enter para nueva línea
- Indicador sutil del tipo detectado (ACTION/DIALOGUE/NARRATION)

---

#### [NEW] [RoomCard.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/components/rooms/RoomCard.svelte)

Tarjeta de room para el explorador:
- Título + género + intensidad (estrellas)
- Participantes (avatares)
- Estado (badge colorido)
- Último mensaje (preview truncado)
- Click → navegar al chat

---

#### [NEW] [ReportModal.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/lib/components/ReportModal.svelte)

Modal de reporte:
- Selección de razón (HARASSMENT, LIMIT_VIOLATION, SPAM, INAPPROPRIATE, OTHER)
- Textarea de descripción (máx 1000 chars)
- Botón enviar + confirmación

---

### 5. Navegación y Protección de Rutas

---

#### [MODIFY] [+layout.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/+layout.svelte)

Agregar lógica de protección de rutas:
- Si no hay sesión y ruta protegida → redirect a `/auth`
- Si hay sesión anónima y ruta protegida → redirect a `/auth`
- Si hay sesión pero sin onboarding → redirect a `/welcome`
- Rutas públicas: `/`, `/auth`, `/verify`

---

## Estructura de Archivos Resultante (Fase 1)

```
src/
├── lib/
│   ├── appwrite.js                 🔄 actualizado
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatBubble.svelte   🆕
│   │   │   └── ChatInput.svelte    🆕
│   │   ├── rooms/
│   │   │   └── RoomCard.svelte     🆕
│   │   ├── ReportModal.svelte      🆕
│   │   ├── Logo.svelte             ✅
│   │   ├── BrandName.svelte        ✅
│   │   ├── ParticleCanvas.svelte   ✅
│   │   ├── AmbientGlow.svelte      ✅
│   │   ├── AuroraProgress.svelte   ✅
│   │   └── landing/                ✅
│   ├── stores/
│   │   ├── auth.js                 🔄 extendido
│   │   ├── onboarding.js           ✅
│   │   ├── user-profile.js         🆕
│   │   ├── rooms.js                🆕
│   │   ├── chat.js                 🆕
│   │   └── reports.js              🆕
│   └── utils/                      ✅
├── routes/
│   ├── +layout.svelte              🔄 protección de rutas
│   ├── +page.svelte                ✅ landing
│   ├── auth/
│   │   └── +page.svelte            🆕
│   ├── profile/
│   │   └── +page.svelte            🆕
│   ├── explore/
│   │   └── +page.svelte            🔄 refactorizar
│   ├── chat/
│   │   └── [roomId]/
│   │       ├── +layout.svelte      🆕
│   │       └── +page.svelte        🆕
│   ├── welcome/                    ✅
│   ├── intent/                     ✅
│   ├── create/                     ✅
│   ├── tutorial/                   ✅
│   ├── done/                       ✅
│   └── verify/                     ✅
└── styles/                         ✅
scripts/
├── setup-appwrite.js               🔄 schema completo fase 1
├── migrate-v1-to-phase1.js         🆕
├── seed-demo.js                    🔄 datos demo actualizados
└── cleanup.js                      ✅
```

---

## Orden de Implementación

| Paso | Qué | Archivos | Dependencia |
|------|-----|----------|-------------|
| 1 | Script de setup actualizado | `setup-appwrite.js` | Ninguna |
| 2 | Migración de datos existentes | `migrate-v1-to-phase1.js` | Paso 1 |
| 3 | Constantes actualizadas | `appwrite.js` | Paso 1 |
| 4 | Store de perfil de usuario | `user-profile.js` | Paso 3 |
| 5 | Auth store extendido | `auth.js` | Paso 4 |
| 6 | Pantalla Auth (login/registro) | `auth/+page.svelte` | Paso 5 |
| 7 | Pantalla Perfil | `profile/+page.svelte` | Paso 4 |
| 8 | Store de rooms | `rooms.js` | Paso 3 |
| 9 | Store de chat | `chat.js` | Paso 3 |
| 10 | Componentes de chat | `ChatBubble`, `ChatInput` | Paso 9 |
| 11 | Pantalla de Chat | `chat/[roomId]/*` | Pasos 9, 10 |
| 12 | Componente RoomCard | `RoomCard.svelte` | Paso 8 |
| 13 | Pantalla Explore refactorizada | `explore/+page.svelte` | Pasos 8, 12 |
| 14 | Store de reportes | `reports.js` | Paso 3 |
| 15 | Modal de reporte | `ReportModal.svelte` | Paso 14 |
| 16 | Protección de rutas | `+layout.svelte` | Paso 5 |

---

## Plan de Verificación

### Test 1 — Setup de Backend
```bash
# Ejecutar el script de setup
node scripts/setup-appwrite.js

# Verificar que las colecciones fueron creadas/actualizadas
# Esperado: ✅ mensajes para users, rooms, messages, reports, onboarding_progress
```

### Test 2 — Migración
```bash
# Ejecutar migración
node scripts/migrate-v1-to-phase1.js

# Verificar en Appwrite Console que los documentos existentes tienen los nuevos campos
```

### Test 3 — Flujo de Registro (Manual en Browser)
1. Abrir `http://localhost:5173`
2. Click "Comenzar" en landing → debería ir a `/auth` (si no está logueado)
3. Tab "Registrarse" → llenar nombre, email, password, checkbox +18
4. Click "Crear cuenta" → debería redirigir a `/welcome` o `/explore`
5. Verificar en Appwrite Console que el usuario fue creado con `globalState: REGISTERED`

### Test 4 — Perfil de Usuario (Manual en Browser)
1. Con sesión activa, navegar a `/profile`
2. Editar display name, bio, subir avatar
3. Click "Guardar" → verificar cambios en Appwrite Console
4. Recargar página → datos persisten

### Test 5 — Chat en Tiempo Real (Manual en Browser)
1. Abrir 2 tabs con distintos usuarios
2. Usuario A: crear sala desde `/explore`
3. Usuario B: ver la sala y entrar
4. Usuario A: enviar mensaje `*camina lentamente*` → debería renderizar como ACTION
5. Usuario B: debería ver el mensaje en tiempo real sin recargar
6. Usuario B: enviar respuesta `—¿A dónde vas?` → debería renderizar como DIALOGUE
7. Verificar scroll automático y formato visual diferenciado

### Test 6 — Protección de Rutas (Manual en Browser)
1. Cerrar sesión (logout)
2. Intentar navegar a `/explore` → debería redirigir a `/auth`
3. Intentar navegar a `/chat/fake-room-id` → debería redirigir a `/auth`
4. Landing `/` debe seguir accesible sin auth

---

## Notas

> [!IMPORTANT]
> Antes de ejecutar los scripts de setup/migración, el usuario debe tener corriendo Appwrite y las variables de entorno configuradas en `.env`.

> [!WARNING]
> El script de migración modifica colecciones existentes. Hacer backup de datos si hay información valiosa.

> [!NOTE]
> Los tests son manuales para el MVP. Se automatizarán con Playwright en una fase posterior.
