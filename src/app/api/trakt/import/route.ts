import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncTMDBMovie } from '@/lib/sync-movie';
import { successResponse, errorResponse, serverError } from '@/lib/api-response';

const TRAKT_BASE = 'https://api.trakt.tv';

// Trakt requires a Client-ID header even for public endpoints.
// Add TRAKT_CLIENT_ID to your .env — register a free app at trakt.tv/oauth/applications
async function traktFetch<T>(path: string): Promise<T> {
    const clientId = process.env.TRAKT_CLIENT_ID;
    if (!clientId) throw new Error('TRAKT_CLIENT_ID env variable is not set');

    const res = await fetch(`${TRAKT_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': clientId,
        },
        // Do NOT cache — we always want fresh history
        cache: 'no-store',
    });

    if (res.status === 404) throw new Error('TRAKT_NOT_FOUND');
    if (res.status === 420) throw new Error('TRAKT_LIMIT');
    if (!res.ok) throw new Error(`Trakt API error: ${res.status}`);
    return res.json() as Promise<T>;
}

interface TraktHistoryItem {
    watched_at: string;
    type: 'movie' | 'episode';
    movie?: {
        title: string;
        year: number | null;
        ids: { trakt: number; tmdb: number | null; imdb: string | null };
    };
    show?: {
        title: string;
        year: number | null;
        ids: { trakt: number; tmdb: number | null; imdb: string | null };
    };
}

// POST /api/trakt/import
// Body: { traktUsername: string }
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return errorResponse({ code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        }

        const body = await req.json().catch(() => ({}));
        const traktUsername = (body.traktUsername as string | undefined)?.trim();
        if (!traktUsername) {
            return errorResponse({ code: 'BAD_REQUEST', message: 'traktUsername is required' }, 400);
        }

        const userId = session.user.id;

        // ── Fetch ALL watched history (paginated, limit 1000 per page) ─────────
        const PER_PAGE = 1000;
        let page = 1;
        const allHistory: TraktHistoryItem[] = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
            let items: TraktHistoryItem[];
            try {
                items = await traktFetch<TraktHistoryItem[]>(
                    `/users/${encodeURIComponent(traktUsername)}/history?limit=${PER_PAGE}&page=${page}&extended=full`
                );
            } catch (err) {
                if ((err as Error).message === 'TRAKT_NOT_FOUND') {
                    return errorResponse({ code: 'NOT_FOUND', message: `Trakt user "${traktUsername}" not found or history is private` }, 404);
                }
                throw err;
            }

            if (items.length === 0) break;
            allHistory.push(...items);
            if (items.length < PER_PAGE) break;
            page++;
            // Safety cap — 50 000 entries should be more than enough
            if (allHistory.length >= 50_000) break;
        }

        // ── Split into movies and shows ─────────────────────────────────────────
        const movies = allHistory.filter(h => h.type === 'movie' && h.movie?.ids.tmdb);
        const shows  = allHistory.filter(h => h.type === 'episode' && h.show?.ids.tmdb);

        // De-duplicate: keep only the MOST RECENT watch per tmdb ID
        const movieMap  = new Map<number, TraktHistoryItem>();
        const showMap   = new Map<number, TraktHistoryItem>();

        for (const item of movies) {
            const tmdbId = item.movie!.ids.tmdb!;
            const existing = movieMap.get(tmdbId);
            if (!existing || new Date(item.watched_at) > new Date(existing.watched_at)) {
                movieMap.set(tmdbId, item);
            }
        }
        for (const item of shows) {
            const tmdbId = item.show!.ids.tmdb!;
            const existing = showMap.get(tmdbId);
            if (!existing || new Date(item.watched_at) > new Date(existing.watched_at)) {
                showMap.set(tmdbId, item);
            }
        }

        let importedMovies = 0;
        let importedShows  = 0;
        let skippedMovies  = 0;
        let skippedShows   = 0;

        // ── Import movies ────────────────────────────────────────────────────────
        for (const [tmdbId, item] of movieMap) {
            try {
                // syncTMDBMovie ensures the movie row exists in our DB, returns local UUID
                const movieId = await syncTMDBMovie(tmdbId);
                if (!movieId) { skippedMovies++; continue; }

                const watchedAt = new Date(item.watched_at);
                await prisma.watchedMovie.upsert({
                    where: { userId_movieId: { userId, movieId } },
                    create: { userId, movieId, watchedAt },
                    update: { watchedAt },
                });
                // Remove from watchlist if present
                await prisma.watchlistItem.deleteMany({ where: { userId, movieId } });
                importedMovies++;
            } catch {
                skippedMovies++;
            }
        }

        // ── Import shows ─────────────────────────────────────────────────────────
        for (const [tmdbId, item] of showMap) {
            try {
                const showData = item.show!;
                const watchedAt = new Date(item.watched_at);

                await prisma.watchedShow.upsert({
                    where: { userId_tmdbShowId: { userId, tmdbShowId: tmdbId } },
                    create: {
                        userId,
                        tmdbShowId: tmdbId,
                        title: showData.title,
                        year: showData.year ?? undefined,
                        watchedAt,
                    },
                    update: { watchedAt },
                });
                importedShows++;
            } catch {
                skippedShows++;
            }
        }

        // ── Persist username + sync timestamp ────────────────────────────────
        const traktLastSync = new Date();
        await prisma.userProfile.upsert({
            where: { userId },
            update: { traktUsername, traktLastSync },
            create: {
                userId,
                traktUsername,
                traktLastSync,
                themeColor: '#00D1C1',
                themeMode: 'dark',
                bannerPosition: '50% 50%',
                avatarPosition: '50% 50%',
                backdropBrightness: 60,
            },
        });

        return successResponse({
            importedMovies,
            importedShows,
            skippedMovies,
            skippedShows,
            totalProcessed: allHistory.length,
            traktLastSync: traktLastSync.toISOString(),
        });
    } catch (error) {
        console.error('[trakt/import] error:', error);
        if ((error as Error).message === 'TRAKT_CLIENT_ID env variable is not set') {
            return errorResponse({ code: 'CONFIG_ERROR', message: 'Trakt integration is not configured on this server.' }, 503);
        }
        return serverError();
    }
}

// GET /api/trakt/import — auto-sync using saved traktUsername
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return errorResponse({ code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        }

        const userId = session.user.id;
        const profile = await prisma.userProfile.findUnique({
            where: { userId },
            select: { traktUsername: true, traktLastSync: true },
        });

        if (!profile?.traktUsername) {
            return errorResponse({ code: 'NOT_CONFIGURED', message: 'No Trakt username saved. Import manually first.' }, 400);
        }

        // Re-use POST logic by constructing a synthetic request body
        const syntheticReq = new Request('http://localhost/api/trakt/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ traktUsername: profile.traktUsername }),
        });
        return POST(syntheticReq as NextRequest);
    } catch (error) {
        console.error('[trakt/import GET] error:', error);
        return serverError();
    }
}
