import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });
        if (!user) return notFoundError('User');

        const [reviews, totalCount] = await Promise.all([
            prisma.review.findMany({
                where: { userId: user.id },
                include: {
                    movie: {
                        select: {
                            id: true,
                            tmdbId: true,
                            title: true,
                            year: true,
                            posterUrl: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where: { userId: user.id } }),
        ]);

        // Attach the user's rating to each review
        const reviewsWithRatings = await Promise.all(
            reviews.map(async (review) => {
                const rating = await prisma.rating.findUnique({
                    where: { userId_movieId: { userId: user.id, movieId: review.movieId } },
                    select: { value: true },
                });
                return { ...review, rating: rating?.value ?? null };
            })
        );

        return successResponse(reviewsWithRatings, {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error('GET user reviews error:', error);
        return serverError();
    }
}
