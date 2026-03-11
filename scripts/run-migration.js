require('dotenv').config();
const { Pool } = require('pg');

async function check() {
    const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
    const client = await pool.connect();
    try {
        const tables = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('show_reviews','show_review_likes') ORDER BY table_name"
        );
        console.log('Tables:', tables.rows.map(r => r.table_name));
        const cols = await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name='list_movies' AND column_name='media_type'"
        );
        console.log('list_movies.media_type:', cols.rows.length > 0 ? 'EXISTS' : 'MISSING');
    } finally {
        client.release();
        await pool.end();
    }
}

check();
