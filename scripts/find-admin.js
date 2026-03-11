require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("UPDATE users SET role = 'admin' WHERE username = 'SB_1' RETURNING id, username, role")
  .then(r => { console.log('Updated:', r.rows); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
