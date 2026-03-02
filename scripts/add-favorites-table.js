/**
 * Migration: add user_favorites table
 * Run: node scripts/add-favorites-table.js
 */
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS user_favorites (
                id         TEXT        PRIMARY KEY,
                user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tmdb_id    INTEGER     NOT NULL,
                title      TEXT        NOT NULL,
                year       INTEGER,
                poster_url TEXT,
                position   INTEGER     NOT NULL DEFAULT 0,
                added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(user_id, tmdb_id),
                UNIQUE(user_id, position)
            );
        `);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);`);

        await client.query('COMMIT');
        console.log('✅ user_favorites table created successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
