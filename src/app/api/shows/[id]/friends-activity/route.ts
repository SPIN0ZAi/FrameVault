import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';

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

        console.log(`[friends-activity] Start for show ${tmdbShowId}, user ${session.user.id}`);

        // Get following list
        const follows = await prisma.follows.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
        });
        const followingIds = follows.map(f => f.followingId);
        console.log(`[friends-activity] User follows ${followingIds.length} people.`);
        if (followingIds.length === 0) return successResponse({ watched: [], watchlisted: [] });

        // Unlike movies, shows don't have a central table.
        // We'll query directly using the tmdbShowId, which is indexed on all relevant tables.

        console.log(`[friends-activity] Querying for tmdbShowId: ${tmdbShowId} and ${followingIds.length} friend IDs.`);

        // Parallel: watched entries, ratings, watchlist entries for followed users
        const [watchedEntries, ratings, watchlistEntries] = await Promise.all([
            prisma.watchedShow.findMany({
                where: { tmdbShowId, userId: { in: followingIds } },
                select: {
                    userId: true,
                    watchedAt: true,
                    user: { select: { id: true, username: true, avatarUrl: true } },
                },
                orderBy: { watchedAt: 'desc' },
            }),
            prisma.showRating.findMany({
                where: { tmdbShowId, userId: { in: followingIds } },
                select: { userId: true, value: true },
            }),
            prisma.showWatchlistItem.findMany({
                where: { tmdbShowId, userId: { in: followingIds } },
                select: {
                    userId: true,
                    addedAt: true,
                    user: { select: { id: true, username: true, avatarUrl: true } },
                },
                orderBy: { addedAt: 'desc' },
            }),
        ]);

        console.log(`[friends-activity] Found ${watchedEntries.length} watched, ${ratings.length} ratings, ${watchlistEntries.length} watchlist items.`);

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

        console.log(`[friends-activity] Final result: ${watched.length} watched, ${watchlisted.length} watchlisted.`);

        return successResponse({ watched, watchlisted });
    } catch (error) {
        console.error('!!! CRITICAL: GET /api/shows/[id]/friends-activity error:', error);
        return serverError();
    }
}
