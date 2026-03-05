require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const n = await prisma.reviewLike.count();
        console.log("review_likes TABLE EXISTS, count:", n);
    } catch (e) {
        console.error("review_likes TABLE MISSING:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
