import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, notFoundError, serverError, errorResponse } from '@/lib/api-response';

// PATCH /api/reviews/[reviewId] — edit review content / spoiler flag
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { reviewId } = await params;
        const { content, containsSpoilers } = await request.json();

        if (!content || content.trim().length < 10) {
            return errorResponse(
                { code: 'VALIDATION', message: 'Review must be at least 10 characters' },
                400
            );
        }

        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) return notFoundError('Review');
        if (review.userId !== session.user.id) return unauthorizedError();

        const updated = await prisma.review.update({
            where: { id: reviewId },
            data: {
                content: content.trim(),
                containsSpoilers: containsSpoilers ?? review.containsSpoilers,
            },
            include: {
                movie: { select: { id: true, tmdbId: true, title: true, year: true, posterUrl: true } },
            },
        });

        // Attach the rating so callers get the full Review shape
        const rating = await prisma.rating.findUnique({
            where: { userId_movieId: { userId: session.user.id, movieId: review.movieId } },
            select: { value: true },
        });

        return successResponse({ ...updated, rating: rating?.value ?? null });
    } catch (error) {
        console.error('PATCH /api/reviews/[reviewId] error:', error);
        return serverError();
    }
}

// DELETE /api/reviews/[reviewId] — delete a review
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { reviewId } = await params;

        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) return notFoundError('Review');
        if (review.userId !== session.user.id) return unauthorizedError();

        await prisma.review.delete({ where: { id: reviewId } });
        return successResponse({ deleted: true });
    } catch (error) {
        console.error('DELETE /api/reviews/[reviewId] error:', error);
        return serverError();
    }
}
