/**
 * Migration Script: v1 → Phase 1
 * Adds new attributes to existing collections and sets defaults on existing documents.
 * Run: node scripts/migrate-v1-to-phase1.js
 *
 * Safe to run multiple times (idempotent).
 */

import { Client, Databases, Query } from 'node-appwrite';
import { config } from 'dotenv';

config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = 'sexteo_main';

async function migrate() {
    console.log('🔄 Migrating existing data to Phase 1 schema...\n');

    // ── 1. Update existing user documents with new field defaults ──
    console.log('📋 Updating users collection...');
    try {
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const result = await databases.listDocuments(DB_ID, 'users', [
                Query.limit(limit),
                Query.offset(offset),
            ]);

            for (const user of result.documents) {
                const updates = {};

                if (!user.globalState) updates.globalState = 'REGISTERED';
                if (!user.monetizationTier) updates.monetizationTier = 'FREE';
                if (!user.engagementLevel) updates.engagementLevel = 'NEW';
                if (user.storiesCompleted === undefined || user.storiesCompleted === null) updates.storiesCompleted = 0;
                if (user.isVerified === undefined || user.isVerified === null) updates.isVerified = false;
                if (user.isOnline === undefined || user.isOnline === null) updates.isOnline = false;

                if (Object.keys(updates).length > 0) {
                    await databases.updateDocument(DB_ID, 'users', user.$id, updates);
                    console.log(`   ✅ User "${user.displayName || user.$id}" updated with defaults`);
                } else {
                    console.log(`   ⏭️  User "${user.displayName || user.$id}" already has all fields`);
                }
            }

            hasMore = result.documents.length === limit;
            offset += limit;
        }
    } catch (e) {
        if (e.code === 404) {
            console.log('   ⚠️  Users collection not found — run setup first');
        } else {
            console.error('   ❌ Error updating users:', e.message);
        }
    }

    // ── 2. Update existing onboarding_progress documents ──
    console.log('\n📋 Updating onboarding_progress collection...');
    try {
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const result = await databases.listDocuments(DB_ID, 'onboarding_progress', [
                Query.limit(limit),
                Query.offset(offset),
            ]);

            for (const doc of result.documents) {
                const updates = {};

                if (doc.narrativeTestDone === undefined || doc.narrativeTestDone === null) updates.narrativeTestDone = false;
                if (doc.characterCreated === undefined || doc.characterCreated === null) updates.characterCreated = false;
                if (doc.limitsConfigured === undefined || doc.limitsConfigured === null) updates.limitsConfigured = false;
                if (doc.demoStoryDone === undefined || doc.demoStoryDone === null) updates.demoStoryDone = false;

                if (Object.keys(updates).length > 0) {
                    await databases.updateDocument(DB_ID, 'onboarding_progress', doc.$id, updates);
                    console.log(`   ✅ Progress "${doc.$id}" updated with defaults`);
                } else {
                    console.log(`   ⏭️  Progress "${doc.$id}" already has all fields`);
                }
            }

            hasMore = result.documents.length === limit;
            offset += limit;
        }
    } catch (e) {
        if (e.code === 404) {
            console.log('   ⚠️  onboarding_progress collection not found — run setup first');
        } else {
            console.error('   ❌ Error updating onboarding_progress:', e.message);
        }
    }

    // ── 3. Update existing characters with new fields ──
    console.log('\n📋 Updating characters collection...');
    try {
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const result = await databases.listDocuments(DB_ID, 'characters', [
                Query.limit(limit),
                Query.offset(offset),
            ]);

            for (const char of result.documents) {
                const updates = {};

                if (char.isActive === undefined || char.isActive === null) updates.isActive = false;
                if (!char.narrativeStyle) updates.narrativeStyle = 'directo';
                if (!char.personality) updates.personality = '';

                if (Object.keys(updates).length > 0) {
                    await databases.updateDocument(DB_ID, 'characters', char.$id, updates);
                    console.log(`   ✅ Character "${char.name || char.$id}" updated with defaults`);
                } else {
                    console.log(`   ⏭️  Character "${char.name || char.$id}" already has all fields`);
                }
            }

            hasMore = result.documents.length === limit;
            offset += limit;
        }
    } catch (e) {
        if (e.code === 404) {
            console.log('   ⚠️  characters collection not found — run setup first');
        } else {
            console.error('   ❌ Error updating characters:', e.message);
        }
    }

    console.log('\n🎉 Migration complete!');
    console.log('\nNext steps:');
    console.log('  1. Verify data in Appwrite Console');
    console.log('  2. Run: npm run dev');
}

migrate().catch(e => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
});
