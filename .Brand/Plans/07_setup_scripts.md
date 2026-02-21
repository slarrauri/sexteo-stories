# 🛠️ Setup Scripts Plan — Sexteo Platform

> Scripts de provisioning para Appwrite: crear DB, colecciones, atributos, índices, buckets.
> **Archivo actual**: `scripts/setup-appwrite.js` (4 colecciones básicas)
> **Objetivo**: Expandir a las 14+ colecciones del schema completo

---

## 1. Estado Actual vs Objetivo

### Colecciones Actuales (setup-appwrite.js existente)

| Colección | Estado |
|-----------|--------|
| `users` | ✅ Existe (schema básico) |
| `characters` | ✅ Existe (schema básico) |
| `onboarding_progress` | ✅ Existe |
| `stories` | ✅ Existe (deprecar en favor de rooms) |

### Colecciones Objetivo (schema completo)

| Colección | Estado | Prioridad |
|-----------|--------|-----------|
| `users` | 🔄 Actualizar schema | Fase 1 |
| `characters` | 🔄 Actualizar schema | Fase 2 |
| `narrative_profiles` | 🆕 Crear | Fase 2 |
| `limits_config` | 🆕 Crear | Fase 2 |
| `rooms` | 🆕 Crear | Fase 1 |
| `messages` | 🆕 Crear | Fase 1 |
| `matches` | 🆕 Crear | Fase 2 |
| `reputation_scores` | 🆕 Crear | Fase 3 |
| `story_feedback` | 🆕 Crear | Fase 3 |
| `reports` | 🆕 Crear | Fase 1 |
| `notifications` | 🆕 Crear | Fase 3 |
| `onboarding_progress` | 🔄 Actualizar schema | Fase 1 |
| `subscriptions` | 🆕 Crear | Fase 3 |
| `analytics_events` | 🆕 Crear | Fase 3 |
| `typing_status` | 🆕 Crear (auxiliar) | Fase 2 |

---

## 2. Estructura de Scripts

### 2.1 Archivos a Crear/Modificar

```
scripts/
├── setup-appwrite.js          🔄 Reescribir con schema completo
├── setup-phase1.js            🆕 Solo colecciones Fase 1
├── setup-phase2.js            🆕 Solo colecciones Fase 2
├── setup-phase3.js            🆕 Solo colecciones Fase 3
├── migrate-v2.js              🆕 Migrar datos existentes al schema nuevo
├── seed-demo.js               🔄 Actualizar con datos demo completos
├── cleanup.js                 🔄 Actualizar para nuevas colecciones
└── utils/
    └── appwrite-helpers.js    🆕 Funciones compartidas
```

### 2.2 Helpers Compartidos

```javascript
// scripts/utils/appwrite-helpers.js

import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
import { config } from 'dotenv';

config();

export function createClient() {
    return new Client()
        .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
}

export const DB_ID = 'sexteo_main';

export const DEFAULT_PERMISSIONS = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
];

export const SERVER_ONLY_PERMISSIONS = [
    Permission.read(Role.users()),
    // create/update/delete solo via API key
];

export async function safeCreateCollection(databases, id, name, permissions, docSecurity = true) {
    try {
        await databases.createCollection(DB_ID, id, name, permissions, docSecurity);
        console.log(`✅ Collection "${id}" created`);
        return true;
    } catch (e) {
        if (e.code === 409) {
            console.log(`⏭️  Collection "${id}" already exists`);
            return false;
        }
        if (e.code === 403) {
            console.log(`⚠️  Collection "${id}" skipped (plan limit)`);
            return false;
        }
        throw e;
    }
}

export async function safeCreateAttribute(databases, collId, attr) {
    try {
        switch (attr.type) {
            case 'string':
                await databases.createStringAttribute(
                    DB_ID, collId, attr.key, attr.size,
                    attr.required ?? false, attr.default ?? undefined,
                    attr.array ?? false
                );
                break;
            case 'email':
                await databases.createEmailAttribute(DB_ID, collId, attr.key, attr.required ?? false);
                break;
            case 'integer':
                await databases.createIntegerAttribute(
                    DB_ID, collId, attr.key, attr.required ?? false,
                    attr.min ?? undefined, attr.max ?? undefined
                );
                break;
            case 'float':
                await databases.createFloatAttribute(
                    DB_ID, collId, attr.key, attr.required ?? false,
                    attr.min ?? undefined, attr.max ?? undefined
                );
                break;
            case 'boolean':
                await databases.createBooleanAttribute(
                    DB_ID, collId, attr.key, attr.required ?? false
                );
                break;
            case 'datetime':
                await databases.createDatetimeAttribute(DB_ID, collId, attr.key, attr.required ?? false);
                break;
        }
        console.log(`   📎 Attribute "${attr.key}" added`);
    } catch (e) {
        if (e.code === 409) console.log(`   ⏭️  Attribute "${attr.key}" exists`);
        else console.error(`   ❌ Error on "${attr.key}":`, e.message);
    }
}

export async function waitForAttributes(databases, collId) {
    let ready = false;
    while (!ready) {
        await new Promise(r => setTimeout(r, 1500));
        const coll = await databases.getCollection(DB_ID, collId);
        const attrs = coll.attributes || [];
        ready = attrs.length === 0 || attrs.every(a => a.status === 'available');
    }
}

export async function safeCreateIndex(databases, collId, idx) {
    try {
        await databases.createIndex(DB_ID, collId, idx.key, idx.type, idx.attributes, idx.orders);
        console.log(`   🔍 Index "${idx.key}" created`);
    } catch (e) {
        if (e.code === 409) console.log(`   ⏭️  Index "${idx.key}" exists`);
        else console.error(`   ❌ Error on index "${idx.key}":`, e.message);
    }
}
```

---

## 3. Schema Definitions por Fase

### 3.1 Fase 1 — Esqueleto

```javascript
// scripts/setup-phase1.js
export const PHASE1_COLLECTIONS = [
    {
        id: 'users',
        name: 'Users',
        permissions: DEFAULT_PERMISSIONS,
        attributes: [
            { type: 'string', key: 'displayName', size: 100 },
            { type: 'email', key: 'email' },
            { type: 'string', key: 'bio', size: 500 },
            { type: 'string', key: 'avatarFileId', size: 50 },
            { type: 'integer', key: 'age' },
            { type: 'string', key: 'gender', size: 20 },
            { type: 'string', key: 'globalState', size: 30 },
            { type: 'string', key: 'monetizationTier', size: 20 },
            { type: 'string', key: 'engagementLevel', size: 20 },
            { type: 'integer', key: 'storiesCompleted' },
            { type: 'boolean', key: 'isVerified' },
            { type: 'boolean', key: 'isOnline' },
            { type: 'datetime', key: 'lastActiveAt' },
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_email', type: 'unique', attributes: ['email'], orders: ['ASC'] },
            { key: 'idx_globalState', type: 'key', attributes: ['globalState'], orders: ['ASC'] },
            { key: 'idx_lastActive', type: 'key', attributes: ['lastActiveAt'], orders: ['DESC'] },
        ],
    },
    {
        id: 'rooms',
        name: 'Rooms',
        permissions: DEFAULT_PERMISSIONS,
        attributes: [
            { type: 'string', key: 'type', size: 10, required: true },
            { type: 'string', key: 'title', size: 200 },
            { type: 'string', key: 'genre', size: 50 },
            { type: 'string', key: 'worldCategory', size: 50 },
            { type: 'integer', key: 'intensity', min: 1, max: 5 },
            { type: 'string', key: 'status', size: 20, required: true },
            { type: 'string', key: 'participantIds', size: 36, array: true },
            { type: 'integer', key: 'maxParticipants' },
            { type: 'string', key: 'creatorId', size: 36 },
            { type: 'string', key: 'narrativeContext', size: 2000 },
            { type: 'integer', key: 'messageCount' },
            { type: 'datetime', key: 'lastMessageAt' },
            { type: 'datetime', key: 'startedAt' },
            { type: 'datetime', key: 'finishedAt' },
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_status', type: 'key', attributes: ['status'], orders: ['ASC'] },
            { key: 'idx_creator', type: 'key', attributes: ['creatorId'], orders: ['ASC'] },
        ],
    },
    {
        id: 'messages',
        name: 'Messages',
        permissions: DEFAULT_PERMISSIONS,
        attributes: [
            { type: 'string', key: 'roomId', size: 36, required: true },
            { type: 'string', key: 'senderId', size: 36, required: true },
            { type: 'string', key: 'characterId', size: 36 },
            { type: 'string', key: 'content', size: 5000, required: true },
            { type: 'string', key: 'messageType', size: 20 },
            { type: 'boolean', key: 'isNarratorAI' },
            { type: 'string', key: 'mediaFileId', size: 50 },
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_roomId', type: 'key', attributes: ['roomId'], orders: ['ASC'] },
            { key: 'idx_room_time', type: 'key', attributes: ['roomId', 'createdAt'], orders: ['ASC', 'ASC'] },
        ],
    },
    {
        id: 'reports',
        name: 'Reports',
        permissions: SERVER_ONLY_PERMISSIONS,
        attributes: [
            { type: 'string', key: 'reporterId', size: 36, required: true },
            { type: 'string', key: 'reportedId', size: 36, required: true },
            { type: 'string', key: 'roomId', size: 36 },
            { type: 'string', key: 'reason', size: 50 },
            { type: 'string', key: 'description', size: 1000 },
            { type: 'string', key: 'status', size: 20 },
            { type: 'string', key: 'adminNotes', size: 1000 },
            { type: 'datetime', key: 'resolvedAt' },
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_reported', type: 'key', attributes: ['reportedId'], orders: ['ASC'] },
            { key: 'idx_status', type: 'key', attributes: ['status'], orders: ['ASC'] },
        ],
    },
    {
        id: 'onboarding_progress',
        name: 'Onboarding Progress',
        permissions: DEFAULT_PERMISSIONS,
        attributes: [
            { type: 'string', key: 'userId', size: 36, required: true },
            { type: 'string', key: 'currentFlow', size: 20 },
            { type: 'string', key: 'currentStep', size: 50 },
            { type: 'string', key: 'userData', size: 5000 },
            { type: 'boolean', key: 'narrativeTestDone' },
            { type: 'boolean', key: 'characterCreated' },
            { type: 'boolean', key: 'limitsConfigured' },
            { type: 'boolean', key: 'demoStoryDone' },
            { type: 'datetime', key: 'completedAt' },
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_userId', type: 'unique', attributes: ['userId'], orders: ['ASC'] },
        ],
    },
];
```

### 3.2 Fase 2 — Identidad Narrativa

```javascript
// scripts/setup-phase2.js
export const PHASE2_COLLECTIONS = [
    // characters (actualizado), narrative_profiles, limits_config,
    // matches, typing_status
    // ... (schemas completos del 01_database_schema.md)
];
```

### 3.3 Fase 3 — Retención y Monetización

```javascript
// scripts/setup-phase3.js
export const PHASE3_COLLECTIONS = [
    // reputation_scores, story_feedback, notifications,
    // subscriptions, analytics_events
    // ... (schemas completos del 01_database_schema.md)
];
```

---

## 4. Script de Migración

### 4.1 Migrar Schema Existente

```javascript
// scripts/migrate-v2.js
// Objetivo: Migrar colecciones existentes al schema nuevo sin perder datos

async function migrate() {
    console.log('🔄 Migrating to v2 schema...\n');

    // 1. Agregar nuevos atributos a 'users'
    const newUserAttrs = [
        { type: 'string', key: 'bio', size: 500 },
        { type: 'string', key: 'avatarFileId', size: 50 },
        { type: 'integer', key: 'age' },
        { type: 'string', key: 'gender', size: 20 },
        { type: 'string', key: 'globalState', size: 30 },
        { type: 'string', key: 'monetizationTier', size: 20 },
        { type: 'string', key: 'engagementLevel', size: 20 },
        { type: 'integer', key: 'storiesCompleted' },
        { type: 'boolean', key: 'isVerified' },
        { type: 'boolean', key: 'isOnline' },
        { type: 'datetime', key: 'lastActiveAt' },
    ];

    for (const attr of newUserAttrs) {
        await safeCreateAttribute(databases, 'users', attr);
    }
    await waitForAttributes(databases, 'users');

    // 2. Actualizar documentos existentes con defaults
    const existingUsers = await databases.listDocuments(DB_ID, 'users');
    for (const user of existingUsers.documents) {
        await databases.updateDocument(DB_ID, 'users', user.$id, {
            globalState: 'REGISTERED',
            monetizationTier: 'FREE',
            engagementLevel: 'NEW',
            storiesCompleted: 0,
            isVerified: false,
            isOnline: false,
        });
    }

    // 3. Agregar nuevos atributos a 'characters'
    const newCharAttrs = [
        { type: 'string', key: 'personality', size: 200 },
        { type: 'string', key: 'narrativeStyle', size: 50 },
        { type: 'string', key: 'desiredPlots', size: 200 },
        { type: 'string', key: 'limits', size: 500 },
        { type: 'string', key: 'narrativeGender', size: 50 },
        { type: 'boolean', key: 'isActive' },
    ];

    for (const attr of newCharAttrs) {
        await safeCreateAttribute(databases, 'characters', attr);
    }

    console.log('\n✅ Migration complete!');
}
```

---

## 5. Seed de Datos Demo

```javascript
// scripts/seed-demo.js (actualizado)

const DEMO_DATA = {
    users: [
        {
            displayName: 'Luna Noir',
            email: 'luna@demo.sexteo.com',
            bio: 'Tejedora de historias oscuras y misteriosas',
            globalState: 'EXPLORING',
            monetizationTier: 'PREMIUM',
            engagementLevel: 'INVOLVED',
        },
        {
            displayName: 'Dante Fuego',
            email: 'dante@demo.sexteo.com',
            bio: 'Narrativas intensas y estratégicas',
            globalState: 'ACTIVE_INITIAL',
            monetizationTier: 'FREE',
            engagementLevel: 'EXPLORER',
        },
    ],
    characters: [
        {
            name: 'Morgana',
            description: 'Una hechicera antigua que guarda secretos de otro mundo',
            personality: 'Misteriosa, calculadora, seductora',
            narrativeStyle: 'descriptivo',
            traits: ['misteriosa', 'inteligente', 'oscura'],
        },
        {
            name: 'Viktor',
            description: 'Un estratega que nunca revela sus verdaderas intenciones',
            personality: 'Dominante, observador, paciente',
            narrativeStyle: 'directo',
            traits: ['estratégico', 'intenso', 'protector'],
        },
    ],
};
```

---

## 6. Actualización de `src/lib/appwrite.js`

```javascript
// Constants actualizadas para el schema completo
export const DB = {
    MAIN: 'sexteo_main',
};

export const COLLECTIONS = {
    // Fase 1
    USERS: 'users',
    ROOMS: 'rooms',
    MESSAGES: 'messages',
    REPORTS: 'reports',
    ONBOARDING_PROGRESS: 'onboarding_progress',
    
    // Fase 2
    CHARACTERS: 'characters',
    NARRATIVE_PROFILES: 'narrative_profiles',
    LIMITS_CONFIG: 'limits_config',
    MATCHES: 'matches',
    TYPING_STATUS: 'typing_status',
    
    // Fase 3
    REPUTATION_SCORES: 'reputation_scores',
    STORY_FEEDBACK: 'story_feedback',
    NOTIFICATIONS: 'notifications',
    SUBSCRIPTIONS: 'subscriptions',
    ANALYTICS_EVENTS: 'analytics_events',
};

export const BUCKETS = {
    AVATARS: 'avatars',
    MEDIA: 'avatars',
    // Futuro self-hosted:
    // CHARACTER_ASSETS: 'character_assets',
    // CHAT_MEDIA: 'chat_media',
    // STORY_EXPORTS: 'story_exports',
    // AUDIO: 'audio',
};
```

---

## 7. Comandos npm Actualizados

```json
{
    "scripts": {
        "dev": "vite dev",
        "build": "vite build",
        "preview": "vite preview",
        "setup": "node scripts/setup-appwrite.js",
        "setup:phase1": "node scripts/setup-phase1.js",
        "setup:phase2": "node scripts/setup-phase2.js",
        "setup:phase3": "node scripts/setup-phase3.js",
        "migrate": "node scripts/migrate-v2.js",
        "seed": "node scripts/seed-demo.js",
        "cleanup": "node scripts/cleanup.js"
    }
}
```

---

## Notas de Implementación

> [!CAUTION]
> **Antes de ejecutar `setup-phase1.js`**, hacer backup de los datos existentes. Las colecciones existentes (`users`, `characters`) serán actualizadas, no recreadas.

> [!WARNING]
> **Límite de Cloud Free Plan**: Máximo de colecciones puede ser un problema. Verificar cuántas colecciones permite el plan actual antes de ejecutar setup.

> [!TIP]
> Ejecutar las fases en orden: `setup:phase1` → `migrate` → `setup:phase2` → `setup:phase3`. Cada fase es independiente y puede ejecutarse por separado.
