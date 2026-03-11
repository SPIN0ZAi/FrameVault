/**
 * Migration: add is_featured, is_official to lists table
 * Run: node scripts/migrate-lists-v3.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
    await client.connect();

    const sql = `
        ALTER TABLE lists
            ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT FALSE;
    `;

    await client.query(sql);
    console.log('✅  Migration applied: is_featured, is_official added to lists table');
    await client.end();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
