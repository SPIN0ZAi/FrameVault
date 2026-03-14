/**
 * Set a user's role to 'owner' so the Owner badge shows again.
 * Usage: node scripts/set-owner-role.js <username>
 */
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL missing in .env');
    process.exit(1);
}

const username = process.argv[2];
if (!username) {
    console.error('Usage: node scripts/set-owner-role.js <username>');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        const res = await client.query(
            'UPDATE "users" SET "role" = $1 WHERE "username" = $2 RETURNING id, username, role',
            ['owner', username],
        );
        if (res.rowCount === 0) {
            console.error(`No user found with username '${username}'`);
            process.exit(1);
        }
        console.log('Updated user role:', res.rows[0]);
    } catch (err) {
        console.error('Failed to update role:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
