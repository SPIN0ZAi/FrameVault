/**
 * Applies missing DB columns that are in the Prisma schema but not in the DB.
 * Uses pg directly (works with Supabase connection pooler).
 * Run with: node scripts/fix-schema.js
 */
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        console.log('Connected to DB. Applying missing columns...\n');

        const fixes = [
            {
                desc: 'Add location to user_profiles',
                sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS "location" TEXT;`,
            },
        ];

        for (const fix of fixes) {
            try {
                await client.query(fix.sql);
                console.log(`✓ ${fix.desc}`);
            } catch (err) {
                console.error(`✗ ${fix.desc}:`, err.message);
            }
        }

        // Verify
        const res = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'user_profiles'
            ORDER BY ordinal_position;
        `);
        console.log('\nuser_profiles columns:', res.rows.map(r => r.column_name).join(', '));

        // Also check users table while we're here
        const usersRes = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);
        console.log('users columns:', usersRes.rows.map(r => r.column_name).join(', '));

        console.log('\nDone!');
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
