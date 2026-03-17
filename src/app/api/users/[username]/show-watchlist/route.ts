import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

// GET /api/users/[username]/show-watchlist
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });
        if (!user) return notFoundError('User');

        const [items, totalCount, customPosters] = await Promise.all([
            prisma.showWatchlistItem.findMany({
                where: { userId: user.id },
                orderBy: { addedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.showWatchlistItem.count({ where: { userId: user.id } }),
            prisma.showCustomPoster.findMany({ where: { userId: user.id } }).catch(() => []),
        ]);

        const customPosterMap = new Map(customPosters.map(p => [p.tmdbShowId, p.posterUrl]));
        const data = items.map(item => ({
            ...item,
            posterUrl: customPosterMap.get(item.tmdbShowId) ?? item.posterUrl,
        }));

        return successResponse(data, {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error('GET user show-watchlist error:', error);
        return serverError();
    }
}
