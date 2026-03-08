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

        // When filtering by minRating, we need to join with ratings
        const whereClause = minRating
            ? {
                userId: user.id,
                movie: {
                    ratings: {
                        some: { userId: user.id, value: { gte: minRating } },
                    },
                },
            }
            : { userId: user.id };

        // Full movie select (reused in both paths)
        const movieSelect = {
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
        } as const;

        // ── Rating sort: must sort globally across ALL pages ──────────────────
        if (sort === 'rating_desc' || sort === 'rating_asc') {
            // Step 1: fetch all watched IDs + user rating (lightweight)
            const allWatched = await prisma.watchedMovie.findMany({
                where: whereClause,
                select: {
                    id: true,
                    movie: {
                        select: {
                            ratings: {
                                where: { userId: user.id },
                                select: { value: true },
                            },
                        },
                    },
                },
            });

            // Sort entirely in memory so we respect the global order
            allWatched.sort((a, b) => {
                const ra = a.movie.ratings?.[0]?.value ?? -1;
                const rb = b.movie.ratings?.[0]?.value ?? -1;
                return sort === 'rating_desc' ? rb - ra : ra - rb;
            });

            const totalCount = allWatched.length;
            const pageSlice = allWatched.slice((page - 1) * limit, page * limit);
            const pageIds = pageSlice.map(w => w.id);

            // Step 2: fetch full details only for this page's IDs
            const watched = await prisma.watchedMovie.findMany({
                where: { id: { in: pageIds } },
                include: { movie: { select: movieSelect } },
            });

            // Re-order to match the globally-sorted slice order
            const idOrder = new Map(pageIds.map((id, i) => [id, i]));
            watched.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

            const data = watched.map(w => ({
                ...w,
                rating: w.movie.ratings?.[0]?.value ?? null,
            }));

            return successResponse(data, {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            });
        }

        // ── All other sorts: let the DB do it ────────────────────────────────
        const orderBy: object =
            sort === 'date_asc'   ? { watchedAt: 'asc' } :
            sort === 'title_asc'  ? { movie: { title: 'asc' } } :
            sort === 'title_desc' ? { movie: { title: 'desc' } } :
            { watchedAt: 'desc' }; // date_desc default

        const [watched, totalCount] = await Promise.all([
            prisma.watchedMovie.findMany({
                where: whereClause,
                include: { movie: { select: movieSelect } },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.watchedMovie.count({ where: whereClause }),
        ]);

        const data = watched.map(w => ({
            ...w,
            rating: w.movie.ratings?.[0]?.value ?? null,
        }));

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
