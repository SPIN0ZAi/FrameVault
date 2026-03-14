/**
 * Backfill show metadata for ratings that never created watched_shows rows.
 * Run: node scripts/backfill-show-ratings.js
 */
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing');
if (!process.env.TMDB_API_KEY) throw new Error('TMDB_API_KEY missing');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const tmdbMetaCache = new Map();

function tmdbHeaders() {
    const key = process.env.TMDB_API_KEY;
    const headers = { accept: 'application/json' };
    const isV4Token = key.startsWith('eyJ') || key.split('.').length > 2;
    if (isV4Token) {
        headers.Authorization = `Bearer ${key}`;
    }
    return headers;
}

async function fetchShow(tmdbId) {
    const key = process.env.TMDB_API_KEY;
    const isV4Token = key.startsWith('eyJ') || key.split('.').length > 2;
    const url = isV4Token
        ? `https://api.themoviedb.org/3/tv/${tmdbId}`
        : `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${key}`;

    const res = await fetch(url, { headers: tmdbHeaders() });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
}

function toYear(dateStr) {
    return dateStr ? parseInt(dateStr.substring(0, 4)) : null;
}

async function getShowMeta(tmdbId) {
    if (tmdbMetaCache.has(tmdbId)) return tmdbMetaCache.get(tmdbId);
    try {
        const show = await fetchShow(tmdbId);
        const meta = {
            title: show.name || 'Unknown Show',
            year: toYear(show.first_air_date),
            posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w342${show.poster_path}` : null,
        };
        tmdbMetaCache.set(tmdbId, meta);
        return meta;
    } catch (err) {
        console.warn(`TMDB lookup failed for show ${tmdbId}:`, err.message);
        const fallback = { title: 'Unknown Show', year: null, posterUrl: null };
        tmdbMetaCache.set(tmdbId, fallback);
        return fallback;
    }
}

async function run() {
    const client = await pool.connect();
    try {
        const { rows } = await client.query(`
            SELECT sr."userId"     AS "userId",
                   sr."tmdbShowId" AS "tmdbShowId",
                   sr."createdAt"  AS "createdAt"
            FROM "show_ratings" sr
            LEFT JOIN "watched_shows" ws
                ON ws."userId" = sr."userId" AND ws."tmdbShowId" = sr."tmdbShowId"
            WHERE ws.id IS NULL OR ws.title = 'Unknown Show';
        `);

        if (rows.length === 0) {
            console.log('No show ratings require backfill.');
            return;
        }

        console.log(`Backfilling ${rows.length} show rating records...`);
        for (const row of rows) {
            const meta = await getShowMeta(row.tmdbShowId);
            await client.query(
                `INSERT INTO "watched_shows"
                    (id, "userId", "tmdbShowId", title, year, "posterUrl", "watchedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT ("userId", "tmdbShowId") DO UPDATE
                    SET title = EXCLUDED.title,
                        year = EXCLUDED.year,
                        "posterUrl" = EXCLUDED."posterUrl",
                        "watchedAt" = LEAST("watched_shows"."watchedAt", EXCLUDED."watchedAt");`,
                [
                    randomUUID(),
                    row.userId,
                    row.tmdbShowId,
                    meta.title,
                    meta.year,
                    meta.posterUrl,
                    row.createdAt ?? new Date(),
                ],
            );
        }

        console.log('✅ Backfill complete.');
    } catch (err) {
        console.error('❌ Backfill failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
