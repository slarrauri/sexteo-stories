/**
 * Appwrite Client — Singleton instance (browser-only)
 */
import { Client, Account, Databases, Storage } from 'appwrite';
import { browser } from '$app/environment';
import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT_ID } from '$env/static/public';

let client;
let account;
let databases;
let storage;

if (browser && PUBLIC_APPWRITE_ENDPOINT && PUBLIC_APPWRITE_PROJECT_ID) {
    client = new Client();
    client
        .setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
        .setProject(PUBLIC_APPWRITE_PROJECT_ID);

    account = new Account(client);
    databases = new Databases(client);
    storage = new Storage(client);
}

export { client, account, databases, storage };

// Database & collection IDs (created by setup script)
export const DB = {
    MAIN: 'sexteo_main',
};

export const COLLECTIONS = {
    // Phase 1
    USERS: 'users',
    CHARACTERS: 'characters',
    ROOMS: 'rooms',
    MESSAGES: 'messages',
    REPORTS: 'reports',

    // Phase 2
    NARRATIVE_PROFILES: 'narrative_profiles',
    LIMITS_CONFIG: 'limits_config',
    MATCHES: 'matches',

    // Phase 4
    NOTIFICATIONS: 'notifications',

    // Phase 5
    RATINGS: 'ratings',

    // Published Stories
    STORIES: 'stories',

    // Purchase Requests
    PURCHASE_REQUESTS: 'purchase_requests',
};

export const BUCKETS = {
    AVATARS: 'avatars',
    CHARACTER_ASSETS: 'character_assets',
    CHAT_MEDIA: 'chat_media',
};
