import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { reviewSchema } from '@/lib/validators';
import { successResponse, validationError, unauthorizedError, errorResponse, serverError } from '@/lib/api-response';
import { syncTMDBMovie } from '@/lib/sync-movie';
import { checkAndAwardAchievements } from '@/lib/achievements';

// GET /api/movies/[id]/reviews — list reviews
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tmdbId } = await params;
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));

        let localMovieId = null;
        try {
            // we look up using findUnique directly first to avoid unnecessary TMDB fetches on read, but this is fine.
            localMovieId = await syncTMDBMovie(tmdbId);
        } catch {
            // Movie doesn't exist locally, so no reviews
            return successResponse([], {
                page,
                limit,
                totalCount: 0,
                totalPages: 0,
            });
        }

        const [reviews, totalCount] = await Promise.all([
            prisma.review.findMany({
                where: { movieId: localMovieId },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where: { movieId: localMovieId } }),
        ]);

        return successResponse(reviews, {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error('GET reviews error:', error);
        return serverError();
    }
}

// POST /api/movies/[id]/reviews — write a review
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { id: tmdbId } = await params;
        const body = await request.json();
        const result = reviewSchema.safeParse(body);

        if (!result.success) {
            return validationError(result.error.issues[0].message);
        }

        const localMovieId = await syncTMDBMovie(tmdbId);

        // Check if user already reviewed
        const existing = await prisma.review.findUnique({
            where: { userId_movieId: { userId: session.user.id, movieId: localMovieId } },
        });

        if (existing) {
            return errorResponse(
                { code: 'ALREADY_REVIEWED', message: 'You have already reviewed this movie. Edit your existing review instead.' },
                409
            );
        }

        const review = await prisma.review.create({
            data: {
                userId: session.user.id,
                movieId: localMovieId,
                content: result.data.content,
                containsSpoilers: result.data.containsSpoilers,
            },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
            },
        });

        checkAndAwardAchievements(session.user.id).catch(() => null);

        return successResponse(review);
    } catch (error) {
        console.error('POST review error:', error);
        return serverError();
    }
}
