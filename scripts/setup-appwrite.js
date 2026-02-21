/**
 * Appwrite Setup Script — Phase 1  (self-hosted)
 * Creates database, collections, attributes, indexes, and buckets.
 * Run: node scripts/setup-appwrite.js
 */

import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
import { config } from 'dotenv';

config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = 'sexteo_main';

// ── Permissions ──
const PUBLIC_PERMS = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
];

const SERVER_PERMS = [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
];

// ── Collection Schemas ──
const collections = [
    // ─── USERS ───
    {
        id: 'users',
        name: 'Users',
        permissions: PUBLIC_PERMS,
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
            // Legacy fields kept for backwards compat
            { type: 'string', key: 'completedFlows', size: 500, array: true },
        ],
        indexes: [
            { key: 'idx_email', type: 'unique', attributes: ['email'], orders: ['ASC'] },
            { key: 'idx_globalState', type: 'key', attributes: ['globalState'], orders: ['ASC'] },
            { key: 'idx_lastActive', type: 'key', attributes: ['lastActiveAt'], orders: ['DESC'] },
        ],
    },

    // ─── CHARACTERS ───
    {
        id: 'characters',
        name: 'Characters',
        permissions: PUBLIC_PERMS,
        attributes: [
            { type: 'string', key: 'userId', size: 36, required: true },
            { type: 'string', key: 'name', size: 100, required: true },
            { type: 'string', key: 'description', size: 1000 },
            { type: 'string', key: 'avatar', size: 50 },
            { type: 'string', key: 'personality', size: 200 },
            { type: 'string', key: 'narrativeStyle', size: 50 },
            { type: 'string', key: 'desiredPlots', size: 200 },
            { type: 'string', key: 'limits', size: 500 },
            { type: 'string', key: 'narrativeGender', size: 50 },
            { type: 'string', key: 'traits', size: 100, array: true },
            { type: 'boolean', key: 'isActive' },
            { type: 'string', key: 'visibility', size: 20 },  // public | private
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_userId', type: 'key', attributes: ['userId'], orders: ['ASC'] },
            { key: 'idx_visibility', type: 'key', attributes: ['visibility'], orders: ['ASC'] },
        ],
    },

    // ─── ONBOARDING PROGRESS ───
    {
        id: 'onboarding_progress',
        name: 'Onboarding Progress',
        permissions: PUBLIC_PERMS,
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

    // ─── ROOMS ───
    {
        id: 'rooms',
        name: 'Rooms',
        permissions: PUBLIC_PERMS,
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

    // ─── MESSAGES ───
    {
        id: 'messages',
        name: 'Messages',
        permissions: PUBLIC_PERMS,
        attributes: [
            { type: 'string', key: 'roomId', size: 36, required: true },
            { type: 'string', key: 'senderId', size: 36, required: true },
            { type: 'string', key: 'characterId', size: 36 },
            { type: 'string', key: 'content', size: 5000, required: true },
            { type: 'string', key: 'messageType', size: 20 },
            { type: 'boolean', key: 'isNarratorAI' },
            { type: 'string', key: 'mediaFileId', size: 50 },
            { type: 'string', key: 'replyToId', size: 36 },
            { type: 'string', key: 'reactions', size: 2000 },     // JSON: { "❤️": ["userId1"], "🔥": ["userId2"] }
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_roomId', type: 'key', attributes: ['roomId'], orders: ['ASC'] },
            { key: 'idx_room_time', type: 'key', attributes: ['roomId', 'createdAt'], orders: ['ASC', 'ASC'] },
        ],
    },

    // ─── REPORTS ───
    {
        id: 'reports',
        name: 'Reports',
        permissions: SERVER_PERMS,
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

    // ─── PUBLISHED STORIES ───
    {
        id: 'stories',
        name: 'Published Stories',
        permissions: PUBLIC_PERMS,
        attributes: [
            { type: 'string', key: 'roomId', size: 36, required: true },
            { type: 'string', key: 'title', size: 200, required: true },
            { type: 'string', key: 'genre', size: 50 },
            { type: 'integer', key: 'intensity', min: 1, max: 5 },
            { type: 'string', key: 'content', size: 50000 },
            { type: 'string', key: 'summary', size: 500 },
            { type: 'string', key: 'authorIds', size: 36, array: true },
            { type: 'string', key: 'publisherId', size: 36, required: true },
            { type: 'string', key: 'visibility', size: 20 },    // public | members | private
            { type: 'boolean', key: 'isPaid' },
            { type: 'string', key: 'price', size: 50 },
            { type: 'string', key: 'paymentLink', size: 500 },
            { type: 'string', key: 'accessUserIds', size: 36, array: true },
            { type: 'integer', key: 'readCount' },
            { type: 'integer', key: 'likeCount' },
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_visibility', type: 'key', attributes: ['visibility'], orders: ['ASC'] },
            { key: 'idx_genre', type: 'key', attributes: ['genre'], orders: ['ASC'] },
            { key: 'idx_publisher', type: 'key', attributes: ['publisherId'], orders: ['ASC'] },
        ],
    },

    // ─── NARRATIVE PROFILES (Phase 2) ───
    {
        id: 'narrative_profiles',
        name: 'Narrative Profiles',
        permissions: PUBLIC_PERMS,
        attributes: [
            { type: 'string', key: 'userId', size: 36, required: true },
            { type: 'string', key: 'writingStyle', size: 30 },
            { type: 'string', key: 'emotionalPace', size: 20 },
            { type: 'string', key: 'roleType', size: 20 },
            { type: 'integer', key: 'improvisationLevel' },
            { type: 'string', key: 'plotPreferences', size: 50, array: true },
            { type: 'integer', key: 'narrativeInitiative' },
            { type: 'integer', key: 'preferredIntensity' },
            { type: 'string', key: 'preferredGenres', size: 50, array: true },
            { type: 'datetime', key: 'createdAt' },
            { type: 'datetime', key: 'updatedAt' },
        ],
        indexes: [
            { key: 'idx_userId', type: 'unique', attributes: ['userId'], orders: ['ASC'] },
        ],
    },

    // ─── LIMITS CONFIG (Phase 2) ───
    {
        id: 'limits_config',
        name: 'Limits Config',
        permissions: PUBLIC_PERMS,
        attributes: [
            { type: 'string', key: 'userId', size: 36, required: true },
            { type: 'string', key: 'allowedThemes', size: 50, array: true },
            { type: 'string', key: 'forbiddenThemes', size: 50, array: true },
            { type: 'integer', key: 'intensityMax' },
            { type: 'string', key: 'safeWord', size: 50 },
            { type: 'boolean', key: 'autoExitEnabled' },
            { type: 'datetime', key: 'createdAt' },
            { type: 'datetime', key: 'updatedAt' },
        ],
        indexes: [
            { key: 'idx_userId', type: 'unique', attributes: ['userId'], orders: ['ASC'] },
        ],
    },

    // ─── MATCHES (Phase 2) ───
    {
        id: 'matches',
        name: 'Matches',
        permissions: PUBLIC_PERMS,
        attributes: [
            { type: 'string', key: 'userIdA', size: 36, required: true },
            { type: 'string', key: 'userIdB', size: 36, required: true },
            { type: 'string', key: 'characterIdA', size: 36 },
            { type: 'string', key: 'characterIdB', size: 36 },
            { type: 'integer', key: 'compatibilityScore' },
            { type: 'string', key: 'matchType', size: 20 },
            { type: 'string', key: 'matchLabel', size: 30 },
            { type: 'string', key: 'status', size: 20, required: true },
            { type: 'string', key: 'roomId', size: 36 },
            { type: 'boolean', key: 'limitsAgreed' },
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_userA', type: 'key', attributes: ['userIdA'], orders: ['ASC'] },
            { key: 'idx_userB', type: 'key', attributes: ['userIdB'], orders: ['ASC'] },
            { key: 'idx_status', type: 'key', attributes: ['status'], orders: ['ASC'] },
        ],
    },

    // ─── NOTIFICATIONS (Phase 4) ───
    {
        id: 'notifications',
        name: 'Notifications',
        permissions: PUBLIC_PERMS,
        attributes: [
            { type: 'string', key: 'userId', size: 36, required: true },
            { type: 'string', key: 'type', size: 30, required: true },
            { type: 'string', key: 'title', size: 200, required: true },
            { type: 'string', key: 'body', size: 500 },
            { type: 'string', key: 'referenceId', size: 36 },
            { type: 'boolean', key: 'read' },
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_userId', type: 'key', attributes: ['userId'], orders: ['ASC'] },
            { key: 'idx_userId_read', type: 'key', attributes: ['userId', 'read'], orders: ['ASC', 'ASC'] },
        ],
    },

    // ─── RATINGS (Phase 5) ───
    {
        id: 'ratings',
        name: 'Ratings',
        permissions: PUBLIC_PERMS,
        attributes: [
            { type: 'string', key: 'raterId', size: 36, required: true },
            { type: 'string', key: 'ratedId', size: 36, required: true },
            { type: 'string', key: 'roomId', size: 36, required: true },
            { type: 'integer', key: 'score', required: true },
            { type: 'string', key: 'tags', size: 500 },
            { type: 'string', key: 'comment', size: 300 },
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_ratedId', type: 'key', attributes: ['ratedId'], orders: ['ASC'] },
            { key: 'idx_roomId', type: 'key', attributes: ['roomId'], orders: ['ASC'] },
        ],
    },

    // ─── PURCHASE REQUESTS ───
    {
        id: 'purchase_requests',
        name: 'Purchase Requests',
        permissions: PUBLIC_PERMS,
        attributes: [
            { type: 'string', key: 'storyId', size: 36, required: true },
            { type: 'string', key: 'buyerId', size: 36, required: true },
            { type: 'string', key: 'publisherId', size: 36, required: true },
            { type: 'string', key: 'receiptFileId', size: 50 },
            { type: 'string', key: 'message', size: 500 },
            { type: 'string', key: 'status', size: 20, required: true },  // pending | approved | rejected
            { type: 'datetime', key: 'createdAt' },
        ],
        indexes: [
            { key: 'idx_publisherId', type: 'key', attributes: ['publisherId'], orders: ['ASC'] },
            { key: 'idx_storyId', type: 'key', attributes: ['storyId'], orders: ['ASC'] },
            { key: 'idx_status', type: 'key', attributes: ['status'], orders: ['ASC'] },
        ],
    },
];

// ── Buckets (self-hosted — no limit on buckets) ──
const buckets = [
    {
        id: 'avatars',
        name: 'User Avatars',
        maxFileSize: 10 * 1024 * 1024, // 10 MB
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    },
    {
        id: 'character_assets',
        name: 'Character Assets',
        maxFileSize: 20 * 1024 * 1024, // 20 MB
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    },
    {
        id: 'chat_media',
        name: 'Chat Media',
        maxFileSize: 30_000_000, // 30 MB (matches _APP_STORAGE_LIMIT default)
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mp3', 'ogg'],
    },
];

// ── Helpers ──
async function createAttribute(collId, attr) {
    try {
        switch (attr.type) {
            case 'string':
                await databases.createStringAttribute(
                    DB_ID, collId, attr.key, attr.size,
                    attr.required ?? false, undefined, attr.array ?? false
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
                await databases.createBooleanAttribute(DB_ID, collId, attr.key, attr.required ?? false);
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

async function waitForAttributes(collId) {
    let ready = false;
    while (!ready) {
        await new Promise(r => setTimeout(r, 1500));
        const coll = await databases.getCollection(DB_ID, collId);
        const attrs = coll.attributes || [];
        ready = attrs.length === 0 || attrs.every(a => a.status === 'available');
    }
}

// ── Main ──
async function setup() {
    console.log('🚀 Setting up Appwrite for Sexteo (Phase 1)...\n');

    // 1. Create Database (or reuse existing)
    try {
        await databases.create(DB_ID, 'Sexteo Main');
        console.log('✅ Database "sexteo_main" created');
    } catch (e) {
        if (e.code === 409 || e.code === 403) {
            console.log('⏭️  Database "sexteo_main" already exists — reusing');
        } else throw e;
    }

    // 2. Create Collections + Attributes + Indexes
    for (const coll of collections) {
        let isNew = false;
        try {
            await databases.createCollection(
                DB_ID, coll.id, coll.name,
                coll.permissions,
                true // documentSecurity
            );
            console.log(`✅ Collection "${coll.id}" created`);
            isNew = true;
        } catch (e) {
            if (e.code === 409) {
                console.log(`⏭️  Collection "${coll.id}" already exists — adding missing attributes`);
            } else if (e.code === 403) {
                console.log(`⚠️  Collection "${coll.id}" skipped (plan limit)`);
                continue;
            } else throw e;
        }

        // Attributes (always try to add — idempotent)
        for (const attr of coll.attributes) {
            await createAttribute(coll.id, attr);
        }

        console.log(`   ⏳ Waiting for attributes...`);
        await waitForAttributes(coll.id);

        // Indexes
        for (const idx of (coll.indexes || [])) {
            try {
                await databases.createIndex(DB_ID, coll.id, idx.key, idx.type, idx.attributes, idx.orders);
                console.log(`   🔍 Index "${idx.key}" created`);
            } catch (e) {
                if (e.code === 409) console.log(`   ⏭️  Index "${idx.key}" exists`);
                else console.error(`   ❌ Error on index "${idx.key}":`, e.message);
            }
        }
    }

    // 3. Create Bucket(s)
    for (const bucket of buckets) {
        try {
            await storage.createBucket(
                bucket.id, bucket.name,
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users()),
                ],
                false, true, bucket.maxFileSize, bucket.allowedExtensions
            );
            console.log(`✅ Bucket "${bucket.id}" created`);
        } catch (e) {
            if (e.code === 409) console.log(`⏭️  Bucket "${bucket.id}" already exists`);
            else if (e.code === 403) console.log(`⚠️  Bucket "${bucket.id}" skipped (plan limit)`);
            else throw e;
        }
    }

    console.log('\n🎉 Phase 1 setup complete!');
    console.log('\nCollections created/verified:');
    collections.forEach(c => console.log(`  ✓ ${c.id}`));
}

setup().catch(e => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
});
