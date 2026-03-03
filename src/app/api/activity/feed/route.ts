import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';
import { getTMDBImageUrl } from '@/lib/tmdb';

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

        const [watched, ratings, reviews] = await Promise.all([
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
        ]);

        // Helper: resolve the event user's custom poster, or fall back to default
        const resolveposter = (movie: { posterUrl: string | null; customPosters: { userId: string; posterUrl: string }[] }, userId: string) =>
            movie.customPosters.find(cp => cp.userId === userId)?.posterUrl ?? movie.posterUrl;

        type ActivityEvent = {
            id: string;
            type: 'watched' | 'rated' | 'reviewed';
            date: string;
            user: { id: string; username: string; avatarUrl: string | null };
            movie: { id: string; tmdbId: number | null; title: string; year: number; posterUrl: string | null };
            rating?: number;
            reviewContent?: string;
            containsSpoilers?: boolean;
        };

        const events: ActivityEvent[] = [
            ...watched.map(w => ({
                id: `watched-${w.id}`,
                type: 'watched' as const,
                date: w.watchedAt.toISOString(),
                user: w.user,
                movie: { ...w.movie, posterUrl: resolveposter(w.movie, w.user.id) },
            })),
            ...ratings.map(r => ({
                id: `rated-${r.id}`,
                type: 'rated' as const,
                date: r.createdAt.toISOString(),
                user: r.user,
                movie: { ...r.movie, posterUrl: resolveposter(r.movie, r.user.id) },
                rating: r.value,
            })),
            ...reviews.map(r => ({
                id: `reviewed-${r.id}`,
                type: 'reviewed' as const,
                date: r.createdAt.toISOString(),
                user: r.user,
                movie: { ...r.movie, posterUrl: resolveposter(r.movie, r.user.id) },
                reviewContent: r.content,
                containsSpoilers: r.containsSpoilers,
            })),
        ];

        // Sort by date desc
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Deduplicate: collapse watched+rated same movie+user within 1 hour into one entry
        const deduped: ActivityEvent[] = [];
        const seen = new Set<string>();
        for (const ev of events) {
            const hourBucket = Math.floor(new Date(ev.date).getTime() / (60 * 60 * 1000));
            const key = `${ev.user.id}-${ev.movie.id}-${hourBucket}`;
            if (ev.type === 'watched' || ev.type === 'rated') {
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
