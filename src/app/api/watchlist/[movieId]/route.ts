import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';
import { syncTMDBMovie } from '@/lib/sync-movie';

// POST /api/watchlist/[movieId] — add to watchlist
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ movieId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { movieId: tmdbId } = await params;

        const localMovieId = await syncTMDBMovie(tmdbId);

        const item = await prisma.watchlistItem.upsert({
            where: { userId_movieId: { userId: session.user.id, movieId: localMovieId } },
            create: { userId: session.user.id, movieId: localMovieId },
            update: {},
        });

        return successResponse(item);
    } catch (error) {
        console.error('POST watchlist error:', error);
        return serverError();
    }
}

// DELETE /api/watchlist/[movieId] — remove from watchlist
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ movieId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { movieId: tmdbId } = await params;

        const localMovieId = await syncTMDBMovie(tmdbId);

        await prisma.watchlistItem.deleteMany({
            where: { userId: session.user.id, movieId: localMovieId },
        });

        return successResponse({ removed: true });
    } catch (error) {
        console.error('DELETE watchlist error:', error);
        return serverError();
    }
}
