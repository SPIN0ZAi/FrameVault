import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, unauthorizedError, notFoundError, serverError, errorResponse } from '@/lib/api-response';

type Ctx = { params: Promise<{ reviewId: string }> };

// PATCH /api/show-reviews/[reviewId] — edit a show review
export async function PATCH(
    request: NextRequest,
    { params }: Ctx
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

        const review = await prisma.showReview.findUnique({ where: { id: reviewId } });
        if (!review) return notFoundError('Review');
        if (review.userId !== session.user.id) return unauthorizedError();

        const updated = await prisma.showReview.update({
            where: { id: reviewId },
            data: {
                content: content.trim(),
                containsSpoilers: containsSpoilers ?? review.containsSpoilers,
            },
        });

        return successResponse(updated);
    } catch (error) {
        console.error('PATCH /api/show-reviews/[reviewId] error:', error);
        return serverError();
    }
}

// DELETE /api/show-reviews/[reviewId] — delete a show review
export async function DELETE(
    _request: NextRequest,
    { params }: Ctx
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { reviewId } = await params;

        const review = await prisma.showReview.findUnique({ where: { id: reviewId } });
        if (!review) return notFoundError('Review');
        if (review.userId !== session.user.id) return unauthorizedError();

        await prisma.showReview.delete({ where: { id: reviewId } });
        return successResponse({ deleted: true });
    } catch (error) {
        console.error('DELETE /api/show-reviews/[reviewId] error:', error);
        return serverError();
    }
}
