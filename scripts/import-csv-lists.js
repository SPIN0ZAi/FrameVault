/**
 * import-csv-lists.js
 * Imports all CSV files in ./csv-imports/ as Official lists.
 * Usage: node scripts/import-csv-lists.js --username <username>
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// ── Prisma ────────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Config ────────────────────────────────────────────────────────────────────
const CSV_DIR = path.resolve(__dirname, '../csv-imports');
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

if (!TMDB_API_KEY) { console.error('❌  TMDB_API_KEY not set'); process.exit(1); }

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const usernameIdx = args.indexOf('--username');
const TARGET_USERNAME = usernameIdx !== -1 ? args[usernameIdx + 1] : null;
if (!TARGET_USERNAME) {
    console.error('Usage: node scripts/import-csv-lists.js --username <username>');
    process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function filenameToTitle(filename) {
    return path.basename(filename, path.extname(filename)).trim();
}

/** Try to pull a year out of a Letterboxd URI like /film/movie-title-2013/ */
function yearFromUri(uri) {
    if (!uri) return undefined;
    const m = uri.match(/[/-](\d{4})(?:-\d+)?\/?\s*$/);
    return m ? parseInt(m[1], 10) : undefined;
}

async function searchTMDB(title, year) {
    const yearParam = year ? `&year=${year}` : '';
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}${yearParam}&language=en-US&page=1&include_adult=false`;
    try {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${TMDB_API_KEY}`,
                accept: 'application/json',
            },
        });
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const m = data.results[0];
            return {
                tmdbId: m.id,
                title: m.title,
                year: m.release_date ? parseInt(m.release_date.split('-')[0], 10) : null,
                posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
            };
        }
    } catch (e) { console.error('TMDB error:', e.message); }
    return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const user = await prisma.user.findFirst({ where: { username: TARGET_USERNAME } });
    if (!user) { console.error(`❌  User "${TARGET_USERNAME}" not found.`); process.exit(1); }
    console.log(`✅  User: @${user.username} (${user.id})\n`);

    const csvFiles = fs.readdirSync(CSV_DIR).filter((f) => f.toLowerCase().endsWith('.csv'));
    console.log(`📂  ${csvFiles.length} CSV file(s) found\n`);

    for (const csvFile of csvFiles) {
        const listTitle = filenameToTitle(csvFile);
        console.log(`\n──────────────────────────────────────────────────`);
        console.log(`📋  "${listTitle}"`);

        const raw = fs.readFileSync(path.join(CSV_DIR, csvFile), 'utf8');
        let rows;
        try {
            rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true, bom: true });
        } catch (e) {
            console.error(`  ⚠️  Parse error: ${e.message}`); continue;
        }
        if (!rows.length) { console.log('  ⚠️  Empty CSV'); continue; }

        const firstRow = rows[0];
        const keys = Object.keys(firstRow);
        const titleKey = keys.find((k) => /^(name|title)$/i.test(k));
        const yearKey  = keys.find((k) => /^year$/i.test(k));
        const uriKey   = keys.find((k) => /uri|url|letterboxd/i.test(k));
        const rankKey  = keys.find((k) => /^(rank|#|position|pos)$/i.test(k));

        if (!titleKey) {
            console.error(`  ❌  No Title/Name column. Columns: ${keys.join(', ')}`); continue;
        }

        // Skip already-imported (idempotent re-run)
        let list = await prisma.list.findFirst({ where: { userId: user.id, title: listTitle } });
        if (list) {
            console.log(`  ℹ️   Already exists (id: ${list.id}) — adding missing items`);
        } else {
            list = await prisma.list.create({
                data: { userId: user.id, title: listTitle, isPublic: true, isOfficial: true },
            });
            console.log(`  ✅  Created list (id: ${list.id})`);
        }

        // Get existing tmdbIds
        const existing = await prisma.listMovie.findMany({ where: { listId: list.id }, select: { tmdbId: true } });
        const existingIds = new Set(existing.map((i) => i.tmdbId));
        let position = existing.length;
        let added = 0, notFound = 0, skipped = 0;

        for (const row of rows) {
            const title = (row[titleKey] || '').trim();
            if (!title) { skipped++; continue; }

            // Year: explicit column, or fallback to URI extraction
            let year = yearKey ? (parseInt(row[yearKey], 10) || undefined) : undefined;
            if (!year && uriKey) year = yearFromUri(row[uriKey]);

            // Position: use rank column if present, otherwise sequential
            const pos = rankKey ? (parseInt(row[rankKey], 10) - 1) : position;

            await sleep(260); // ~4 req/s TMDB limit

            let result = await searchTMDB(title, year);
            if (!result && year) result = await searchTMDB(title); // retry without year

            if (!result) {
                console.log(`  ❌  Not found: "${title}" (${year || '?'})`);
                notFound++; continue;
            }

            if (existingIds.has(result.tmdbId)) { skipped++; continue; }

            try {
                await prisma.listMovie.create({
                    data: {
                        listId: list.id, tmdbId: result.tmdbId, mediaType: 'movie',
                        title: result.title, year: result.year ?? null,
                        posterUrl: result.posterUrl ?? null, position: pos,
                    },
                });
                existingIds.add(result.tmdbId);
                added++;
                if (added % 10 === 0) console.log(`  ... ${added} added so far`);
            } catch (e) {
                if (e.code === 'P2002') { skipped++; }
                else console.error(`  ⚠️  DB error for "${title}": ${e.message}`);
            }

            position++;
        }

        console.log(`  📊  ${added} added, ${notFound} not found, ${skipped} skipped`);
    }

    console.log('\n🎉  All done!');
    await prisma.$disconnect();
    pool.end();
}

main().catch((e) => {
    console.error(e);
    prisma.$disconnect().finally(() => pool.end());
    process.exit(1);
});