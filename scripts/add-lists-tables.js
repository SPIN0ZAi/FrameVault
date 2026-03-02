/**
 * Migration: add lists and list_movies tables
 * Run: node scripts/add-lists-tables.js
 */
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS lists (
                id          TEXT        PRIMARY KEY,
                user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title       VARCHAR(200) NOT NULL,
                description TEXT,
                is_public   BOOLEAN     NOT NULL DEFAULT true,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS list_movies (
                id         TEXT        PRIMARY KEY,
                list_id    TEXT        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
                tmdb_id    INTEGER     NOT NULL,
                title      TEXT        NOT NULL,
                year       INTEGER,
                poster_url TEXT,
                position   INTEGER     NOT NULL DEFAULT 0,
                note       TEXT,
                added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(list_id, tmdb_id)
            );
        `);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_list_movies_list_id ON list_movies(list_id);`);

        await client.query('COMMIT');
        console.log('✅ lists and list_movies tables created successfully');
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
