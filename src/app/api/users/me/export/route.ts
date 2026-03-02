import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { zipSync, strToU8 } from 'fflate';
import { unauthorizedError, serverError } from '@/lib/api-response';

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function esc(val: string | number | null | undefined): string {
    if (val == null) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function csv(headers: string[], rows: (string | number | null | undefined)[][]): string {
    return [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
}

function fmtDate(d: Date | string): string {
    return new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD
}

// Convert FrameVault 1–10 rating → Letterboxd 0.5–5.0 (half-star) rating
function toLbRating(value: number): string {
    const lb = Math.round(value) / 2;
    return lb % 1 === 0 ? lb.toFixed(0) : lb.toFixed(1);
}

// ─── CSV generators ───────────────────────────────────────────────────────────

type WatchedRow = {
    watchedAt: Date;
    movie: { title: string; year: number; tmdbId: number | null };
};

type RatingRow = {
    createdAt: Date;
    value: number;
    movie: { title: string; year: number; tmdbId: number | null };
};

type ReviewRow = {
    createdAt: Date;
    content: string;
    containsSpoilers: boolean;
    movieId: string;
    movie: { title: string; year: number; tmdbId: number | null };
};

type WatchlistRow = {
    addedAt: Date;
    movie: { title: string; year: number; tmdbId: number | null };
};

/**
 * diary.csv — Letterboxd export format
 * Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags, Watched Date
 */
function makeDiary(watched: WatchedRow[], ratingMap: Map<string, number>): string {
    // Letterboxd diary uses one row per watch session (we have one per movie)
    const rows = watched.map(w => {
        const ratingVal = ratingMap.get(w.movie.tmdbId?.toString() ?? '');
        return [
            fmtDate(w.watchedAt),          // Date
            w.movie.title,                 // Name
            w.movie.year,                  // Year
            '',                            // Letterboxd URI (not available)
            ratingVal ? toLbRating(ratingVal) : '', // Rating (0.5–5.0)
            '',                            // Rewatch
            '',                            // Tags
            fmtDate(w.watchedAt),          // Watched Date
        ];
    });
    return csv(['Date', 'Name', 'Year', 'Letterboxd URI', 'Rating', 'Rewatch', 'Tags', 'Watched Date'], rows);
}

/**
 * ratings.csv — Letterboxd export format
 * Date, Name, Year, Letterboxd URI, Rating
 */
function makeRatings(ratings: RatingRow[]): string {
    const rows = ratings.map(r => [
        fmtDate(r.createdAt),
        r.movie.title,
        r.movie.year,
        '',
        toLbRating(r.value),
    ]);
    return csv(['Date', 'Name', 'Year', 'Letterboxd URI', 'Rating'], rows);
}

/**
 * reviews.csv — Letterboxd export format
 * Date, Name, Year, Letterboxd URI, Rating, Rewatch, Spoiler, Review, Watched Date, Tags
 */
function makeReviews(reviews: ReviewRow[], ratingMap: Map<string, number>): string {
    const rows = reviews.map(rv => {
        const ratingVal = ratingMap.get(rv.movieId);
        return [
            fmtDate(rv.createdAt),
            rv.movie.title,
            rv.movie.year,
            '',
            ratingVal ? toLbRating(ratingVal) : '',
            '',                               // Rewatch
            rv.containsSpoilers ? 'Yes' : '', // Spoiler
            rv.content,
            fmtDate(rv.createdAt),            // Watched Date (approximate)
            '',                               // Tags
        ];
    });
    return csv(['Date', 'Name', 'Year', 'Letterboxd URI', 'Rating', 'Rewatch', 'Spoiler', 'Review', 'Watched Date', 'Tags'], rows);
}

/**
 * watchlist.csv — Letterboxd export format
 * Date, Name, Year, Letterboxd URI
 */
function makeWatchlist(items: WatchlistRow[]): string {
    const rows = items.map(w => [
        fmtDate(w.addedAt),
        w.movie.title,
        w.movie.year,
        '',
    ]);
    return csv(['Date', 'Name', 'Year', 'Letterboxd URI'], rows);
}

/**
 * watched.csv — Letterboxd export format
 * Date, Name, Year, Letterboxd URI
 */
function makeWatched(watched: WatchedRow[]): string {
    const rows = watched.map(w => [
        fmtDate(w.watchedAt),
        w.movie.title,
        w.movie.year,
        '',
    ]);
    return csv(['Date', 'Name', 'Year', 'Letterboxd URI'], rows);
}

/**
 * letterboxd-import.csv — Letterboxd IMPORT format
 * Uses tmdbID for reliable matching when uploading at letterboxd.com/import/
 */
function makeImportFile(
    watched: WatchedRow[],
    ratingMap: Map<string, number>,
    reviewMap: Map<string, { content: string; containsSpoilers: boolean }>,
): string {
    const rows = watched.map(w => {
        const key = w.movie.tmdbId?.toString() ?? w.movie.title;
        const ratingVal = ratingMap.get(key);
        const review = reviewMap.get(key);
        return [
            w.movie.tmdbId ?? '',
            w.movie.title,
            w.movie.year,
            fmtDate(w.watchedAt),
            ratingVal ?? '',
            review?.content ?? '',
            '',                               // Rewatch
            review?.containsSpoilers ? 'Spoiler' : '',
        ];
    });
    return csv(['tmdbID', 'Title', 'Year', 'WatchedDate', 'Rating10', 'Review', 'Rewatch', 'Tags'], rows);
}

// ─── README ───────────────────────────────────────────────────────────────────

function makeReadme(username: string, exportDate: string): string {
    return [
        'FRAMEVAULT EXPORT',
        '==================',
        `Username  : ${username}`,
        `Exported  : ${exportDate}`,
        '',
        'HOW TO IMPORT INTO LETTERBOXD',
        '------------------------------',
        '1. Go to  https://letterboxd.com/import/',
        '2. Upload the file:  letterboxd-import.csv',
        '   This file contains your full watch history, ratings, and reviews.',
        '   It uses tmdbID for accurate film matching.',
        '',
        'FILES INCLUDED',
        '--------------',
        'letterboxd-import.csv  — Upload THIS to Letterboxd (most complete)',
        'diary.csv              — Letterboxd diary format (history + ratings)',
        'ratings.csv            — All film ratings',
        'reviews.csv            — All written reviews',
        'watched.csv            — All films marked as watched',
        'watchlist.csv          — Films saved to your watchlist',
        '',
        'RATING SCALE',
        '------------',
        'In FrameVault ratings are stored 1–10.',
        'Letterboxd-format files (diary / ratings / reviews) use the',
        'standard Letterboxd scale: 0.5 (½★) – 5.0 (★★★★★).',
        'letterboxd-import.csv keeps the 1–10 scale (Rating10 column).',
    ].join('\r\n');
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const userId = session.user.id;

        // Fetch user info + all data in parallel
        const [user, watched, ratings, reviews, watchlist] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { username: true } }),
            prisma.watchedMovie.findMany({
                where: { userId },
                orderBy: { watchedAt: 'desc' },
                include: { movie: { select: { title: true, year: true, tmdbId: true } } },
            }),
            prisma.rating.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: { movie: { select: { title: true, year: true, tmdbId: true } } },
            }),
            prisma.review.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: { movie: { select: { title: true, year: true, tmdbId: true } } },
            }),
            prisma.watchlistItem.findMany({
                where: { userId },
                orderBy: { addedAt: 'desc' },
                include: { movie: { select: { title: true, year: true, tmdbId: true } } },
            }),
        ]);

        if (!user) return unauthorizedError();

        // Build lookup maps keyed by tmdbId (or movieId for reviews)
        const ratingByTmdb = new Map<string, number>(
            ratings.map(r => [r.movie.tmdbId?.toString() ?? r.movieId, r.value])
        );
        const ratingByMovieId = new Map<string, number>(
            ratings.map(r => [r.movieId, r.value])
        );
        const reviewByTmdb = new Map<string, { content: string; containsSpoilers: boolean }>(
            reviews.map(rv => [rv.movie.tmdbId?.toString() ?? rv.movieId, { content: rv.content, containsSpoilers: rv.containsSpoilers }])
        );

        const exportDate = new Date().toISOString().slice(0, 10);
        const slug = `framevault-${user.username}-${exportDate}`;

        const files: Record<string, Uint8Array> = {
            'README.txt':             strToU8(makeReadme(user.username, exportDate)),
            'letterboxd-import.csv':  strToU8(makeImportFile(watched, ratingByTmdb, reviewByTmdb)),
            'diary.csv':              strToU8(makeDiary(watched, ratingByTmdb)),
            'ratings.csv':            strToU8(makeRatings(ratings)),
            'reviews.csv':            strToU8(makeReviews(reviews, ratingByMovieId)),
            'watched.csv':            strToU8(makeWatched(watched)),
            'watchlist.csv':          strToU8(makeWatchlist(watchlist)),
        };

        const zipped = zipSync(files, { level: 6 });

        return new Response(Buffer.from(zipped), {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${slug}.zip"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('GET /api/users/me/export error:', error);
        return serverError();
    }
}
