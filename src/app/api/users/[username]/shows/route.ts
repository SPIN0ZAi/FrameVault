import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

// GET /api/users/[username]/shows
// Params: page, limit, sort (date_desc|date_asc|title_asc|title_desc|rating_desc), minRating
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const page      = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit     = Math.min(200, parseInt(searchParams.get('limit') || '20'));
        const sort      = searchParams.get('sort') || 'date_desc';
        const minRating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : null;

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });
        if (!user) return notFoundError('User');

        // Always fetch ratings so we can include them and badge the posters
        const allRatings = await prisma.showRating.findMany({
            where: { userId: user.id },
            select: { tmdbShowId: true, value: true },
        });
        const ratingMap = new Map(allRatings.map(r => [r.tmdbShowId, r.value]));

        // ── minRating filter: fetch only shows whose rating meets the threshold ─
        const customPosters = await prisma.showCustomPoster.findMany({ where: { userId: user.id } }).catch(() => []);
        const customPosterMap = new Map(customPosters.map(p => [p.tmdbShowId, p.posterUrl]));

        if (minRating !== null) {
            const qualifyingIds = allRatings
                .filter(r => r.value >= minRating)
                .map(r => r.tmdbShowId);
            const allMatchingShows = await prisma.watchedShow.findMany({
                where: { userId: user.id, tmdbShowId: { in: qualifyingIds } },
            });
            const withRatings = allMatchingShows.map(s => ({
                ...s,
                rating: ratingMap.get(s.tmdbShowId) ?? null,
                posterUrl: customPosterMap.get(s.tmdbShowId) ?? s.posterUrl,
            }));
            // Default sort for filtered view: highest-rated first
            withRatings.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
            const totalCount = withRatings.length;
            const paged = withRatings.slice((page - 1) * limit, page * limit);
            return successResponse(paged, { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) });
        }

        // Rating sort: fetch all, join + sort in memory, then paginate
        if (sort === 'rating_desc') {
            const allShows = await prisma.watchedShow.findMany({ where: { userId: user.id } });
            const withRatings = allShows.map(s => ({
                ...s,
                rating: ratingMap.get(s.tmdbShowId) ?? null,
                posterUrl: customPosterMap.get(s.tmdbShowId) ?? s.posterUrl,
            }));
            withRatings.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
            const totalCount = withRatings.length;
            const paged = withRatings.slice((page - 1) * limit, page * limit);
            return successResponse(paged, { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) });
        }

        const orderBy =
            sort === 'date_asc'   ? { watchedAt: 'asc' as const } :
            sort === 'title_asc'  ? { title: 'asc' as const } :
            sort === 'title_desc' ? { title: 'desc' as const } :
            { watchedAt: 'desc' as const };

        const [shows, totalCount] = await Promise.all([
            prisma.watchedShow.findMany({
                where: { userId: user.id },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.watchedShow.count({ where: { userId: user.id } }),
        ]);

        const data = shows.map(s => ({
            ...s,
            rating: ratingMap.get(s.tmdbShowId) ?? null,
            posterUrl: customPosterMap.get(s.tmdbShowId) ?? s.posterUrl,
        }));

        return successResponse(data, {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error('GET user shows error:', error);
        return serverError();
    }
}
