// Quick diagnostic: test the users API and prisma directly
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
    try {
        // 1. Check what users exist
        const users = await prisma.user.findMany({
            select: { id: true, username: true, email: true },
        });
        console.log('Users in DB:', users);

        if (users.length === 0) {
            console.log('\nNO USERS FOUND — that is why profile shows "not found".');
            return;
        }

        const testUsername = users[0].username;
        console.log('\nTesting full profile query for:', testUsername);

        // 2. Test the exact query the API runs
        const user = await prisma.user.findUnique({
            where: { username: testUsername },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                createdAt: true,
                profile: true,
                _count: {
                    select: {
                        watchedMovies: true,
                        watchlist: true,
                        reviews: true,
                        ratings: true,
                    },
                },
            },
        });
        console.log('User profile result:', JSON.stringify(user, null, 2));

        // 3. Test follows count
        const [followersCount, followingCount] = await Promise.all([
            prisma.follows.count({ where: { followingId: user.id } }),
            prisma.follows.count({ where: { followerId: user.id } }),
        ]);
        console.log('Followers:', followersCount, 'Following:', followingCount);

        console.log('\nAll queries succeeded! API should work.');
    } catch (e) {
        console.error('\nPrisma Error:', e.message);
        console.error('Code:', e.code);
        console.error('Meta:', e.meta);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
run();
