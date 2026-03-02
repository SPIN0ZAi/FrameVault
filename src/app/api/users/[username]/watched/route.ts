import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

// GET /api/users/[username]/watched
// Params: page, limit (max 200), sort (date_desc|date_asc|title_asc|title_desc|rating_desc|rating_asc), minRating
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(200, parseInt(searchParams.get('limit') || '20'));
        const sort = searchParams.get('sort') || 'date_desc';
        const minRating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : null;

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!user) return notFoundError('User');

        // Build orderBy
        const orderBy: object =
            sort === 'date_asc' ? { watchedAt: 'asc' } :
            sort === 'title_asc' ? { movie: { title: 'asc' } } :
            sort === 'title_desc' ? { movie: { title: 'desc' } } :
            sort === 'rating_desc' ? [{ movie: { ratings: { _count: 'desc' } } }, { watchedAt: 'desc' }] :
            sort === 'rating_asc' ? [{ movie: { ratings: { _count: 'asc' } } }, { watchedAt: 'desc' }] :
            { watchedAt: 'desc' }; // date_desc default

        // When filtering by minRating, we need to join with ratings
        const whereClause: object = minRating
            ? {
                userId: user.id,
                movie: {
                    ratings: {
                        some: { userId: user.id, value: { gte: minRating } },
                    },
                },
            }
            : { userId: user.id };

        const [watched, totalCount] = await Promise.all([
            prisma.watchedMovie.findMany({
                where: whereClause,
                include: {
                    movie: {
                        select: {
                            id: true,
                            tmdbId: true,
                            title: true,
                            year: true,
                            posterUrl: true,
                            customPosters: {
                                where: { userId: user.id },
                                select: { posterUrl: true },
                            },
                            ratings: {
                                where: { userId: user.id },
                                select: { value: true },
                            },
                        },
                    },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.watchedMovie.count({ where: whereClause }),
        ]);

        // Flatten rating into each item for convenience
        const data = watched.map(w => ({
            ...w,
            rating: (w.movie.ratings?.[0]?.value) ?? null,
        }));

        // For rating sort, sort in memory since Prisma can't sort by a filtered relation's value
        if (sort === 'rating_desc' || sort === 'rating_asc') {
            data.sort((a, b) => {
                const ra = a.rating ?? -1;
                const rb = b.rating ?? -1;
                return sort === 'rating_desc' ? rb - ra : ra - rb;
            });
        }

        return successResponse(data, {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error('GET user watched error:', error);
        return serverError();
    }
}
