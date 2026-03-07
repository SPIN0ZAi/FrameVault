import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

// GET /api/users/[username]/show-favorites — public
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return successResponse([]);

        const favorites = await prisma.userShowFavorite.findMany({
            where: { userId: user.id },
            orderBy: { position: 'asc' },
        });

        // Overlay custom posters if the user has set one
        const tmdbShowIds = favorites.map(f => f.tmdbShowId);
        const customPosters = tmdbShowIds.length > 0
            ? await prisma.showCustomPoster.findMany({
                where: { userId: user.id, tmdbShowId: { in: tmdbShowIds } },
                select: { tmdbShowId: true, posterUrl: true },
              })
            : [];
        const customPosterMap = new Map(customPosters.map(cp => [cp.tmdbShowId, cp.posterUrl]));

        const data = favorites.map(f => ({
            ...f,
            posterUrl: customPosterMap.get(f.tmdbShowId) ?? f.posterUrl,
        }));

        return successResponse(data);
    } catch {
        return serverError();
    }
}
