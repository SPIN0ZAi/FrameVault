import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ratingSchema } from '@/lib/validators';
import { successResponse, validationError, unauthorizedError, serverError } from '@/lib/api-response';
import { syncTMDBMovie } from '@/lib/sync-movie';
import { checkAndAwardAchievements } from '@/lib/achievements';

// POST /api/movies/[id]/rating — upsert rating
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { id: tmdbId } = await params;
        const body = await request.json();
        const result = ratingSchema.safeParse(body);
        if (!result.success) {
            return validationError(result.error.issues[0].message);
        }

        const localMovieId = await syncTMDBMovie(tmdbId);

        const rating = await prisma.rating.upsert({
            where: { userId_movieId: { userId: session.user.id, movieId: localMovieId } },
            create: { userId: session.user.id, movieId: localMovieId, value: result.data.value },
            update: { value: result.data.value },
        });

        checkAndAwardAchievements(session.user.id).catch(() => null);

        return successResponse(rating);
    } catch (error) {
        console.error('POST rating error:', error);
        return serverError();
    }
}

// DELETE /api/movies/[id]/rating — remove rating
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { id: tmdbId } = await params;

        // If trying to delete, we need the local ID. Syncing is safe because if it doesn't exist locally, it wouldn't have a rating.
        const localMovieId = await syncTMDBMovie(tmdbId);

        await prisma.rating.deleteMany({
            where: { userId: session.user.id, movieId: localMovieId },
        });

        return successResponse({ removed: true });
    } catch (error) {
        console.error('DELETE rating error:', error);
        return serverError();
    }
}
