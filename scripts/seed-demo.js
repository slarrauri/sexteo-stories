/**
 * Appwrite Seed Script
 * Creates demo data for testing.
 * Run: node scripts/seed-demo.js
 */

import { Client, Databases, Users, ID } from 'node-appwrite';
import { config } from 'dotenv';

config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const DB_ID = 'sexteo_main';

async function seed() {
    console.log('🌱 Seeding demo data...\n');

    // 1. Create demo users
    const demoUsers = [
        { email: 'explore@demo.sexteo.com', password: 'Demo1234!', name: 'Luna Explorer' },
        { email: 'create@demo.sexteo.com', password: 'Demo1234!', name: 'Raven Creator' },
        { email: 'chat@demo.sexteo.com', password: 'Demo1234!', name: 'Aris Chatter' },
    ];

    const createdUsers = [];

    for (const u of demoUsers) {
        try {
            const user = await users.create(ID.unique(), u.email, undefined, u.password, u.name);
            createdUsers.push(user);
            console.log(`✅ User "${u.name}" created (${user.$id})`);
        } catch (e) {
            if (e.code === 409) {
                console.log(`⏭️  User "${u.name}" already exists`);
                // Try to find existing user
                const list = await users.list();
                const existing = list.users.find(x => x.email === u.email);
                if (existing) createdUsers.push(existing);
            } else {
                console.error(`❌ Error creating user "${u.name}":`, e.message);
            }
        }
    }

    // 2. Create user profiles
    for (let i = 0; i < createdUsers.length; i++) {
        const user = createdUsers[i];
        const flows = [['explore'], ['create'], ['chat']];
        try {
            await databases.createDocument(DB_ID, 'users', user.$id, {
                displayName: demoUsers[i].name,
                email: demoUsers[i].email,
                completedFlows: flows[i],
                createdAt: new Date().toISOString(),
            });
            console.log(`   📋 Profile for "${demoUsers[i].name}" created`);
        } catch (e) {
            if (e.code === 409) console.log(`   ⏭️  Profile for "${demoUsers[i].name}" already exists`);
            else console.error(`   ❌ Error:`, e.message);
        }
    }

    // 3. Create demo characters (for the "create" flow user)
    const characters = [
        { name: 'Valentina Storm', description: 'Misteriosa y apasionada', avatar: '🌹', traits: ['Misterioso/a', 'Apasionado/a', 'Rebelde'] },
        { name: 'Elías Frost', description: 'Calculador y protector', avatar: '🐺', traits: ['Frío/a', 'Protector/a', 'Intelectual'] },
        { name: 'Luna Noir', description: 'Enigmática y seductora', avatar: '🦇', traits: ['Enigmático/a', 'Seductor/a', 'Dominante'] },
    ];

    const creatorUser = createdUsers[1];
    for (const char of characters) {
        try {
            await databases.createDocument(DB_ID, 'characters', ID.unique(), {
                userId: creatorUser?.$id || 'demo',
                name: char.name,
                description: char.description,
                avatar: char.avatar,
                traits: char.traits,
                createdAt: new Date().toISOString(),
            });
            console.log(`   🎭 Character "${char.name}" created`);
        } catch (e) {
            console.error(`   ❌ Error creating character:`, e.message);
        }
    }

    // 4. Create demo stories
    const stories = [
        { title: 'La última noche en el faro', genre: 'Suspenso', intensity: 4, content: 'El viento aúlla contra los vidrios rotos del faro abandonado...' },
        { title: 'Encuentro en la biblioteca', genre: 'Romántico', intensity: 2, content: 'Los dedos rozaron el mismo libro al mismo tiempo...' },
        { title: 'Sombras en la mansión', genre: 'Fantasía', intensity: 5, content: 'El espejo no reflejaba a nadie, pero los pasos se oían cada vez más cerca...' },
        { title: 'Cartas sin remitente', genre: 'Misterio', intensity: 3, content: 'Cada mañana, una carta nueva bajo la puerta. Sin sello, sin nombre...' },
        { title: 'El jardín prohibido', genre: 'Fantasía', intensity: 4, content: 'Las flores del jardín brillaban con luz propia después de medianoche...' },
    ];

    for (const story of stories) {
        try {
            await databases.createDocument(DB_ID, 'stories', ID.unique(), {
                ...story,
                authorId: createdUsers[0]?.$id || 'demo',
                createdAt: new Date().toISOString(),
            });
            console.log(`   📕 Story "${story.title}" created`);
        } catch (e) {
            console.error(`   ❌ Error creating story:`, e.message);
        }
    }

    console.log('\n🎉 Seed complete!');
}

seed().catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
});
