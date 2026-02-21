/**
 * Seed Notifications — Creates sample notifications for testing
 * 
 * Usage: node scripts/seed-notifications.js <userId>
 * 
 * The userId is your Appwrite user ID (check your profile or Appwrite console).
 */

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import { config } from 'dotenv';

config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = 'sexteo_main';
const COLL_ID = 'notifications';

const userId = process.argv[2];

if (!userId) {
    console.error('❌ Uso: node scripts/seed-notifications.js <userId>');
    console.error('   Encontrá tu userId en /profile o en la consola de Appwrite.');
    process.exit(1);
}

const now = new Date();
function hoursAgo(h) {
    return new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
}

const SAMPLE_NOTIFICATIONS = [
    {
        type: 'match_request',
        title: '⚡ Nueva solicitud de match',
        body: 'Luna_Writer quiere escribir una historia con vos (87% compatible)',
        referenceId: 'match_demo_001',
        read: false,
        createdAt: hoursAgo(0.1), // ahora
    },
    {
        type: 'match_accepted',
        title: '🎉 ¡Match aceptado!',
        body: 'DarkNarrator aceptó tu solicitud. ¡A escribir!',
        referenceId: 'match_demo_002',
        read: false,
        createdAt: hoursAgo(1), // 1h ago
    },
    {
        type: 'new_message',
        title: '💬 Nuevo mensaje',
        body: 'Tenés un mensaje nuevo en "El castillo de las sombras"',
        referenceId: 'room_demo_001',
        read: false,
        createdAt: hoursAgo(3), // 3h ago
    },
    {
        type: 'match_request',
        title: '⚡ Nueva solicitud de match',
        body: 'MysticPen quiere explorar una trama de misterio (72% compatible)',
        referenceId: 'match_demo_003',
        read: true,
        createdAt: hoursAgo(26), // ayer
    },
    {
        type: 'match_accepted',
        title: '🎉 ¡Match aceptado!',
        body: 'Celeste_Noir aceptó tu solicitud',
        referenceId: 'match_demo_004',
        read: true,
        createdAt: hoursAgo(50), // anteriores
    },
    {
        type: 'room_invite',
        title: '🏠 Invitación a sala',
        body: 'Te invitaron a "Bajo la luna roja" — sala grupal de fantasía',
        referenceId: 'room_demo_002',
        read: true,
        createdAt: hoursAgo(72), // anteriores
    },
];

async function seed() {
    console.log(`🌱 Seeding ${SAMPLE_NOTIFICATIONS.length} notifications for user ${userId}...\n`);

    for (const notif of SAMPLE_NOTIFICATIONS) {
        try {
            await databases.createDocument(
                DB_ID, COLL_ID, ID.unique(),
                { userId, ...notif },
                [
                    Permission.read(Role.user(userId)),
                    Permission.update(Role.user(userId)),
                    Permission.delete(Role.user(userId)),
                ]
            );
            console.log(`  ✅ ${notif.title} (${notif.read ? 'leída' : '🔴 no leída'})`);
        } catch (e) {
            console.error(`  ❌ Error: ${e.message}`);
        }
    }

    console.log('\n🎉 Seed completado. Recargá /notifications para verlas.');
}

seed().catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
});
