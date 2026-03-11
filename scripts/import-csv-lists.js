/**
 * import-csv-lists.js
 *
 * Imports Letterboxd-style CSV files as Lists owned by a specific user.
 *
 * Usage:
 *   node scripts/import-csv-lists.js --username <your-username>
 *
 * Place CSV files in: ./csv-imports/
 * Each CSV must have at least a "Title" column. "Year" is optional but helps.
 * Letterboxd export CSVs also work (they have Title, Year, Letterboxd URI, etc.)
 *
 * The list name is derived from the CSV filename (underscores/hyphens → spaces).
 *
 * Requires:
 *   npm install csv-parse node-fetch dotenv  (if not already installed)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// ── Config ────────────────────────────────────────────────────────────────────
const CSV_DIR = path.resolve(__dirname, '../csv-imports');
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!TMDB_API_KEY) {
    console.error('❌  TMDB_API_KEY not found in .env');
    process.exit(1);
}

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const usernameIdx = args.indexOf('--username');
const TARGET_USERNAME = usernameIdx !== -1 ? args[usernameIdx + 1] : null;
if (!TARGET_USERNAME) {
    console.error('Usage: node scripts/import-csv-lists.js --username <your-username>');
    process.exit(1);
}

// ── Prisma ────────────────────────────────────────────────────────────────────
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── TMDB helper ───────────────────────────────────────────────────────────────
async function searchTMDB(title, year) {
    const yearParam = year ? `&year=${year}` : '';
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${yearParam}&language=en-US&page=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
        const m = data.results[0];
        return {
            tmdbId: m.id,
            title: m.title,
            year: m.release_date ? parseInt(m.release_date.split('-')[0], 10) : null,
            posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
            mediaType: 'movie',
        };
    }
    return null;
}

// ── CSV filename → list title ─────────────────────────────────────────────────
function filenameToTitle(filename) {
    return path.basename(filename, path.extname(filename))
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ── Sleep helper ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    // Find the user
    const user = await prisma.user.findFirst({ where: { username: TARGET_USERNAME } });
    if (!user) {
        console.error(`❌  User "${TARGET_USERNAME}" not found in the database.`);
        process.exit(1);
    }
    console.log(`✅  Found user: @${user.username} (${user.id})\n`);

    // Ensure CSV directory exists
    if (!fs.existsSync(CSV_DIR)) {
        fs.mkdirSync(CSV_DIR, { recursive: true });
        console.error(`❌  Created ./csv-imports/ — please drop your CSV files there and re-run.`);
        process.exit(1);
    }

    const csvFiles = fs.readdirSync(CSV_DIR).filter((f) => f.toLowerCase().endsWith('.csv'));
    if (csvFiles.length === 0) {
        console.error('❌  No .csv files found in ./csv-imports/');
        process.exit(1);
    }

    console.log(`📂  Found ${csvFiles.length} CSV file(s):\n${csvFiles.map((f) => `  • ${f}`).join('\n')}\n`);

    for (const csvFile of csvFiles) {
        const listTitle = filenameToTitle(csvFile);
        console.log(`\n──────────────────────────────────────────`);
        console.log(`📋  Importing: "${listTitle}"`);
        console.log(`──────────────────────────────────────────`);

        const raw = fs.readFileSync(path.join(CSV_DIR, csvFile), 'utf8');
        let rows;
        try {
            rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true, bom: true });
        } catch (e) {
            console.error(`  ⚠️  Failed to parse ${csvFile}: ${e.message}`);
            continue;
        }

        if (rows.length === 0) {
            console.log('  ⚠️  Empty CSV, skipping.');
            continue;
        }

        // Detect title/year columns (Letterboxd uses "Name", others use "Title")
        const firstRow = rows[0];
        const titleKey = Object.keys(firstRow).find((k) => /^(name|title)$/i.test(k));
        const yearKey = Object.keys(firstRow).find((k) => /^year$/i.test(k));

        if (!titleKey) {
            console.error(`  ❌  No "Title" or "Name" column found. Columns: ${Object.keys(firstRow).join(', ')}`);
            continue;
        }

        // Check if list already exists for this user (avoid dupes on re-run)
        const existing = await prisma.list.findFirst({
            where: { userId: user.id, title: listTitle },
        });
        let list;
        if (existing) {
            console.log(`  ℹ️   List already exists (id: ${existing.id}), will add missing items only.`);
            list = existing;
        } else {
            list = await prisma.list.create({
                data: {
                    userId: user.id,
                    title: listTitle,
                    isPublic: true,
                },
            });
            console.log(`  ✅  Created list (id: ${list.id})`);
        }

        // Get existing items to avoid duplicate inserts
        const existingItems = await prisma.listMovie.findMany({
            where: { listId: list.id },
            select: { tmdbId: true },
        });
        const existingTmdbIds = new Set(existingItems.map((i) => i.tmdbId));

        let position = existingItems.length;
        let found = 0, notFound = 0, skipped = 0;

        for (const row of rows) {
            const title = (row[titleKey] || '').trim();
            const year = yearKey ? (parseInt(row[yearKey], 10) || undefined) : undefined;

            if (!title) { skipped++; continue; }

            // Rate-limit TMDB to ~4 req/s
            await sleep(260);

            const result = await searchTMDB(title, year);
            if (!result) {
                console.log(`  ❌  Not found on TMDB: "${title}" (${year || '?'})`);
                notFound++;
                continue;
            }

            if (existingTmdbIds.has(result.tmdbId)) {
                skipped++;
                continue;
            }

            try {
                await prisma.listMovie.create({
                    data: {
                        listId: list.id,
                        tmdbId: result.tmdbId,
                        mediaType: 'movie',
                        title: result.title,
                        year: result.year ?? null,
                        posterUrl: result.posterUrl ?? null,
                        position: position++,
                    },
                });
                existingTmdbIds.add(result.tmdbId);
                console.log(`  ✅  [${position}] ${result.title} (${result.year})`);
                found++;
            } catch (e) {
                if (e.code === 'P2002') {
                    // unique constraint — already in list
                    skipped++;
                } else {
                    console.error(`  ⚠️  DB error for "${title}": ${e.message}`);
                }
            }
        }

        console.log(`\n  📊  Summary for "${listTitle}": ${found} added, ${notFound} not found on TMDB, ${skipped} skipped`);
    }

    console.log('\n\n🎉  All CSV files processed!');
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
