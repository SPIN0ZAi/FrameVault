import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';
import { syncTMDBMovie } from '@/lib/sync-movie';
import { checkAndAwardAchievements } from '@/lib/achievements';

// POST /api/watched/[movieId] — mark as watched
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ movieId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { movieId: tmdbId } = await params;

        const localMovieId = await syncTMDBMovie(tmdbId);

        const watched = await prisma.watchedMovie.upsert({
            where: { userId_movieId: { userId: session.user.id, movieId: localMovieId } },
            create: { userId: session.user.id, movieId: localMovieId },
            update: { watchedAt: new Date() },
        });

        // Auto-remove from watchlist when marking as watched
        await prisma.watchlistItem.deleteMany({
            where: { userId: session.user.id, movieId: localMovieId },
        });

        checkAndAwardAchievements(session.user.id).catch(() => null);

        return successResponse(watched);
    } catch (error) {
        console.error('POST watched error:', error);
        return serverError();
    }
}

// DELETE /api/watched/[movieId] — unmark as watched
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ movieId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { movieId: tmdbId } = await params;

        const localMovieId = await syncTMDBMovie(tmdbId);

        await prisma.watchedMovie.deleteMany({
            where: { userId: session.user.id, movieId: localMovieId },
        });

        return successResponse({ removed: true });
    } catch (error) {
        console.error('DELETE watched error:', error);
        return serverError();
    }
}
