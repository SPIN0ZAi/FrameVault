import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncTMDBMovie } from '@/lib/sync-movie';
import { successResponse, errorResponse, serverError } from '@/lib/api-response';

// POST /api/movies/[id]/rewatch — increment rewatch count (movie must be watched first)
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return errorResponse({ code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        }

        const { id: tmdbIdStr } = await params;
        const tmdbId = parseInt(tmdbIdStr);
        if (isNaN(tmdbId)) {
            return errorResponse({ code: 'BAD_REQUEST', message: 'Invalid movie id' }, 400);
        }

        const userId = session.user.id;

        // Ensure the movie exists locally
        const movieId = await syncTMDBMovie(tmdbId);
        if (!movieId) {
            return errorResponse({ code: 'NOT_FOUND', message: 'Movie not found' }, 404);
        }

        // Upsert: if not watched yet, create with rewatchCount 1; otherwise increment
        const watched = await prisma.watchedMovie.upsert({
            where: { userId_movieId: { userId, movieId } },
            create: {
                userId,
                movieId,
                watchedAt: new Date(),
                rewatchCount: 1,
                lastRewatchedAt: new Date(),
            },
            update: {
                rewatchCount: { increment: 1 },
                lastRewatchedAt: new Date(),
            },
            select: { rewatchCount: true, lastRewatchedAt: true },
        });

        // Auto-remove from watchlist when rewatching
        await prisma.watchlistItem.deleteMany({
            where: { userId, movieId },
        });

        return successResponse({
            rewatchCount: watched.rewatchCount,
            lastRewatchedAt: watched.lastRewatchedAt?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('POST /api/movies/[id]/rewatch error:', error);
        return serverError();
    }
}

// DELETE /api/movies/[id]/rewatch — decrement rewatch count (min 0)
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return errorResponse({ code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        }

        const { id: tmdbIdStr } = await params;
        const tmdbId = parseInt(tmdbIdStr);
        if (isNaN(tmdbId)) {
            return errorResponse({ code: 'BAD_REQUEST', message: 'Invalid movie id' }, 400);
        }

        const userId = session.user.id;

        const movie = await prisma.movie.findUnique({ where: { tmdbId }, select: { id: true } });
        if (!movie) {
            return errorResponse({ code: 'NOT_FOUND', message: 'Movie not found' }, 404);
        }

        const existing = await prisma.watchedMovie.findUnique({
            where: { userId_movieId: { userId, movieId: movie.id } },
            select: { rewatchCount: true },
        });

        if (!existing || existing.rewatchCount <= 0) {
            return errorResponse({ code: 'BAD_REQUEST', message: 'No rewatch to undo' }, 400);
        }

        const newCount = existing.rewatchCount - 1;
        const updated = await prisma.watchedMovie.update({
            where: { userId_movieId: { userId, movieId: movie.id } },
            data: {
                rewatchCount: newCount,
                lastRewatchedAt: newCount === 0 ? null : undefined,
            },
            select: { rewatchCount: true, lastRewatchedAt: true },
        });

        return successResponse({
            rewatchCount: updated.rewatchCount,
            lastRewatchedAt: updated.lastRewatchedAt?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('DELETE /api/movies/[id]/rewatch error:', error);
        return serverError();
    }
}
