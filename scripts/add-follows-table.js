// Applies the missing `follows` table to the DB
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        console.log('Connected. Creating missing tables...\n');

        await client.query(`
            CREATE TABLE IF NOT EXISTS "follows" (
                "followerId"  TEXT NOT NULL,
                "followingId" TEXT NOT NULL,
                "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "follows_pkey" PRIMARY KEY ("followerId", "followingId")
            );
        `);
        console.log('✓ follows table created');

        await client.query(`CREATE INDEX IF NOT EXISTS "follows_followerId_idx"  ON "follows"("followerId");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "follows_followingId_idx" ON "follows"("followingId");`);
        console.log('✓ follows indexes created');

        await client.query(`
            ALTER TABLE "follows"
                ADD CONSTRAINT "follows_followerId_fkey"
                FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `).catch(e => {
            if (e.code === '42710') console.log('  (followerId FK already exists)');
            else throw e;
        });

        await client.query(`
            ALTER TABLE "follows"
                ADD CONSTRAINT "follows_followingId_fkey"
                FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `).catch(e => {
            if (e.code === '42710') console.log('  (followingId FK already exists)');
            else throw e;
        });
        console.log('✓ follows foreign keys created');

        // Verify
        const res = await client.query(`SELECT COUNT(*) FROM follows`);
        console.log(`\n✓ follows table verified — ${res.rows[0].count} rows`);
        console.log('\nDone! Profile API should now work.');
    } catch (e) {
        console.error('Error:', e.message, e.code);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
