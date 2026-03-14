import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ratingSchema } from '@/lib/validators';
import { successResponse, validationError, unauthorizedError, serverError } from '@/lib/api-response';
import { getShowDetails, getTMDBImageUrl } from '@/lib/tmdb';

// POST /api/shows/[id]/rating — upsert rating
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { id } = await params;
        const tmdbShowId = parseInt(id);
        if (isNaN(tmdbShowId)) return validationError('Invalid show ID');

        const body = await request.json();
        const result = ratingSchema.safeParse(body);
        if (!result.success) return validationError(result.error.issues[0].message);

        const rating = await prisma.showRating.upsert({
            where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
            create: { userId: session.user.id, tmdbShowId, value: result.data.value },
            update: { value: result.data.value },
        });

        // Ensure show metadata exists so activity/profile views are populated
        let title = 'Unknown Show';
        let year: number | null = null;
        let posterUrl: string | null = null;
        try {
            const show = await getShowDetails(tmdbShowId);
            title = show.name || title;
            year = show.first_air_date ? parseInt(show.first_air_date.substring(0, 4)) : null;
            posterUrl = getTMDBImageUrl(show.poster_path, 'w342');
        } catch (metaError) {
            console.warn('POST show rating metadata fetch failed:', metaError);
        }

        try {
            await prisma.watchedShow.upsert({
                where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
                create: {
                    userId: session.user.id,
                    tmdbShowId,
                    title,
                    year,
                    posterUrl,
                    watchedAt: rating.createdAt ?? new Date(),
                    rewatchCount: 0,
                    lastRewatchedAt: null,
                },
                update: { title, year, posterUrl },
            });
        } catch (watchedError) {
            console.warn('POST show rating watchedShow upsert failed:', watchedError);
        }

        return successResponse(rating);
    } catch (error) {
        console.error('POST show rating error:', error);
        return serverError();
    }
}

// DELETE /api/shows/[id]/rating — remove rating
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { id } = await params;
        const tmdbShowId = parseInt(id);

        await prisma.showRating.deleteMany({
            where: { userId: session.user.id, tmdbShowId },
        });

        return successResponse({ removed: true });
    } catch (error) {
        console.error('DELETE show rating error:', error);
        return serverError();
    }
}
