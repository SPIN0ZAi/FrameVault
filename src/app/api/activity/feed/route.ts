import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';
import { getTMDBImageUrl, getShowDetails } from '@/lib/tmdb';

// GET /api/activity/feed — recent activity from users you follow
export async function GET(_req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const follows = await prisma.follows.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
        });
        const followingIds = follows.map(f => f.followingId);

        if (followingIds.length === 0) return successResponse([]);

        const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // last 90 days

        const [watched, ratings, reviews, watchedShows, showRatings] = await Promise.all([
            prisma.watchedMovie.findMany({
                where: { userId: { in: followingIds }, watchedAt: { gte: since } },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                    movie: { select: { id: true, tmdbId: true, title: true, year: true, posterUrl: true,
                        customPosters: { where: { userId: { in: followingIds } }, select: { userId: true, posterUrl: true } } } },
                },
                orderBy: { watchedAt: 'desc' },
                take: 40,
            }),
            prisma.rating.findMany({
                where: { userId: { in: followingIds }, createdAt: { gte: since } },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                    movie: { select: { id: true, tmdbId: true, title: true, year: true, posterUrl: true,
                        customPosters: { where: { userId: { in: followingIds } }, select: { userId: true, posterUrl: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                take: 40,
            }),
            prisma.review.findMany({
                where: { userId: { in: followingIds }, createdAt: { gte: since } },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                    movie: { select: { id: true, tmdbId: true, title: true, year: true, posterUrl: true,
                        customPosters: { where: { userId: { in: followingIds } }, select: { userId: true, posterUrl: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                take: 40,
            }),
            // ── TV show watched events ──────────────────────────────────────────
            prisma.watchedShow.findMany({
                where: { userId: { in: followingIds }, watchedAt: { gte: since } },
                select: {
                    id: true,
                    tmdbShowId: true,
                    title: true,
                    year: true,
                    posterUrl: true,
                    watchedAt: true,
                    user: { select: { id: true, username: true, avatarUrl: true } },
                },
                orderBy: { watchedAt: 'desc' },
                take: 40,
            }),
            // ── TV show rating events ───────────────────────────────────────────
            prisma.showRating.findMany({
                where: { userId: { in: followingIds }, createdAt: { gte: since } },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 40,
            }),
        ]);

        // For show ratings, look up show info (title/poster) from WatchedShow
        const showRatingPairs = showRatings.map(r => ({ userId: r.userId, tmdbShowId: r.tmdbShowId }));
        const showInfoRows = showRatingPairs.length > 0
            ? await prisma.watchedShow.findMany({
                where: { OR: showRatingPairs },
                select: { userId: true, tmdbShowId: true, title: true, year: true, posterUrl: true },
              })
            : [];
        const showInfoMap = new Map(showInfoRows.map(s => [`${s.userId}-${s.tmdbShowId}`, s]));

        // Backfill missing show metadata for historical ratings (pre-watched table)
        const missingShowRatings = showRatings.filter(r => !showInfoMap.has(`${r.userId}-${r.tmdbShowId}`));
        if (missingShowRatings.length > 0) {
            try {
                const uniqueTmdbIds = Array.from(new Set(missingShowRatings.map(r => r.tmdbShowId)));
                const tmdbMeta = new Map<number, { title: string; year: number | null; posterUrl: string | null }>();

                await Promise.all(uniqueTmdbIds.map(async tmdbId => {
                    try {
                        const show = await getShowDetails(tmdbId);
                        const title = show.name || 'Unknown Show';
                        const year = show.first_air_date ? parseInt(show.first_air_date.substring(0, 4)) : null;
                        const posterUrl = getTMDBImageUrl(show.poster_path, 'w342');
                        tmdbMeta.set(tmdbId, { title, year, posterUrl });
                    } catch (tmdbError) {
                        console.warn('Activity feed TMDB show lookup failed:', tmdbError);
                        tmdbMeta.set(tmdbId, { title: 'Unknown Show', year: null, posterUrl: null });
                    }
                }));

                await Promise.all(missingShowRatings.map(async r => {
                    const meta = tmdbMeta.get(r.tmdbShowId) ?? { title: 'Unknown Show', year: null, posterUrl: null };
                    const key = `${r.userId}-${r.tmdbShowId}`;
                    showInfoMap.set(key, { ...meta, userId: r.userId, tmdbShowId: r.tmdbShowId });

                    await prisma.watchedShow.upsert({
                        where: { userId_tmdbShowId: { userId: r.userId, tmdbShowId: r.tmdbShowId } },
                        create: {
                            userId: r.userId,
                            tmdbShowId: r.tmdbShowId,
                            title: meta.title,
                            year: meta.year,
                            posterUrl: meta.posterUrl,
                            watchedAt: r.createdAt ?? new Date(),
                            rewatchCount: 0,
                            lastRewatchedAt: null,
                        },
                        update: { title: meta.title, year: meta.year, posterUrl: meta.posterUrl },
                    });
                }));
            } catch (backfillError) {
                console.warn('Activity feed show metadata backfill failed:', backfillError);
            }
        }

        // Helper: resolve the event user's custom poster, or fall back to default
        const resolveposter = (movie: { posterUrl: string | null; customPosters: { userId: string; posterUrl: string }[] }, userId: string) =>
            movie.customPosters.find(cp => cp.userId === userId)?.posterUrl ?? movie.posterUrl;

        type ActivityEvent = {
            id: string;
            type: 'watched' | 'rated' | 'reviewed' | 'watched_show' | 'rated_show';
            contentType: 'movie' | 'show';
            date: string;
            user: { id: string; username: string; avatarUrl: string | null };
            movie?: { id: string; tmdbId: number | null; title: string; year: number; posterUrl: string | null };
            show?: { tmdbShowId: number; title: string; year: number | null; posterUrl: string | null };
            rating?: number;
            reviewContent?: string;
            containsSpoilers?: boolean;
        };

        const events: ActivityEvent[] = [
            ...watched.map(w => ({
                id: `watched-${w.id}`,
                type: 'watched' as const,
                contentType: 'movie' as const,
                date: w.watchedAt.toISOString(),
                user: w.user,
                movie: { ...w.movie, posterUrl: resolveposter(w.movie, w.user.id) },
            })),
            ...ratings.map(r => ({
                id: `rated-${r.id}`,
                type: 'rated' as const,
                contentType: 'movie' as const,
                date: r.createdAt.toISOString(),
                user: r.user,
                movie: { ...r.movie, posterUrl: resolveposter(r.movie, r.user.id) },
                rating: r.value,
            })),
            ...reviews.map(r => ({
                id: `reviewed-${r.id}`,
                type: 'reviewed' as const,
                contentType: 'movie' as const,
                date: r.createdAt.toISOString(),
                user: r.user,
                movie: { ...r.movie, posterUrl: resolveposter(r.movie, r.user.id) },
                reviewContent: r.content,
                containsSpoilers: r.containsSpoilers,
            })),
            ...watchedShows.map(w => ({
                id: `watched-show-${w.id}`,
                type: 'watched_show' as const,
                contentType: 'show' as const,
                date: w.watchedAt.toISOString(),
                user: w.user,
                show: { tmdbShowId: w.tmdbShowId, title: w.title, year: w.year, posterUrl: w.posterUrl },
            })),
            ...showRatings.map(r => {
                const info = showInfoMap.get(`${r.userId}-${r.tmdbShowId}`);
                return {
                    id: `rated-show-${r.id}`,
                    type: 'rated_show' as const,
                    contentType: 'show' as const,
                    date: r.createdAt.toISOString(),
                    user: r.user,
                    show: {
                        tmdbShowId: r.tmdbShowId,
                        title: info?.title ?? 'Unknown Show',
                        year: info?.year ?? null,
                        posterUrl: info?.posterUrl ?? null,
                    },
                    rating: r.value,
                };
            }),
        ];

        // Sort by date desc
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Deduplicate: collapse watched+rated same item+user within 1 hour into one entry
        const deduped: ActivityEvent[] = [];
        const seen = new Set<string>();
        for (const ev of events) {
            const hourBucket = Math.floor(new Date(ev.date).getTime() / (60 * 60 * 1000));
            const itemKey = ev.show ? `show-${ev.show.tmdbShowId}` : `movie-${ev.movie?.id}`;
            const key = `${ev.user.id}-${itemKey}-${hourBucket}`;
            if (ev.type === 'watched' || ev.type === 'rated' || ev.type === 'watched_show' || ev.type === 'rated_show') {
                if (seen.has(key)) continue;
                seen.add(key);
            }
            deduped.push(ev);
        }

        return successResponse(deduped.slice(0, 80));
    } catch (error) {
        console.error('GET /api/activity/feed error:', error);
        return serverError();
    }
}
