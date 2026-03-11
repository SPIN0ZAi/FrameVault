require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Delete lists owned by SB_1 that have 0 items (created by failed import run)
pool.query(`
  DELETE FROM lists
  WHERE user_id = 'cmm7v87a60000s4gfsut3af81'
  AND id NOT IN (SELECT DISTINCT list_id FROM list_movies)
  RETURNING title
`)
  .then(r => { console.log('Deleted', r.rowCount, 'empty lists:', r.rows.map(r=>r.title)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
