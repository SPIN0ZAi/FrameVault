require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        const r1 = await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' ORDER BY ordinal_position"
        );
        console.log('user_profiles:', r1.rows.map(x => x.column_name).join(', '));

        const r2 = await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position"
        );
        console.log('users:', r2.rows.map(x => x.column_name).join(', '));

        // Try a real query to simulate what Prisma does
        const r3 = await client.query('SELECT * FROM users LIMIT 1');
        console.log('\nSample user row keys:', Object.keys(r3.rows[0] || {}));
        console.log('Total users:', r3.rowCount);
    } finally {
        client.release();
        await pool.end();
    }
}
run().catch(e => { console.error(e.message); process.exit(1); });
