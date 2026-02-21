/**
 * Appwrite Cleanup Script
 * Deletes all documents from all collections and empties buckets.
 * Use --hard flag to also delete and recreate collections and buckets.
 * Run: node scripts/cleanup.js [--hard]
 */

import { Client, Databases, Storage, Query } from 'node-appwrite';
import { config } from 'dotenv';

config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = 'sexteo_main';
const COLLECTIONS = ['users', 'characters', 'onboarding_progress', 'stories'];
const BUCKETS = ['avatars', 'media'];

const isHard = process.argv.includes('--hard');

async function deleteAllDocuments(collectionId) {
    let hasMore = true;
    let total = 0;
    while (hasMore) {
        const docs = await databases.listDocuments(DB_ID, collectionId, [Query.limit(100)]);
        if (docs.documents.length === 0) {
            hasMore = false;
            break;
        }
        for (const doc of docs.documents) {
            await databases.deleteDocument(DB_ID, collectionId, doc.$id);
            total++;
        }
    }
    return total;
}

async function deleteAllFiles(bucketId) {
    let hasMore = true;
    let total = 0;
    while (hasMore) {
        const files = await storage.listFiles(bucketId, [Query.limit(100)]);
        if (files.files.length === 0) {
            hasMore = false;
            break;
        }
        for (const file of files.files) {
            await storage.deleteFile(bucketId, file.$id);
            total++;
        }
    }
    return total;
}

async function cleanup() {
    console.log(`\n🧹 Cleaning up Appwrite${isHard ? ' (HARD MODE — will delete collections & buckets)' : ''}...\n`);

    // 1. Clean collections
    for (const collId of COLLECTIONS) {
        try {
            if (isHard) {
                await databases.deleteCollection(DB_ID, collId);
                console.log(`🗑️  Collection "${collId}" deleted`);
            } else {
                const count = await deleteAllDocuments(collId);
                console.log(`🧹 Collection "${collId}": ${count} documents deleted`);
            }
        } catch (e) {
            if (e.code === 404) console.log(`⏭️  Collection "${collId}" not found`);
            else console.error(`❌ Error on "${collId}":`, e.message);
        }
    }

    // 2. Clean buckets
    for (const bucketId of BUCKETS) {
        try {
            if (isHard) {
                await storage.deleteBucket(bucketId);
                console.log(`🗑️  Bucket "${bucketId}" deleted`);
            } else {
                const count = await deleteAllFiles(bucketId);
                console.log(`🧹 Bucket "${bucketId}": ${count} files deleted`);
            }
        } catch (e) {
            if (e.code === 404) console.log(`⏭️  Bucket "${bucketId}" not found`);
            else console.error(`❌ Error on "${bucketId}":`, e.message);
        }
    }

    // 3. If hard mode, also delete the database
    if (isHard) {
        try {
            await databases.delete(DB_ID);
            console.log(`🗑️  Database "${DB_ID}" deleted`);
        } catch (e) {
            if (e.code === 404) console.log(`⏭️  Database "${DB_ID}" not found`);
            else console.error(`❌ Error:`, e.message);
        }
        console.log('\n✅ Hard cleanup complete. Run "npm run setup" to recreate everything.');
    } else {
        console.log('\n✅ Cleanup complete. All data wiped, structure preserved.');
    }
}

cleanup().catch(e => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
});
