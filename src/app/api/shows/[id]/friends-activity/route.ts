import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';
import { getShowDetails } from '@/lib/tmdb';

// GET /api/shows/[id]/friends-activity — people you follow who watched/watchlisted this show
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { id } = await params;
        const tmdbShowId = parseInt(id);
        if (isNaN(tmdbShowId)) return successResponse({ watched: [], watchlisted: [] });

        // Get following list
        const follows = await prisma.follows.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
        });
        const followingIds = follows.map(f => f.followingId);
        if (followingIds.length === 0) return successResponse({ watched: [], watchlisted: [] });

        // Try to be resilient to legacy / mismatched IDs by also matching on title/year
        let titleFallback: string | null = null;
        let yearFallback: number | null = null;
        try {
            const show = await getShowDetails(tmdbShowId);
            titleFallback = show.name || null;
            yearFallback = show.first_air_date ? parseInt(show.first_air_date.substring(0, 4)) : null;
        } catch {
            // If TMDB lookup fails, we simply fall back to ID-only queries below
        }

        const watchedEntries = await prisma.watchedShow.findMany({
            where: {
                userId: { in: followingIds },
                OR: [
                    { tmdbShowId },
                    ...(titleFallback
                        ? [{
                              title: { equals: titleFallback, mode: 'insensitive' as const },
                              ...(yearFallback !== null ? { year: yearFallback } : {}),
                          }]
                        : []),
                ],
            },
            include: { user: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { watchedAt: 'desc' },
        });

        const candidateTmdbIds = Array.from(
            new Set([
                tmdbShowId,
                ...watchedEntries.map(w => w.tmdbShowId).filter(id => typeof id === 'number' && !Number.isNaN(id)),
            ]),
        );

        // Parallel: ratings and watchlist entries for any of the candidate IDs
        const [ratings, watchlistEntries] = await Promise.all([
            prisma.showRating.findMany({
                where: { tmdbShowId: { in: candidateTmdbIds }, userId: { in: followingIds } },
                select: { userId: true, value: true },
            }),
            prisma.showWatchlistItem.findMany({
                where: { tmdbShowId: { in: candidateTmdbIds }, userId: { in: followingIds } },
                include: { user: { select: { id: true, username: true, avatarUrl: true } } },
                orderBy: { addedAt: 'desc' },
            }),
        ]);

        const ratingMap = new Map(ratings.map(r => [r.userId, r.value]));
        const watchedUserIds = new Set(watchedEntries.map(w => w.userId));

        const watched = watchedEntries.map(w => ({
            user: w.user,
            rating: ratingMap.get(w.userId) ?? null,
        }));

        // Only include watchlisted users who haven't watched
        const watchlisted = watchlistEntries
            .filter(w => !watchedUserIds.has(w.userId))
            .map(w => ({ user: w.user }));

        return successResponse({ watched, watchlisted });
    } catch (error) {
        console.error('GET /api/shows/[id]/friends-activity error:', error);
        return serverError();
    }
}
