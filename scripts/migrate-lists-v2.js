// Migration: add banner_url, cloned_from_id to lists; group_label to list_movies; create list_likes table
require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
    await client.connect();

    try {
        await client.query(`
            ALTER TABLE "lists"
              ADD COLUMN IF NOT EXISTS "banner_url" TEXT,
              ADD COLUMN IF NOT EXISTS "cloned_from_id" TEXT
                REFERENCES "lists"("id") ON DELETE SET NULL;

            ALTER TABLE "list_movies"
              ADD COLUMN IF NOT EXISTS "group_label" VARCHAR(100);

            CREATE TABLE IF NOT EXISTS "list_likes" (
              "id"         TEXT         NOT NULL,
              "user_id"    TEXT         NOT NULL,
              "list_id"    TEXT         NOT NULL,
              "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "list_likes_pkey"              PRIMARY KEY ("id"),
              CONSTRAINT "list_likes_user_id_list_id_key" UNIQUE ("user_id", "list_id"),
              CONSTRAINT "list_likes_user_id_fkey"     FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
              CONSTRAINT "list_likes_list_id_fkey"     FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS "list_likes_list_id_idx" ON "list_likes"("list_id");
        `);
        console.log('✅ Migration applied successfully');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

main();
